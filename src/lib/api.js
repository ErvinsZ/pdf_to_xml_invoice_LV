/* Backend client.
 *
 * The base URL comes from the build-time env var VITE_API_BASE (set in .env
 * locally and in the hosting provider's project settings). */

export const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

const endpoint = (path) => `${API_BASE}${path}`;

const HEALTH_POLL_INTERVAL_MS = 4000;
const HEALTH_POLL_MAX_ATTEMPTS = 20;
const WAKE_RETRIES = 4;
const WAKE_RETRY_DELAY_MS = 6000;
const WAKE_STATUSES = [502, 503, 504];

export class ApiError extends Error {
  constructor(status, body) {
    super(`HTTP ${status}`);
    this.status = status;
    this.body = body;
  }

  /* FastAPI puts its error message in `detail`. */
  get detail() {
    return typeof this.body?.detail === "string" ? this.body.detail : undefined;
  }
}

const errorFrom = async (res) => new ApiError(res.status, await res.json().catch(() => null));

/* The app's own errors (e.g. a 502 for a failed extraction) are JSON; a proxy
 * 502/503/504 while the container boots is not. Only the latter is retried,
 * otherwise a real extraction failure would be re-run several times. */
const isWakeResponse = (res) =>
  WAKE_STATUSES.includes(res.status) &&
  !(res.headers.get("content-type") || "").includes("application/json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Poll /health while extraction is running so the user sees live status
 * instead of a silent spinner. Runs concurrently with the /extract call and
 * stops when `signal` is aborted. onLog receives a translation key, its
 * params, and a kind ("pending" | "ok"). */
export async function pollHealth(onLog, signal) {
  onLog("health.checking", {}, "pending");
  for (let attempt = 0; !signal.aborted && attempt < HEALTH_POLL_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(HEALTH_POLL_INTERVAL_MS);
    if (signal.aborted) return;
    try {
      const res = await fetch(endpoint("/health"), { signal });
      if (signal.aborted) return;
      if (res.ok) {
        const data = await res.json().catch(() => ({ status: "ok" }));
        onLog("health.up", { status: data.status }, "ok");
        return;
      }
      onLog("health.badStatus", { status: res.status }, "pending");
    } catch (err) {
      if (err.name === "AbortError" || signal.aborted) return;
      onLog(
        attempt === 0 ? "health.starting" : "health.waiting",
        { seconds: (attempt + 1) * (HEALTH_POLL_INTERVAL_MS / 1000) },
        "pending",
      );
    }
  }
}

/* Free-tier hosts (Render) sleep after inactivity; the first request wakes the
 * container and can return 502/503/504 or fail outright for ~30-50s. Retry a
 * few times so the cold start is invisible to the user. onWake fires once when
 * we detect we're waiting for the server to come up. */
async function fetchWithWakeRetry(url, options, onWake) {
  let notified = false;
  const wake = async () => {
    if (!notified && onWake) { onWake(); notified = true; }
    await sleep(WAKE_RETRY_DELAY_MS);
  };
  for (let attempt = 0; attempt <= WAKE_RETRIES; attempt++) {
    const isLast = attempt === WAKE_RETRIES;
    try {
      const res = await fetch(url, options);
      if (isWakeResponse(res) && !isLast) {
        await wake();
        continue;
      }
      return res;
    } catch (err) {
      // network-level failure (server not answering yet) — retry if we can
      if (isLast) throw err;
      await wake();
    }
  }
}

/* POST /extract — returns the extraction object. */
export async function extractInvoice(file, { onWake } = {}) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetchWithWakeRetry(endpoint("/extract"), { method: "POST", body: fd }, onWake);
  if (!res.ok) throw await errorFrom(res);
  const data = await res.json();
  return data.extraction ?? data;
}

/* POST /generate — returns the XML as a Blob. A 422 (rejected invoice) throws
 * an ApiError whose body holds the server's problem lists. */
export async function generateXml(extraction, { onWake } = {}) {
  const res = await fetchWithWakeRetry(
    endpoint("/generate"),
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(extraction) },
    onWake,
  );
  if (!res.ok) throw await errorFrom(res);
  return res.blob();
}
