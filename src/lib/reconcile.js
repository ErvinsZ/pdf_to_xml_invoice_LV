/* Client-side reconciliation of an extracted invoice.
 *
 * Mirrors the backend checks so problems show up while the user edits, before
 * POST /generate. Only fields that actually exist in the extraction are checked;
 * KEY lists the accepted aliases for each recognised numeric field.
 *
 * Flags carry a `code` and `params` rather than text, so the UI can render them
 * in the active language. */

/* ---------- decimal helpers (float-safe enough for display + 0.01 flagging) */
const round = (x, n) => {
  const f = 10 ** n;
  return Math.round(x * f + (x >= 0 ? 1e-6 : -1e-6)) / f;
};
export const r2 = (x) => round(x, 2);
export const money = (x) => r2(x).toFixed(2);
export const num = (v) => {
  if (v === null || v === undefined || v === "") return NaN;
  const n = parseFloat(String(v).replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

export const LINE_TOL = 0.01;
export const DOC_TOL = 0.02;

export const KEY = {
  qty: ["quantity", "qty"],
  price: ["net_unit_price", "unit_price", "price"],
  linePrinted: ["printed_line_total", "line_total", "amount"],
  vatCat: ["vat_category", "tax_category"],
  vatPct: ["vat_percent", "tax_percent", "vat_rate"],
  netPrinted: ["net_excl_vat", "net", "taxable"],
  vatPrinted: ["total_vat", "vat", "tax"],
  totPrinted: ["grand_total_incl_vat", "total", "payable"],
};

const pick = (obj, names) => {
  if (!obj) return undefined;
  for (const n of names) if (obj[n] !== undefined) return obj[n];
  return undefined;
};

export const keyOf = (obj, names) => {
  if (!obj) return null;
  for (const n of names) if (obj[n] !== undefined) return n;
  return null;
};

/* True when the customer object has ID fields but both are empty. */
export const isMissingRecipientId = (cust) =>
  !!cust &&
  (cust.vat_number !== undefined || cust.reg_number !== undefined) &&
  !cust.vat_number &&
  !cust.reg_number;

const mismatch = (computed, printed) => ({
  computed: money(computed),
  printed: money(printed),
  delta: money(Math.abs(computed - printed)),
});

export function reconcile(ext) {
  const flags = [];
  const lineLevel = {};
  if (!ext) return { flags, lineLevel, net: NaN, vat: NaN, total: NaN };

  const lines = Array.isArray(ext.lines) ? ext.lines : [];
  const addLineFlag = (i, level) => {
    if (level === "error" || lineLevel[i] !== "error") lineLevel[i] = level;
  };

  const lineNet = lines.map((l) => {
    const q = num(pick(l, KEY.qty));
    const p = num(pick(l, KEY.price));
    return Number.isFinite(q) && Number.isFinite(p) ? q * p : NaN;
  });

  lines.forEach((l, i) => {
    const printed = num(pick(l, KEY.linePrinted));
    if (!Number.isFinite(lineNet[i]) || !Number.isFinite(printed)) return;
    if (Math.abs(r2(lineNet[i]) - r2(printed)) > LINE_TOL) {
      flags.push({
        level: "error",
        code: "LINE_MISMATCH",
        line: i,
        params: { line: i + 1, computed: money(lineNet[i]), printed: money(printed) },
      });
      addLineFlag(i, "error");
    }
  });

  // Group lines by VAT category + rate, then sum each group with cumulative
  // rounding so the result matches how the backend computes taxable amounts.
  let net = NaN, vat = NaN, total = NaN;
  if (lineNet.some((x) => Number.isFinite(x))) {
    const groups = {};
    lines.forEach((l, i) => {
      if (!Number.isFinite(lineNet[i])) return;
      const pct = num(pick(l, KEY.vatPct));
      const cat = pick(l, KEY.vatCat) ?? "";
      const key = `${cat}|${Number.isFinite(pct) ? pct : 0}`;
      (groups[key] = groups[key] || []).push(i);
    });
    net = 0; vat = 0;
    Object.entries(groups).forEach(([key, idxs]) => {
      const pct = num(key.split("|")[1]) || 0;
      let cum = 0, prev = 0, taxable = 0;
      idxs.forEach((i) => {
        cum += lineNet[i];
        const cur = r2(cum);
        taxable += cur - prev;
        prev = cur;
      });
      taxable = r2(taxable);
      net += taxable;
      vat += r2((taxable * pct) / 100);
    });
    net = r2(net); vat = r2(vat); total = r2(net + vat);
  }

  const pt = ext.printed_totals || {};
  const pNet = num(pick(pt, KEY.netPrinted));
  const pVat = num(pick(pt, KEY.vatPrinted));
  const pTot = num(pick(pt, KEY.totPrinted));

  if (Number.isFinite(net) && Number.isFinite(pNet) && Math.abs(net - pNet) > DOC_TOL)
    flags.push({ level: "error", code: "NET_MISMATCH", params: mismatch(net, pNet) });
  if (Number.isFinite(vat) && Number.isFinite(pVat) && Math.abs(vat - pVat) > DOC_TOL)
    flags.push({ level: "warning", code: "VAT_MISMATCH", params: mismatch(vat, pVat) });
  if (Number.isFinite(total) && Number.isFinite(pTot) && Math.abs(total - pTot) > DOC_TOL)
    flags.push({ level: "error", code: "TOTAL_MISMATCH", params: mismatch(total, pTot) });

  if (isMissingRecipientId(ext.customer))
    flags.push({ level: "error", code: "NO_RECIPIENT_ID" });
  if (lines.length === 0)
    flags.push({ level: "warning", code: "NO_LINES" });

  return { flags, lineLevel, net, vat, total, pNet, pVat, pTot, lineNet };
}
