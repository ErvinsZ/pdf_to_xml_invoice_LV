import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useI18n } from "../i18n/context";

const AUTO_DISMISS_MS = 5000;

const KINDS = {
  error: { className: "bg-danger-bg text-danger border-danger-border", Icon: AlertCircle },
  ok: { className: "bg-ok-bg text-ok border-ok/20", Icon: CheckCircle2 },
  info: { className: "bg-warn-bg text-warn border-warn/20", Icon: Info },
};

/* toast = { kind: "error" | "ok" | "info", key, params, persist? }
 * Errors and `persist` toasts stay until closed; others fade after 5s. */
export default function Toast({ toast, onClose }) {
  const { t } = useI18n();

  useEffect(() => {
    if (!toast || toast.kind === "error" || toast.persist) return;
    const timer = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  const { className, Icon } = KINDS[toast.kind];
  return (
    <div className="fixed z-40 left-4 right-4 bottom-4 sm:left-auto sm:right-5 sm:bottom-5 sm:w-96 pointer-events-none">
      <div
        role={toast.kind === "error" ? "alert" : "status"}
        className={`pointer-events-auto flex items-start gap-2.5 pl-3.5 pr-2 py-3 rounded-lg border shadow-lg text-[13.5px] font-medium motion-safe:animate-toast-in ${className}`}
      >
        <Icon size={16} className="shrink-0 mt-px" />
        <span className="flex-1">{t(toast.key, toast.params)}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("toast.close")}
          className="shrink-0 p-0.5 rounded opacity-60 hover:opacity-100 cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
