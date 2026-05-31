import React, { useMemo, useRef, useState } from "react";
import {
  Upload, FileText, AlertCircle, AlertTriangle, CheckCircle2,
  Plus, Trash2, Download, Settings, Loader2, ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * Invoice → Peppol (Horizon) review screen — Tailwind edition
 *
 * Flow:  upload PDF → POST /extract → review & correct here → POST /generate → XML
 *
 * Nothing is hardcoded. The screen is empty until /extract returns, then it
 * renders whatever fields the response contains. The only structural knowledge
 * is the set of *recognized* numeric keys used for the reconciliation check.
 *
 * Styling note: this version uses Tailwind utility classes. A few brand colours
 * (the warm paper palette) are applied with inline style only where Tailwind has
 * no matching token, so the look survives without extending tailwind.config.
 * ------------------------------------------------------------------ */

/* ---------- decimal helpers (float-safe enough for display + 0.01 flagging) */
const round = (x, n) => {
  const f = 10 ** n;
  return Math.round(x * f + (x >= 0 ? 1e-6 : -1e-6)) / f;
};
const r2 = (x) => round(x, 2);
const money = (x) => r2(x).toFixed(2);
const num = (v) => {
  if (v === null || v === undefined || v === "") return NaN;
  const n = parseFloat(String(v).replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

const LINE_TOL = 0.01;
const DOC_TOL = 0.02;

/* ---------- key recognition (the only "knowledge" of shape; nothing invented) */
const KEY = {
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
const keyOf = (obj, names) => {
  if (!obj) return null;
  for (const n of names) if (obj[n] !== undefined) return n;
  return null;
};

/* ---------- reconciliation — only over fields that actually exist */
function reconcile(ext) {
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
        level: "error", code: "LINE_MISMATCH", line: i,
        message: `${i + 1}. rinda: daudz.×cena = ${money(lineNet[i])}, bet rēķinā norādīts ${money(printed)}.`,
      });
      addLineFlag(i, "error");
    }
  });

  const anyNet = lineNet.some((x) => Number.isFinite(x));
  let net = NaN, vat = NaN, total = NaN;
  if (anyNet) {
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
    flags.push({ level: "error", code: "NET_MISMATCH", message: `Aprēķinātā summa bez PVN ${money(net)} pret rēķinā norādīto ${money(pNet)} (Δ ${money(Math.abs(net - pNet))}).` });
  if (Number.isFinite(vat) && Number.isFinite(pVat) && Math.abs(vat - pVat) > DOC_TOL)
    flags.push({ level: "warning", code: "VAT_MISMATCH", message: `Aprēķinātais PVN ${money(vat)} pret rēķinā norādīto ${money(pVat)} (Δ ${money(Math.abs(vat - pVat))}).` });
  if (Number.isFinite(total) && Number.isFinite(pTot) && Math.abs(total - pTot) > DOC_TOL)
    flags.push({ level: "error", code: "TOTAL_MISMATCH", message: `Aprēķinātā kopsumma ${money(total)} pret rēķinā norādīto ${money(pTot)} (Δ ${money(Math.abs(total - pTot))}).` });

  const cust = ext.customer || {};
  if (cust && (cust.vat_number !== undefined || cust.reg_number !== undefined) && !cust.vat_number && !cust.reg_number)
    flags.push({ level: "error", code: "NO_RECIPIENT_ID", message: "Saņēmējam nav PVN / reģistrācijas numura — Horizon nevarēs atrast uzņēmumu." });
  if (lines.length === 0)
    flags.push({ level: "warning", code: "NO_LINES", message: "Datos nav neviena rēķina rinda." });

  return { flags, lineLevel, net, vat, total, pNet, pVat, pTot, lineNet };
}

/* ---------- display helpers for arbitrary keys */
const LV_LABELS = {
  // top-level
  invoice_id: "Rēķina nr.", issue_date: "Izrakstīšanas datums", due_date: "Apmaksas termiņš",
  currency: "Valūta", buyer_reference: "Pircēja atsauce", contract_reference: "Līguma atsauce",
  delivery_date: "Piegādes datums", note: "Piezīme",
  // party containers
  supplier: "Piegādātājs", customer: "Saņēmējs", delivery: "Piegāde", payment: "Maksājums",
  // party fields
  name: "Nosaukums", reg_number: "Reģ. nr.", vat_number: "PVN nr.",
  street: "Iela", city: "Pilsēta", postal_zone: "Pasta indekss", country_code: "Valsts kods",
  contact_name: "Kontaktpersona", contact_phone: "Tālrunis", contact_email: "E-pasts",
  iban: "IBAN", bic: "BIC", bank_name: "Banka", payment_id: "Maksājuma ID", terms_note: "Apmaksas noteikumi",
  // line fields
  description: "Apraksts", seller_item_id: "Artikuls", quantity: "Daudzums", unit_code: "Mērv.",
  net_unit_price: "Cena bez PVN", vat_category: "PVN kat.", vat_percent: "PVN %",
  printed_line_total: "Summa (rēķinā)",
  // printed totals
  net_excl_vat: "Summa bez PVN", total_vat: "PVN kopā", grand_total_incl_vat: "Summa kopā",
};
const labelize = (k) =>
  LV_LABELS[k] ||
  k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bVat\b/i, "PVN").replace(/\bIban\b/i, "IBAN").replace(/\bBic\b/i, "BIC").replace(/\bId\b/i, "ID");
const isScalar = (v) => v === null || ["string", "number", "boolean"].includes(typeof v);

/* ---------- warm palette applied via inline style (no Tailwind token for these) */
const PAPER = "#f4f1ea", PANEL = "#fbfaf6", LINESOFT = "#ece8dd";
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=Spline+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`;

const serif = { fontFamily: "'Lora', serif" };
const mono = { fontFamily: "'JetBrains Mono', monospace" };
const sans = { fontFamily: "'Spline Sans', sans-serif" };

/* Backend URL comes from the build-time env var VITE_API_BASE (set in .env
 * locally and in Vercel's project settings). The gear-icon field stays as an
 * optional override but is pre-filled, so the user never has to paste it. */
const DEFAULT_API_BASE =
  (import.meta.env && import.meta.env.VITE_API_BASE) || "";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Free-tier hosts (Render) sleep after inactivity; the first request wakes the
 * container and can return 502/503/504 or fail outright for ~30-50s. Retry a
 * few times so the cold start is invisible to the user. onWake fires once when
 * we detect we're waiting for the server to come up. */
async function fetchWithWakeRetry(url, options, { retries = 4, delayMs = 6000, onWake } = {}) {
  let notified = false;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if ([502, 503, 504].includes(res.status) && attempt < retries) {
        if (!notified && onWake) { onWake(); notified = true; }
        await sleep(delayMs);
        continue;
      }
      return res;
    } catch (err) {
      // network-level failure (server not answering yet) — retry if we can
      if (attempt < retries) {
        if (!notified && onWake) { onWake(); notified = true; }
        await sleep(delayMs);
        continue;
      }
      throw err;
    }
  }
  throw new Error("server did not respond after several attempts");
}

export default function InvoiceReview() {
  const [ext, setExt] = useState(null);
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [showSettings, setShowSettings] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfName, setPdfName] = useState(null);
  const [busy, setBusy] = useState(false);
  const [serverProblems, setServerProblems] = useState(null);
  const [toast, setToast] = useState(null);
  const fileRef = useRef(null);

  const rec = useMemo(() => reconcile(ext), [ext]);
  const errorCount = rec.flags.filter((f) => f.level === "error").length;
  const warnCount = rec.flags.filter((f) => f.level === "warning").length;

  const setTop = (key, value) => setExt((p) => ({ ...p, [key]: value }));
  const setNested = (parent, key, value) =>
    setExt((p) => ({ ...p, [parent]: { ...(p[parent] || {}), [key]: value } }));
  const setLine = (i, key, value) =>
    setExt((p) => { const lines = p.lines.slice(); lines[i] = { ...lines[i], [key]: value }; return { ...p, lines }; });
  const removeLine = (i) => setExt((p) => ({ ...p, lines: p.lines.filter((_, j) => j !== i) }));
  const addLine = () =>
    setExt((p) => {
      const template = p.lines?.[0] ? Object.fromEntries(Object.keys(p.lines[0]).map((k) => [k, ""])) : { description: "" };
      return { ...p, lines: [...(p.lines || []), template] };
    });

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfName(file.name);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(URL.createObjectURL(file));
    setServerProblems(null);
    if (!apiBase) { setToast({ kind: "error", msg: "Servera adrese nav konfigurēta. Iestatiet VITE_API_BASE vidē vai ievadiet to zem zobrata ikonas." }); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetchWithWakeRetry(
        `${apiBase.replace(/\/$/, "")}/extract`,
        { method: "POST", body: fd },
        { onWake: () => setToast({ kind: "info", msg: "Serveris tiek aktivizēts — pirmais pieprasījums var ilgt līdz minūtei…" }) }
      );
      if (!res.ok) throw new Error(`extract ${res.status}`);
      const data = await res.json();
      setExt(data.extraction ?? data);
      const n = (data.extraction ?? data)?.lines?.length ?? 0;
      setToast({ kind: "info", msg: `Nolasītas ${n} rinda${n === 1 ? "" : "s"} — pārbaudiet zemāk.` });
    } catch (err) {
      setToast({ kind: "error", msg: `Nolasīšana neizdevās: ${err.message}` });
    } finally { setBusy(false); }
  };

  const onGenerate = async () => {
    setServerProblems(null);
    if (!ext) return;
    if (!apiBase) { setToast({ kind: "error", msg: "Servera adrese nav konfigurēta. Iestatiet VITE_API_BASE vidē vai ievadiet to zem zobrata ikonas." }); return; }
    setBusy(true);
    try {
      const res = await fetchWithWakeRetry(
        `${apiBase.replace(/\/$/, "")}/generate`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ext) },
        { onWake: () => setToast({ kind: "info", msg: "Serveris tiek aktivizēts — tas var ilgt līdz minūtei…" }) }
      );
      if (res.status === 422) { setServerProblems(await res.json()); setToast({ kind: "error", msg: "Serveris noraidīja rēķinu — skatiet problēmas zemāk." }); return; }
      if (!res.ok) throw new Error(`generate ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(ext.invoice_id || "invoice").toString().replace(/\s+/g, "_")}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ kind: "ok", msg: "XML izveidots un lejupielādēts." });
    } catch (err) {
      setToast({ kind: "error", msg: `Izveide neizdevās: ${err.message}` });
    } finally { setBusy(false); }
  };

  const lines = ext && Array.isArray(ext.lines) ? ext.lines : [];
  const lineKeys = useMemo(() => {
    const seen = [];
    lines.forEach((l) => Object.keys(l || {}).forEach((k) => { if (!seen.includes(k)) seen.push(k); }));
    return seen;
  }, [lines]);
  const qtyKey = lines[0] ? keyOf(lines[0], KEY.qty) : null;
  const priceKey = lines[0] ? keyOf(lines[0], KEY.price) : null;

  const toastClass = toast
    ? (toast.kind === "error" ? "bg-[#f6e9e4] text-[#a3331f]"
      : toast.kind === "ok" ? "bg-[#e7f0e9] text-[#2f6b4f]"
      : "bg-[#f6efdf] text-[#946317]")
    : "";

  return (
    <div className="text-[#1c1b17] rounded-2xl overflow-hidden border border-[#e2ddd0] min-h-[560px]" style={{ ...sans, background: PAPER }}>
      <style>{FONTS}</style>

      {/* masthead */}
      <header className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-b border-[#e2ddd0]" style={{ background: PANEL }}>
        <div className="flex items-baseline gap-3.5 flex-wrap">
          <span className="text-[25px] font-semibold tracking-tight leading-none" style={serif}>Pavadzīme</span>
          <ArrowRight size={16} className="self-center text-[#6f6a5f]" />
          <span className="text-[25px] font-semibold tracking-tight leading-none text-[#a3331f]" style={serif}>Peppol</span>
          <span className="text-[12.5px] text-[#6f6a5f] self-center">e-rēķinu pārbaude · Horizon</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => setShowSettings((v) => !v)}
            className="inline-flex items-center gap-1.5 bg-transparent text-[#1c1b17] border border-[#e2ddd0] rounded-lg px-3 py-2 text-[13px] font-medium hover:bg-[#ece8dd] transition-colors">
            <Settings size={15} /> API
          </button>
          <button onClick={onGenerate} disabled={busy || !ext}
            className="inline-flex items-center gap-1.5 bg-[#1c1b17] text-[#f4f1ea] border-0 rounded-lg px-3.5 py-2 text-[13.5px] font-medium disabled:opacity-50 disabled:cursor-default cursor-pointer active:scale-[0.98] transition-transform">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Izveidot XML
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="flex items-center gap-2.5 flex-wrap px-5 py-2.5 border-b border-[#e2ddd0]" style={{ background: LINESOFT }}>
          <label className="text-[11px] text-[#6f6a5f] font-medium">Servera adrese (neobligāts uzstādījums)</label>
          <input value={apiBase} onChange={(e) => setApiBase(e.target.value)} placeholder="https://your-host"
            className="flex-1 min-w-[220px] text-[13.5px] bg-white border border-[#e2ddd0] rounded-md px-2.5 h-9 outline-none focus:ring-2 focus:ring-[#e4d4ac]" />
          <span className="text-xs text-[#6f6a5f]">
            {apiBase
              ? (apiBase === DEFAULT_API_BASE ? "konfigurēts no vides" : "izmanto manuālu adresi")
              : "nav konfigurēts — iestatiet VITE_API_BASE vai ievadiet adresi šeit"}
          </span>
        </div>
      )}

      {toast && (
        <div className={`mx-5 mt-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium relative ${toastClass}`}>
          {toast.msg}
          <span className="absolute right-3 top-1.5 cursor-pointer text-base opacity-60" onClick={() => setToast(null)}>×</span>
        </div>
      )}

      <div className="flex items-stretch flex-wrap">
        {/* left: PDF */}
        <aside className="flex-[1_1_300px] min-w-[280px] border-r border-[#e2ddd0] flex flex-col min-h-[480px]" style={{ background: LINESOFT }}>
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#e2ddd0]">
            <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#1c1b17]"><FileText size={15} /> Avota dokuments</span>
            <button onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 bg-white text-[#1c1b17] border border-[#e2ddd0] rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-[#ece8dd] transition-colors">
              <Upload size={13} /> {pdfName ? "Aizstāt" : "Augšupielādēt PDF"}
            </button>
            <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={onPickFile} />
          </div>
          {pdfUrl ? (
            <iframe title="invoice pdf" src={pdfUrl} className="flex-1 w-full border-0 min-h-[460px] bg-white" />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <FileText size={30} className="text-[#e2ddd0]" />
              <p className="mt-2.5 mb-0.5 font-medium text-[#1c1b17]">Nav dokumenta</p>
              <p className="m-0 text-[12.5px] text-[#6f6a5f] max-w-[230px] leading-relaxed">
                Augšupielādējiet rēķina PDF, lai to nolasītu. Dokumenta priekšskatījums parādīsies šeit blakus nolasītajiem datiem.
              </p>
            </div>
          )}
        </aside>

        {/* right: review or empty state */}
        <main className="flex-[2_1_440px] min-w-[360px] px-5 py-4 flex flex-col gap-4 max-h-[760px] overflow-y-auto">
          {!ext ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
              {busy ? (
                <Loader2 size={100} className="animate-spin text-[#6f6a5f]" />
              ) : (
                <>
                  <h2 className="text-[19px] font-semibold mt-3.5 mb-0 text-[#1c1b17]" style={serif}>Vēl nav ko pārbaudīt</h2>
                  <p className="mt-2 mb-0 text-[#6f6a5f] text-[13.5px] leading-relaxed max-w-[360px]">
                    Augšupielādējiet PDF, lai sāktu nolasīšanu. Nolasītie lauki un rindas parādīsies šeit pārbaudei un labošanai pirms Peppol XML izveides.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <StatusBanner errorCount={errorCount} warnCount={warnCount} />

              {rec.flags.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {rec.flags.map((f, i) => <FlagRow key={i} level={f.level} text={f.message} />)}
                </div>
              )}

              {serverProblems && (
                <div className="flex flex-col gap-1.5">
                  {(serverProblems.reconcile_errors || []).map((f, i) => <FlagRow key={`re${i}`} level="error" text={`Serveris: ${f.message}`} />)}
                  {(serverProblems.validation_errors || []).map((m, i) => <FlagRow key={`ve${i}`} level="error" text={`Validācija: ${m}`} />)}
                  {(serverProblems.validation_warnings || []).map((m, i) => <FlagRow key={`vw${i}`} level="warning" text={m} />)}
                </div>
              )}

              {/* parties */}
              {["supplier", "customer", "delivery", "payment"].filter((k) => ext[k] && typeof ext[k] === "object" && !Array.isArray(ext[k])).length > 0 && (
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
                  {["supplier", "customer", "delivery", "payment"].map((k) =>
                    ext[k] && typeof ext[k] === "object" && !Array.isArray(ext[k]) ? (
                      <ObjectCard key={k} title={labelize(k)} obj={ext[k]}
                        flagged={k === "customer" && (ext[k].vat_number !== undefined || ext[k].reg_number !== undefined) && !ext[k].vat_number && !ext[k].reg_number}
                        onChange={(field, val) => setNested(k, field, val)} />
                    ) : null
                  )}
                </div>
              )}

              {/* top-level scalar fields */}
              {(() => {
                const scalarKeys = Object.keys(ext).filter((k) => isScalar(ext[k]) && k !== "note");
                if (scalarKeys.length === 0) return null;
                return (
                  <Section title="Rēķina informācija">
                    <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
                      {scalarKeys.map((k) => <Field key={k} label={labelize(k)} value={ext[k]} onChange={(v) => setTop(k, v)} />)}
                    </div>
                  </Section>
                );
              })()}

              {ext.note !== undefined && isScalar(ext.note) && (
                <Section title="Piezīme">
                  <textarea value={ext.note ?? ""} onChange={(e) => setTop("note", e.target.value)}
                    className="w-full h-[70px] text-[13.5px] bg-white border border-[#e2ddd0] rounded-md px-2.5 pt-2 resize-y outline-none focus:ring-2 focus:ring-[#e4d4ac]" />
                </Section>
              )}

              {/* lines */}
              <Section title={`Rēķina rindas · ${lines.length}`}
                action={lines.length > 0 ? <AddBtn onClick={addLine} /> : null}>
                {lines.length === 0 ? (
                  <div className="text-[13px] text-[#6f6a5f] px-3.5 py-3 border border-[#e2ddd0] rounded-lg" style={{ background: PANEL }}>
                    Nolasīšana neatgrieza nevienu rindu.
                  </div>
                ) : (
                  <div className="border border-[#e2ddd0] rounded-lg overflow-auto" style={{ background: PANEL }}>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="w-[26px]" />
                          {lineKeys.map((k) => (
                            <th key={k} className={`text-[10.5px] font-medium text-[#6f6a5f] uppercase tracking-wide px-1.5 py-2 border-b border-[#e2ddd0] whitespace-nowrap ${k === "description" ? "text-left" : "text-right"}`} style={{ background: LINESOFT }}>
                              {labelize(k)}
                            </th>
                          ))}
                          {qtyKey && priceKey && <th className="w-[76px] text-[10.5px] font-medium text-[#6f6a5f] uppercase tracking-wide px-1.5 py-2 border-b border-[#e2ddd0] text-right" style={{ background: LINESOFT }}>= Rinda</th>}
                          <th className="w-[30px] border-b border-[#e2ddd0]" style={{ background: LINESOFT }} />
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((l, i) => {
                          const lvl = rec.lineLevel[i];
                          const rowBg = lvl === "error" ? "bg-[#f6e9e4]" : lvl === "warning" ? "bg-[#f6efdf]" : (i % 2 ? "bg-[#fbfaf6]" : "bg-transparent");
                          const calc = rec.lineNet ? rec.lineNet[i] : NaN;
                          return (
                            <tr key={i} className={rowBg}>
                              <td className="px-0.5 py-0.5 text-center border-b border-[#ece8dd] align-middle">
                                {lvl === "error" ? <AlertCircle size={13} className="text-[#a3331f] inline" />
                                  : lvl === "warning" ? <AlertTriangle size={13} className="text-[#946317] inline" />
                                  : <span className="text-[#6f6a5f] text-[11px]">{i + 1}</span>}
                              </td>
                              {lineKeys.map((k) => {
                                const v = l[k];
                                const editable = v === undefined || isScalar(v);
                                const alignRight = k !== "description";
                                return (
                                  <td key={k} className="px-1 py-0.5 border-b border-[#ece8dd] align-middle">
                                    {editable ? (
                                      <input value={v ?? ""} onChange={(e) => setLine(i, k, e.target.value)}
                                        style={k === "description" ? sans : mono}
                                        className={`w-full min-w-[60px] box-border text-[12.5px] text-[#1c1b17] bg-transparent border border-transparent rounded px-1.5 py-1.5 outline-none focus:ring-2 focus:ring-[#e4d4ac] focus:bg-white ${alignRight ? "text-right" : "text-left"}`} />
                                    ) : (
                                      <span className="text-[11.5px] text-[#6f6a5f]">{JSON.stringify(v)}</span>
                                    )}
                                  </td>
                                );
                              })}
                              {qtyKey && priceKey && (
                                <td className={`px-1 py-0.5 border-b border-[#ece8dd] align-middle text-right text-[12.5px] ${Number.isFinite(calc) ? "text-[#1c1b17]" : "text-[#6f6a5f]"}`} style={mono}>
                                  {Number.isFinite(calc) ? money(calc) : "—"}
                                </td>
                              )}
                              <td className="px-0.5 py-0.5 text-center border-b border-[#ece8dd] align-middle">
                                <button onClick={() => removeLine(i)} aria-label="dzēst rindu"
                                  className="inline-flex items-center justify-center bg-transparent text-[#6f6a5f] border-0 rounded p-1.5 cursor-pointer hover:text-[#a3331f] transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>

              {/* totals */}
              {(ext.printed_totals || Number.isFinite(rec.net)) && (
                <Section title="Kopsummas — aprēķinātās pret rēķinā norādītajām">
                  <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
                    <TotalCell label="Summa bez PVN" computed={rec.net} printed={rec.pNet} />
                    <TotalCell label="PVN" computed={rec.vat} printed={rec.pVat} />
                    <TotalCell label="Summa kopā" computed={rec.total} printed={rec.pTot} strong />
                  </div>
                  {ext.printed_totals && (
                    <div className="flex items-center gap-3 flex-wrap mt-2.5">
                      <span className="text-[11px] text-[#6f6a5f] font-medium">Rēķinā norādīts:</span>
                      {Object.keys(ext.printed_totals).filter((k) => isScalar(ext.printed_totals[k])).map((k) => (
                        <MiniField key={k} label={labelize(k)} value={ext.printed_totals[k]} onChange={(v) => setNested("printed_totals", k, v)} />
                      ))}
                    </div>
                  )}
                </Section>
              )}

              <div className="h-2" />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------- subcomponents */
function FlagRow({ level, text }) {
  const cls = level === "error" ? "bg-[#f6e9e4] text-[#a3331f]" : "bg-[#f6efdf] text-[#946317]";
  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-[13px] leading-snug ${cls}`}>
      {level === "error" ? <AlertCircle size={15} className="shrink-0 mt-0.5" /> : <AlertTriangle size={15} className="shrink-0 mt-0.5" />}
      <span>{text}</span>
    </div>
  );
}

function StatusBanner({ errorCount, warnCount }) {
  const ok = errorCount === 0 && warnCount === 0;
  const onlyWarn = errorCount === 0 && warnCount > 0;
  const cls = ok ? "bg-[#e7f0e9] text-[#2f6b4f]" : onlyWarn ? "bg-[#f6efdf] text-[#946317]" : "bg-[#f6e9e4] text-[#a3331f]";
  const Icon = ok ? CheckCircle2 : onlyWarn ? AlertTriangle : AlertCircle;
  // Latvian plural: n ending in 1 (but not 11) = singular form
  const lvPlural = (n, one, many) => (n % 10 === 1 && n % 100 !== 11 ? one : many);
  const errTxt = errorCount ? `${errorCount} ${lvPlural(errorCount, "kļūda", "kļūdas")}` : "";
  const warnTxt = warnCount ? `${warnCount} ${lvPlural(warnCount, "brīdinājums", "brīdinājumi")}` : "";
  const msg = ok ? "Saskaņots — summas atbilst rēķinā norādītajām."
    : `${errTxt}${errorCount && warnCount ? " · " : ""}${warnTxt} jāpārbauda.`;
  return (
    <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-lg font-medium text-sm ${cls}`}>
      <Icon size={17} /> {msg}
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <section className="mt-1">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-[16.5px] font-semibold m-0 text-[#1c1b17]" style={serif}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function AddBtn({ onClick }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 bg-white text-[#1c1b17] border border-[#e2ddd0] rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-[#ece8dd] transition-colors">
      <Plus size={13} /> Pievienot rindu
    </button>
  );
}

function ObjectCard({ title, obj, flagged, onChange }) {
  const keys = Object.keys(obj).filter((k) => isScalar(obj[k]));
  return (
    <div className={`border rounded-xl p-3.5 flex flex-col gap-2.5 ${flagged ? "border-[#e3c4b9] bg-[#f6e9e4]" : "border-[#e2ddd0]"}`} style={flagged ? undefined : { background: PANEL }}>
      <div className="flex items-center justify-between text-[14.5px] font-semibold text-[#1c1b17]" style={serif}>
        {title}{flagged && <span className="text-[#a3331f] text-[11px] font-medium">trūkst ID</span>}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {keys.map((k) => (
          <Field key={k} label={labelize(k)} value={obj[k]} mono={/number|iban|bic|reg|vat|id/i.test(k)} onChange={(v) => onChange(k, v)} />
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, mono: isMono }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] text-[#6f6a5f] font-medium">{label}</span>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)}
        style={isMono ? mono : sans}
        className="w-full box-border text-[13.5px] text-[#1c1b17] bg-white border border-[#e2ddd0] rounded-md px-2.5 h-9 outline-none focus:ring-2 focus:ring-[#e4d4ac]" />
    </label>
  );
}

function MiniField({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[11px] text-[#6f6a5f]">{label}</span>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={mono}
        className="w-20 h-[30px] text-right text-[12.5px] bg-white border border-[#e2ddd0] rounded-md px-2 outline-none focus:ring-2 focus:ring-[#e4d4ac]" />
    </label>
  );
}

function TotalCell({ label, computed, printed, strong }) {
  const hasComputed = Number.isFinite(computed);
  const hasPrinted = Number.isFinite(printed);
  const mismatch = hasComputed && hasPrinted && Math.abs(r2(computed) - r2(printed)) > DOC_TOL;
  return (
    <div className={`border rounded-lg px-3.5 py-3 ${mismatch ? "border-[#e3c4b9] bg-[#f6e9e4]" : "border-[#e2ddd0]"}`} style={mismatch ? undefined : { background: PANEL }}>
      <div className="text-[11.5px] text-[#6f6a5f] mb-1.5 uppercase tracking-wide">{label}</div>
      <div className="flex items-baseline justify-between gap-2">
        <span className={`${strong ? "text-[21px]" : "text-[18px]"} font-medium ${mismatch ? "text-[#a3331f]" : "text-[#1c1b17]"}`} style={mono}>
          {hasComputed ? money(computed) : "—"}
        </span>
        {hasPrinted && (
          <span className={`text-xs ${mismatch ? "text-[#a3331f]" : "text-[#6f6a5f]"}`} style={mono}>
            {mismatch ? "≠ " : "= "}{money(printed)}
          </span>
        )}
      </div>
    </div>
  );
}