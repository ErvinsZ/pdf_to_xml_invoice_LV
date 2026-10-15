import { createContext, useContext } from "react";
import en from "./en";
import lv from "./lv";

export const MESSAGES = { en, lv };
export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "lv", name: "Latviešu" },
];
export const DEFAULT_LANG = "en";

export const I18nContext = createContext(null);

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
