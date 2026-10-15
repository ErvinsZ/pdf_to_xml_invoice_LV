import { AlertCircle, Download, Loader2 } from "lucide-react";
import { useI18n } from "../i18n/context";
import { Button } from "./ui";

/* "Generate XML" with an error-count badge. Errors never block generation;
 * the badge is just a heads-up that the invoice still has problems. */
export default function GenerateButton({ busy, disabled, errorCount, onGenerate }) {
  const { t } = useI18n();
  return (
    <Button variant="primary" onClick={onGenerate} disabled={busy || disabled}>
      {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
      {t("header.generate")}
      {errorCount > 0 && !disabled && (
        <span
          className="ml-1 inline-flex items-center gap-1 rounded-full bg-danger px-1.5 py-px text-[11px] font-semibold text-white"
          title={t("header.errorsBadge", { count: errorCount })}
        >
          <AlertCircle size={11} aria-hidden />
          {errorCount}
          <span className="sr-only">{t("header.errorsBadge", { count: errorCount })}</span>
        </span>
      )}
    </Button>
  );
}
