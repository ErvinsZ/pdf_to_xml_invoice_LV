import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANG, I18nContext, MESSAGES } from "./context";

const STORAGE_KEY = "lang";

const readStoredLang = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && Object.hasOwn(MESSAGES, stored) ? stored : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
};

const lookup = (dict, key) => key.split(".").reduce((node, part) => node?.[part], dict);

const interpolate = (template, params) =>
  template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));

/* Fallback for extraction keys with no translation: "bank_iban" → "Bank IBAN". */
const humanize = (key, vatAbbr) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bVat\b/g, vatAbbr)
    .replace(/\bIban\b/g, "IBAN")
    .replace(/\bBic\b/g, "BIC")
    .replace(/\bId\b/g, "ID");

export default function I18nProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);

  const setLang = useCallback((next) => {
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage unavailable */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => {
    const dict = MESSAGES[lang];
    const t = (key, params = {}) => {
      const entry = lookup(dict, key) ?? lookup(MESSAGES[DEFAULT_LANG], key);
      if (typeof entry === "function") return entry(params);
      if (typeof entry === "string") return interpolate(entry, params);
      return key;
    };
    const fieldLabel = (key) => dict.fields[key] || humanize(key, dict.vatAbbr);
    return { lang, setLang, t, fieldLabel };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
