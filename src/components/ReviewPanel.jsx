import { useI18n } from "../i18n/context";
import { isPlainObject, isScalar, PARTY_KEYS } from "../lib/fields";
import { isMissingRecipientId } from "../lib/reconcile";
import LineItemsTable from "./LineItemsTable";
import PartyCard from "./PartyCard";
import StatusBanner from "./StatusBanner";
import TotalsSection from "./TotalsSection";
import { Field, FlagRow, Section, TextArea } from "./ui";

/* Everything shown once /extract has returned. Renders whatever fields the
 * extraction contains; edits go back through the `editor` callbacks. */
export default function ReviewPanel({ ext, rec, serverProblems, editor }) {
  const { t, fieldLabel } = useI18n();

  const errorCount = rec.flags.filter((f) => f.level === "error").length;
  const warnCount = rec.flags.filter((f) => f.level === "warning").length;
  const parties = PARTY_KEYS.filter((k) => isPlainObject(ext[k]));
  const scalarKeys = Object.keys(ext).filter((k) => isScalar(ext[k]) && k !== "note");
  const lines = Array.isArray(ext.lines) ? ext.lines : [];

  return (
    <>
      <StatusBanner errorCount={errorCount} warnCount={warnCount} />

      {rec.flags.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {rec.flags.map((f, i) => (
            <FlagRow key={i} level={f.level}>{t(`flags.${f.code}`, f.params)}</FlagRow>
          ))}
        </div>
      )}

      {serverProblems && (
        <div className="flex flex-col gap-1.5">
          {(serverProblems.reconcile_errors || []).map((f, i) => (
            <FlagRow key={`re${i}`} level="error">{t("flags.serverPrefix", { message: f.message })}</FlagRow>
          ))}
          {(serverProblems.validation_errors || []).map((m, i) => (
            <FlagRow key={`ve${i}`} level="error">{t("flags.validationPrefix", { message: m })}</FlagRow>
          ))}
          {(serverProblems.validation_warnings || []).map((m, i) => (
            <FlagRow key={`vw${i}`} level="warning">{m}</FlagRow>
          ))}
        </div>
      )}

      {parties.length > 0 && (
        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
          {parties.map((k) => (
            <PartyCard
              key={k}
              title={fieldLabel(k)}
              obj={ext[k]}
              flagged={k === "customer" && isMissingRecipientId(ext[k])}
              onChange={(field, val) => editor.setNested(k, field, val)}
            />
          ))}
        </div>
      )}

      {scalarKeys.length > 0 && (
        <Section title={t("review.invoiceInfo")}>
          <div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
            {scalarKeys.map((k) => (
              <Field key={k} label={fieldLabel(k)} value={ext[k]} onChange={(v) => editor.setTop(k, v)} />
            ))}
          </div>
        </Section>
      )}

      {ext.note !== undefined && isScalar(ext.note) && (
        <Section title={t("review.note")}>
          <TextArea value={ext.note} onChange={(v) => editor.setTop("note", v)} />
        </Section>
      )}

      <LineItemsTable
        lines={lines}
        lineLevel={rec.lineLevel}
        lineNet={rec.lineNet}
        onChange={editor.setLine}
        onAdd={editor.addLine}
        onRemove={editor.removeLine}
      />

      {(ext.printed_totals || Number.isFinite(rec.net)) && (
        <TotalsSection
          rec={rec}
          printedTotals={ext.printed_totals}
          onChangePrinted={(k, v) => editor.setNested("printed_totals", k, v)}
        />
      )}

      <div className="h-2" />
    </>
  );
}
