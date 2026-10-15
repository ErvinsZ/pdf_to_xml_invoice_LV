import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useI18n } from "../i18n/context";

const KIND_STYLES = {
  ok: { Icon: CheckCircle2, className: "text-ok" },
  error: { Icon: AlertCircle, className: "text-danger" },
  pending: { Icon: Loader2, className: "text-muted", spin: true },
};

/* Spinner plus the live server-status log shown while /extract runs. */
export default function ExtractionProgress({ log }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center gap-5">
      <Loader2 size={100} className="animate-spin text-muted" />
      {log.length > 0 && (
        <ul className="flex flex-col gap-1.5 text-left w-full max-w-[300px]" aria-live="polite">
          {log.map((entry) => {
            const { Icon, className, spin } = KIND_STYLES[entry.kind] ?? KIND_STYLES.pending;
            return (
              <li key={entry.id} className={`flex items-center gap-2 text-[12px] font-mono ${className}`}>
                <Icon size={13} className={`shrink-0 ${spin ? "animate-spin" : ""}`} />
                <span>{t(entry.key, entry.params)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
