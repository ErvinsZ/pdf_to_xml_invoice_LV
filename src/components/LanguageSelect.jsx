import { ChevronDown, Globe } from "lucide-react";
import { LANGUAGES, useI18n } from "../i18n/context";

export default function LanguageSelect() {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="relative inline-flex items-center text-ink">
      <span className="sr-only">{t("language")}</span>
      <Globe size={15} className="absolute left-2.5 pointer-events-none text-muted" />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="appearance-none bg-transparent border border-line rounded-lg pl-8 pr-7 py-2 text-[13px] font-medium cursor-pointer hover:bg-soft transition-colors outline-none focus:ring-2 focus:ring-focus"
      >
        {LANGUAGES.map(({ code, name }) => (
          <option key={code} value={code}>{name}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 pointer-events-none text-muted" />
    </label>
  );
}
