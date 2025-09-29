"use client";

import { createContext, useContext, useMemo, useRef } from "react";
import { PostHogLite } from "./PostHogLite";

type CaptureFn = (event: string, properties?: Record<string, unknown>) => void;

type IdentifyFn = (userId: string, properties?: Record<string, unknown>) => void;

type TelemetryContextValue = {
  capture: CaptureFn;
  identify: IdentifyFn;
};

const noop: CaptureFn = () => undefined;
const noopIdentify: IdentifyFn = () => undefined;

const TelemetryContext = createContext<TelemetryContextValue>({
  capture: noop,
  identify: noopIdentify,
});

export interface TelemetryConfig {
  apiKey: string;
  host?: string;
}

export interface TelemetryProviderProps {
  children: React.ReactNode;
  config?: TelemetryConfig;
}

export function DxTelemetryProvider({ children, config }: TelemetryProviderProps) {
  const clientRef = useRef<PostHogLite | null>(null);

  const value = useMemo<TelemetryContextValue>(() => {
    if (!config || !config.apiKey) {
      clientRef.current = null;
      return {
        capture: noop,
        identify: noopIdentify,
      };
    }

    if (typeof window === "undefined") {
      clientRef.current = null;
      return {
        capture: noop,
        identify: noopIdentify,
      };
    }

    if (!clientRef.current) {
      const host = config.host ?? "https://app.posthog.com";
      clientRef.current = new PostHogLite(config.apiKey, host);
    }

    return {
      capture: (event, properties) => {
        clientRef.current?.capture(event, properties);
      },
      identify: (userId, properties) => {
        clientRef.current?.identify(userId, properties);
      },
    };
  }, [config]);

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
}

export function useTelemetry() {
  return useContext(TelemetryContext);
}
