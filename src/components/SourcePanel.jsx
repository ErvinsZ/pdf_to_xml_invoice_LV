import { useRef } from "react";
import { FileText, Upload } from "lucide-react";
import { useI18n } from "../i18n/context";
import { Button } from "./ui";

export default function SourcePanel({ pdfUrl, onFile }) {
  const { t } = useI18n();
  const fileRef = useRef(null);
  const openPicker = () => fileRef.current?.click();

  const onChange = (e) => {
    const file = e.target.files?.[0];
    // reset so picking the same file again still fires onChange
    e.target.value = "";
    if (file) onFile(file);
  };

  return (
    <aside className="flex flex-col bg-soft border-b lg:border-b-0 lg:border-r border-line lg:w-[42%] lg:max-w-[720px] shrink-0">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-line">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
          <FileText size={15} /> {t("source.title")}
        </span>
        <Button onClick={openPicker}>
          <Upload size={13} /> {pdfUrl ? t("source.replace") : t("source.upload")}
        </Button>
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={onChange} />
      </div>
      {pdfUrl ? (
        <iframe title={t("source.frameTitle")} src={pdfUrl} className="flex-1 w-full border-0 h-[70vh] lg:h-auto bg-white" />
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="group flex-1 m-4 flex flex-col items-center justify-center text-center p-6 py-10 rounded-xl border-2 border-dashed border-line hover:border-muted/40 hover:bg-panel/60 transition-colors cursor-pointer"
        >
          <Upload size={28} className="text-muted/50 group-hover:text-muted transition-colors" />
          <span className="mt-3 mb-0.5 font-medium text-ink">{t("source.upload")}</span>
          <span className="text-[12.5px] text-muted">{t("source.dropHint")}</span>
          <span className="mt-3 text-[12.5px] text-muted max-w-[260px] leading-relaxed">{t("source.emptyBody")}</span>
        </button>
      )}
    </aside>
  );
}
