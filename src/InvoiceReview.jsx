import { useCallback, useMemo, useRef, useState } from "react";
import DropOverlay from "./components/DropOverlay";
import ExtractionProgress from "./components/ExtractionProgress";
import Header from "./components/Header";
import ReviewPanel from "./components/ReviewPanel";
import SourcePanel from "./components/SourcePanel";
import Toast from "./components/Toast";
import useFileDrop from "./hooks/useFileDrop";
import useInvoiceEditor from "./hooks/useInvoiceEditor";
import { useI18n } from "./i18n/context";
import { API_BASE, ApiError, extractInvoice, generateXml, pollHealth } from "./lib/api";
import { reconcile } from "./lib/reconcile";

/* Invoice → Peppol (Horizon) review screen.
 *
 * Flow: upload PDF → POST /extract → review & correct here → POST /generate → XML
 *
 * The screen is empty until /extract returns, then renders whatever fields the
 * response contains. */

const EXTRACT_ERROR_KEYS = {
  400: "errors.badRequest",
  401: "errors.providerAuth",
  415: "errors.notPdf",
  429: "errors.rateLimited",
  502: "errors.extractionFailed",
};

/* Maps a failed request to a toast message key + params. */
const describeError = (err, keys = {}) => {
  if (!(err instanceof ApiError)) return ["errors.unreachable"];
  if (err.status === 400 && !err.detail) return ["errors.server", { status: err.status }];
  return [keys[err.status] ?? "errors.server", { status: err.status, detail: err.detail }];
};

const isPdf = (file) => file.type === "application/pdf" || /\.pdf$/i.test(file.name);

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function InvoiceReview() {
  const { t } = useI18n();
  const { ext, setExt, editor } = useInvoiceEditor();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [serverProblems, setServerProblems] = useState(null);
  const [toast, setToast] = useState(null); // { kind, key, params, persist? }
  const [statusLog, setStatusLog] = useState([]); // live health-poll entries during extraction
  const logId = useRef(0);

  const rec = useMemo(() => reconcile(ext), [ext]);
  const errorCount = rec.flags.filter((f) => f.level === "error").length;

  const notify = (kind, key, params, { persist = false } = {}) => setToast({ kind, key, params, persist });
  const closeToast = useCallback(() => setToast(null), []);

  // A run of "pending" entries collapses into one row (updated in place);
  // any other kind appends a new row.
  const addLog = (key, params, kind) =>
    setStatusLog((prev) => {
      const last = prev[prev.length - 1];
      if (last?.kind === "pending" && kind === "pending")
        return [...prev.slice(0, -1), { ...last, key, params }];
      return [...prev, { key, params, kind, id: ++logId.current }];
    });

  const onFile = async (file) => {
    if (!isPdf(file)) { notify("error", "errors.notPdf"); return; }
    setExt(null);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(URL.createObjectURL(file));
    setServerProblems(null);
    if (!API_BASE) { notify("error", "toast.noApiBase"); return; }

    setBusy(true);
    setStatusLog([]);
    setToast(null);
    const healthPoll = new AbortController();
    pollHealth(addLog, healthPoll.signal).catch(() => {});

    try {
      const extraction = await extractInvoice(file, {
        onWake: () => notify("info", "toast.wakingExtract", undefined, { persist: true }),
      });
      setExt(extraction);
      notify("info", "toast.extracted", { count: extraction?.lines?.length ?? 0 });
    } catch (err) {
      notify("error", ...describeError(err, EXTRACT_ERROR_KEYS));
    } finally {
      healthPoll.abort();
      setBusy(false);
    }
  };

  const dragging = useFileDrop(onFile);

  const onGenerate = async () => {
    setServerProblems(null);
    if (!ext) return;
    if (!API_BASE) { notify("error", "toast.noApiBase"); return; }

    setBusy(true);
    try {
      const blob = await generateXml(ext, {
        onWake: () => notify("info", "toast.wakingGenerate", undefined, { persist: true }),
      });
      downloadBlob(blob, `${String(ext.invoice_id || "invoice").replace(/\s+/g, "_")}.xml`);
      notify("ok", "toast.generated");
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setServerProblems(err.body);
        notify("error", "toast.rejected");
      } else {
        notify("error", ...describeError(err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col font-sans text-ink bg-paper">
      <Header busy={busy} canGenerate={!!ext} errorCount={errorCount} onGenerate={onGenerate} />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <SourcePanel pdfUrl={pdfUrl} onFile={onFile} />

        <main className="flex-1 min-w-0 lg:overflow-y-auto px-4 sm:px-6 py-5 flex flex-col gap-4">
          {ext ? (
            <ReviewPanel ext={ext} rec={rec} serverProblems={serverProblems} editor={editor} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
              {busy ? (
                <ExtractionProgress log={statusLog} />
              ) : (
                <>
                  <h2 className="font-serif text-[19px] font-semibold text-ink">{t("review.emptyTitle")}</h2>
                  <p className="mt-2 text-muted text-[13.5px] leading-relaxed max-w-[360px]">{t("review.emptyBody")}</p>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      <Toast toast={toast} onClose={closeToast} />
      {dragging && <DropOverlay />}
    </div>
  );
}
