import { useI18n } from "../i18n/context";
import { isScalar } from "../lib/fields";
import { DOC_TOL, money, r2 } from "../lib/reconcile";
import { MiniField, Section } from "./ui";

/* Computed totals side by side with the printed ones, plus inputs to correct
 * the printed values. */
export default function TotalsSection({ rec, printedTotals, onChangePrinted }) {
  const { t, fieldLabel } = useI18n();
  return (
    <Section title={t("review.totals")}>
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
        <TotalCell label={t("totals.net")} computed={rec.net} printed={rec.pNet} />
        <TotalCell label={t("totals.vat")} computed={rec.vat} printed={rec.pVat} />
        <TotalCell label={t("totals.total")} computed={rec.total} printed={rec.pTot} strong />
      </div>
      {printedTotals && (
        <div className="flex items-center gap-3 flex-wrap mt-2.5">
          <span className="text-[11px] text-muted font-medium">{t("review.printedOnInvoice")}</span>
          {Object.keys(printedTotals)
            .filter((k) => isScalar(printedTotals[k]))
            .map((k) => (
              <MiniField key={k} label={fieldLabel(k)} value={printedTotals[k]} onChange={(v) => onChangePrinted(k, v)} />
            ))}
        </div>
      )}
    </Section>
  );
}

function TotalCell({ label, computed, printed, strong = false }) {
  const hasComputed = Number.isFinite(computed);
  const hasPrinted = Number.isFinite(printed);
  const mismatch = hasComputed && hasPrinted && Math.abs(r2(computed) - r2(printed)) > DOC_TOL;
  return (
    <div className={`border rounded-lg px-3.5 py-3 ${mismatch ? "border-danger-border bg-danger-bg" : "border-line bg-panel"}`}>
      <div className="text-[11.5px] text-muted mb-1.5 uppercase tracking-wide">{label}</div>
      <div className="flex items-baseline justify-between gap-2 font-mono">
        <span className={`${strong ? "text-[21px]" : "text-[18px]"} font-medium ${mismatch ? "text-danger" : "text-ink"}`}>
          {hasComputed ? money(computed) : "—"}
        </span>
        {hasPrinted && (
          <span className={`text-xs ${mismatch ? "text-danger" : "text-muted"}`}>
            {mismatch ? "≠ " : "= "}{money(printed)}
          </span>
        )}
      </div>
    </div>
  );
}
