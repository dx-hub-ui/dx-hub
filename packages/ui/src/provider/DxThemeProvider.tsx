"use client";

import { type ReactElement, useEffect, useMemo } from "react";
import ThemeProvider from "@vibe/core/dist/components/ThemeProvider";
import { DxTelemetryProvider, type TelemetryConfig } from "../telemetry/TelemetryProvider";
import type { DxDensity } from "../components/types";

export interface DxThemeProviderProps {
  children: React.ReactNode;
  /** Default system theme applied to the document root. */
  systemTheme?: "light" | "dark";
  /** Density flag stored as a data attribute for wrappers. */
  density?: DxDensity;
  /** Optional PostHog telemetry configuration. */
  telemetry?: TelemetryConfig;
}

export function DxThemeProvider({
  children,
  systemTheme = "light",
  density = "compact",
  telemetry,
}: DxThemeProviderProps) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.dataset.theme = systemTheme;
    document.documentElement.dataset.density = density;
    document.body.dataset.density = density;
  }, [systemTheme, density]);

  const themeProps = useMemo(() => ({
    systemTheme,
  }), [systemTheme]);

  return (
    <DxTelemetryProvider config={telemetry}>
      <ThemeProvider {...themeProps}>{children as ReactElement}</ThemeProvider>
    </DxTelemetryProvider>
  );
}
