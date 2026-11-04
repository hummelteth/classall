import { useEffect, useSyncExternalStore } from "react";
import es from "./locales/es.json";

export type Language = "en" | "es";
const listeners = new Set<() => void>();
const storageKey = "classall.language";
function stored(): Language {
  try {
    return localStorage.getItem(storageKey) === "es" ? "es" : "en";
  } catch {
    return "en";
  }
}
let language = stored();
export const currentLanguage = () => language;
export function setLanguage(next: Language) {
  language = next;
  try {
    localStorage.setItem(storageKey, next);
  } catch {
    /* Private browsing can deny storage. */
  }
  document.documentElement.lang = next;
  document
    .querySelectorAll<FormControl>("[data-classall-validation]")
    .forEach(localizeValidity);
  listeners.forEach((listener) => listener());
}
export function useLanguage(): Language {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    currentLanguage,
    () => "en",
  );
}
const catalog = es as Record<string, string>;
const reverse = new Map(
  Object.entries(catalog).map(([key, value]) => [value, key]),
);
const patterns = Object.entries(catalog)
  .filter(([key]) => key.includes("{{"))
  .map(([key, value]) => {
    const names: string[] = [];
    const pattern = key
      .split(/(\{\{\w+\}\})/)
      .map((part) => {
        if (part.startsWith("{{")) {
          names.push(part.slice(2, -2));
          return "(.+?)";
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("");
    return { regex: new RegExp("^" + pattern + "$"), value, names };
  });
export function t(
  key: string | null | undefined,
  values: Record<string, unknown> = {},
): string {
  if (key == null) return "";
  const source = Object.hasOwn(catalog, key) ? key : (reverse.get(key) ?? key);
  let translated =
    language === "es"
      ? (catalog[source] ?? catalog[source.trim()] ?? source)
      : source;
  if (
    language === "es" &&
    translated === source &&
    !Object.keys(values).length
  ) {
    for (const pattern of patterns) {
      const match = pattern.regex.exec(source);
      if (match) {
        translated = pattern.value;
        values = Object.fromEntries(
          pattern.names.map((name, i) => [name, match[i + 1]]),
        );
        break;
      }
    }
  }
  return translated.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    String(values[name] ?? ""),
  );
}
export function LanguageSelector() {
  const language = useLanguage();
  return (
    <label className="language-select">
      <span>{t("Language")}</span>
      <select
        aria-label={t("Interface language")}
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
      >
        <option value="en">EN</option>
        <option value="es">ES</option>
      </select>
    </label>
  );
}

if (typeof document !== "undefined") document.documentElement.lang = language;

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
function isFormControl(target: EventTarget | null): target is FormControl {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  );
}
function localizeValidity(control: FormControl) {
  control.setCustomValidity("");
  if (control.validity.valid) return;
  const validity = control.validity;
  let message = t("Check this value.");
  if (validity.valueMissing) message = t("Please complete this field.");
  else if (
    validity.rangeUnderflow ||
    validity.rangeOverflow ||
    validity.stepMismatch
  )
    message = t("Choose a value within the allowed range.");
  else if (validity.tooShort && "minLength" in control)
    message = t("Use at least {{0}} characters.", { 0: control.minLength });
  else if (validity.tooLong && "maxLength" in control)
    message = t("Use no more than {{0}} characters.", { 0: control.maxLength });
  control.dataset.classallValidation = "true";
  control.setCustomValidity(message);
}
export function useLocalizedValidation() {
  useEffect(() => {
    const invalid = (event: Event) => {
      if (isFormControl(event.target)) localizeValidity(event.target);
    };
    const clear = (event: Event) => {
      if (isFormControl(event.target)) {
        event.target.setCustomValidity("");
        delete event.target.dataset.classallValidation;
      }
    };
    document.addEventListener("invalid", invalid, true);
    document.addEventListener("input", clear, true);
    document.addEventListener("change", clear, true);
    return () => {
      document.removeEventListener("invalid", invalid, true);
      document.removeEventListener("input", clear, true);
      document.removeEventListener("change", clear, true);
    };
  }, []);
}
