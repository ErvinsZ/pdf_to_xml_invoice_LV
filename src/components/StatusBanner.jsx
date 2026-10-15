import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useI18n } from "../i18n/context";

export default function StatusBanner({ errorCount, warnCount }) {
  const { t } = useI18n();
  const ok = errorCount === 0 && warnCount === 0;
  const onlyWarn = errorCount === 0 && warnCount > 0;

  const className = ok ? "bg-ok-bg text-ok" : onlyWarn ? "bg-warn-bg text-warn" : "bg-danger-bg text-danger";
  const Icon = ok ? CheckCircle2 : onlyWarn ? AlertTriangle : AlertCircle;

  const summary = [
    errorCount && t("status.errors", { count: errorCount }),
    warnCount && t("status.warnings", { count: warnCount }),
  ].filter(Boolean).join(" · ");
  const message = ok ? t("status.ok") : t("status.needsReview", { summary });

  return (
    <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-lg font-medium text-sm ${className}`}>
      <Icon size={17} /> {message}
    </div>
  );
}
