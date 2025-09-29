"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import common from "./locales/pt-BR/common.json" assert { type: "json" };
import auth from "./locales/pt-BR/auth.json" assert { type: "json" };
import contacts from "./locales/pt-BR/contacts.json" assert { type: "json" };
import microsites from "./locales/pt-BR/microsites.json" assert { type: "json" };
import playbooks from "./locales/pt-BR/playbooks.json" assert { type: "json" };
import errors from "./locales/pt-BR/errors.json" assert { type: "json" };

type Locale = "pt-BR";
type Namespace = "common" | "auth" | "contacts" | "microsites" | "playbooks" | "errors";

type ResourceMap = Record<Locale, Record<Namespace, Record<string, unknown>>>;

const resources: ResourceMap = {
  "pt-BR": {
    common,
    auth,
    contacts,
    microsites,
    playbooks,
    errors,
  },
};

type TranslateOptions = {
  values?: Record<string, string | number>;
};

type TranslateFn = (key: string, options?: TranslateOptions) => string;

type I18nContextValue = {
  locale: Locale;
  namespace: Namespace;
  t: TranslateFn;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(message: unknown, values?: Record<string, string | number>) {
  if (typeof message !== "string" || !values) {
    return message;
  }

  return Object.keys(values).reduce((acc, token) => acc.replaceAll(`{{${token}}}`, String(values[token])), message);
}

function resolveMessage(source: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === "object" && segment in acc) {
      return (acc as Record<string, unknown>)[segment];
    }

    return undefined;
  }, source);
}

export interface I18nProviderProps {
  children: ReactNode;
  locale?: Locale;
  namespace?: Namespace;
}

export function I18nProvider({ children, locale = "pt-BR", namespace = "common" }: I18nProviderProps) {
  const value = useMemo<I18nContextValue>(() => {
    const t: TranslateFn = (key, options) => {
      const dictionary = resources[locale]?.[namespace] ?? {};
      const result = resolveMessage(dictionary, key);

      if (!result) {
        return key;
      }

      const interpolated = interpolate(result, options?.values);
      return typeof interpolated === "string" ? interpolated : key;
    };

    return {
      locale,
      namespace,
      t,
    };
  }, [locale, namespace]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(namespace: Namespace = "common") {
  const context = useContext(I18nContext);
  const activeLocale = context?.locale ?? "pt-BR";
  const dictionary = resources[activeLocale]?.[namespace] ?? {};

  const translate: TranslateFn = (key, options) => {
    const message = resolveMessage(dictionary, key);
    if (!message) {
      return key;
    }

    const interpolated = interpolate(message, options?.values);
    return typeof interpolated === "string" ? interpolated : key;
  };

  return {
    locale: activeLocale,
    t: translate,
  };
}
