import { ArrowRight } from "lucide-react";
import { useI18n } from "../i18n/context";
import GenerateButton from "./GenerateButton";
import LanguageSelect from "./LanguageSelect";

export default function Header({ busy, canGenerate, errorCount, onGenerate }) {
  const { t } = useI18n();
  return (
    <header className="flex items-center justify-between gap-3 flex-wrap px-4 sm:px-5 py-3.5 border-b border-line bg-panel shrink-0">
      <div className="flex items-baseline gap-3.5 flex-wrap">
        <h1 className="flex items-baseline gap-3 font-serif text-[22px] sm:text-[25px] font-semibold tracking-tight leading-none">
          <span>{t("header.from")}</span>
          <ArrowRight size={16} className="self-center text-muted" aria-hidden />
          <span className="text-danger">{t("header.to")}</span>
        </h1>
        <span className="hidden sm:inline text-[12.5px] text-muted self-center">{t("header.subtitle")}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <LanguageSelect />
        <GenerateButton busy={busy} disabled={!canGenerate} errorCount={errorCount} onGenerate={onGenerate} />
      </div>
    </header>
  );
}
