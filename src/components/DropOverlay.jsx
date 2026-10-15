import { Upload } from "lucide-react";
import { useI18n } from "../i18n/context";

/* Full-window hint shown while a file is dragged over the page. It also sits
 * above the PDF iframe, which would otherwise swallow the drop. */
export default function DropOverlay() {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 p-4 bg-ink/20 backdrop-blur-[2px]">
      <div className="h-full rounded-2xl border-2 border-dashed border-ink/40 bg-paper/80 flex flex-col items-center justify-center gap-3">
        <Upload size={36} className="text-ink" />
        <p className="font-serif text-xl font-semibold text-ink">{t("source.dropOverlay")}</p>
      </div>
    </div>
  );
}
