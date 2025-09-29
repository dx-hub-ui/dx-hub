"use client";

import { DxThemeProvider } from "@dx/ui";
import { AppShell } from "@/components/app-shell/AppShell";
import { I18nProvider } from "@/i18n/I18nProvider";
import { useEffect, type ReactNode } from "react";
import { initSentryLite } from "@/monitoring/sentry-lite";

const telemetryKey = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const telemetryHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    initSentryLite(process.env.NEXT_PUBLIC_SENTRY_DSN);
  }, []);

  return (
    <DxThemeProvider
      density="compact"
      telemetry={telemetryKey ? { apiKey: telemetryKey, host: telemetryHost } : undefined}
    >
      <I18nProvider locale="pt-BR">
        <AppShell>{children}</AppShell>
      </I18nProvider>
    </DxThemeProvider>
  );
}
