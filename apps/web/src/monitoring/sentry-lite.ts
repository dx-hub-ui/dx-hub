const SENTRY_VERSION = "7";

interface DsnParts {
  host: string;
  projectId: string;
  key: string;
}

function parseDsn(dsn: string | undefined): DsnParts | null {
  if (!dsn) {
    return null;
  }

  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\//, "");
    if (!url.username || !projectId) {
      return null;
    }

    return {
      host: `${url.protocol}//${url.host}`,
      projectId,
      key: url.username,
    };
  } catch {
    return null;
  }
}

function buildEndpoint(parts: DsnParts) {
  return `${parts.host}/api/${parts.projectId}/store/?sentry_key=${parts.key}&sentry_version=${SENTRY_VERSION}`;
}

function sendSentry(endpoint: string, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(endpoint, blob);
    return;
  }

  void fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  }).catch(() => {
    // silenciosamente ignora erros de rede
  });
}

function formatError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack ?? undefined };
  }

  return { message: typeof error === "string" ? error : "Unknown error" };
}

export function initSentryLite(dsn: string | undefined) {
  const parts = parseDsn(dsn);
  if (!parts || typeof window === "undefined") {
    return;
  }

  const endpoint = buildEndpoint(parts);

  const send = (error: unknown, context?: Record<string, unknown>) => {
    const { message, stack } = formatError(error);
    sendSentry(endpoint, {
      message,
      stacktrace: stack,
      level: "error",
      platform: "javascript",
      release: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
      extra: context,
    });
  };

  window.addEventListener("error", (event) => {
    send(event.error ?? event.message, { source: "window.error" });
  });

  window.addEventListener("unhandledrejection", (event) => {
    send(event.reason, { source: "unhandledrejection" });
  });

  return {
    captureException: send,
  };
}

export type SentryClient = ReturnType<typeof initSentryLite>;
