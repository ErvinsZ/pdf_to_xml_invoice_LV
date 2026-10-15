import { useEffect, useRef, useState } from "react";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import { useI18n } from "../i18n/context";
import { Button } from "./ui";

/* "Generate XML" with an error-count badge. When the invoice still has errors
 * the click opens a confirmation instead of sending straight away. */
export default function GenerateButton({ busy, disabled, errorCount, onGenerate }) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!confirming) return;
    const onPointer = (e) => { if (!rootRef.current?.contains(e.target)) setConfirming(false); };
    const onKey = (e) => { if (e.key === "Escape") setConfirming(false); };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [confirming]);

  const onClick = () => (errorCount > 0 ? setConfirming((v) => !v) : onGenerate());
  const confirm = () => { setConfirming(false); onGenerate(); };

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="primary"
        onClick={onClick}
        disabled={busy || disabled}
        aria-haspopup={errorCount > 0 ? "dialog" : undefined}
        aria-expanded={errorCount > 0 ? confirming : undefined}
      >
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

      {confirming && (
        <div
          role="dialog"
          aria-label={t("header.confirmTitle")}
          className="absolute right-0 top-full mt-2 z-30 w-72 rounded-lg border border-line bg-panel p-3.5 shadow-lg"
        >
          <p className="font-serif text-[14.5px] font-semibold">{t("header.confirmTitle")}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            {t("header.confirmBody", { count: errorCount })}
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button onClick={() => setConfirming(false)}>{t("header.cancel")}</Button>
            <Button variant="danger" onClick={confirm} autoFocus>{t("header.confirmSend")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
