import { useI18n } from "../i18n/context";
import { isScalar } from "../lib/fields";
import { Field } from "./ui";

// identifiers read better in a monospace font
const MONO_KEY = /number|iban|bic|reg|vat|id/i;

/* Editable card for one nested object of the extraction (supplier, customer, …). */
export default function PartyCard({ title, obj, flagged, onChange }) {
  const { t, fieldLabel } = useI18n();
  const keys = Object.keys(obj).filter((k) => isScalar(obj[k]));
  return (
    <div
      className={`border rounded-xl p-3.5 flex flex-col gap-2.5 ${
        flagged ? "border-danger-border bg-danger-bg" : "border-line bg-panel"
      }`}
    >
      <div className="flex items-center justify-between font-serif text-[14.5px] font-semibold text-ink">
        {title}
        {flagged && <span className="text-danger text-[11px] font-medium">{t("review.missingId")}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {keys.map((k) => (
          <Field key={k} label={fieldLabel(k)} value={obj[k]} mono={MONO_KEY.test(k)} onChange={(v) => onChange(k, v)} />
        ))}
      </div>
    </div>
  );
}
