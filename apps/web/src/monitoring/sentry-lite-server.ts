import { headers } from "next/headers";

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
  return `${parts.host}/api/${parts.projectId}/store/?sentry_key=${parts.key}&sentry_version=7`;
}

async function sendSentry(endpoint: string, payload: Record<string, unknown>) {
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // não interrompe o fluxo server-side
  }
}

export function initServerSentry(dsn: string | undefined) {
  const parts = parseDsn(dsn);
  if (!parts) {
    return;
  }

  const endpoint = buildEndpoint(parts);

  const capture = async (error: unknown, context?: Record<string, unknown>) => {
    const message = error instanceof Error ? error.message : String(error);
    const stacktrace = error instanceof Error ? error.stack : undefined;
    let requestHeaders: Record<string, string> | undefined;
    try {
      const headerList = await headers();
      requestHeaders = Object.fromEntries(headerList.entries());
    } catch {
      requestHeaders = undefined;
    }

    await sendSentry(endpoint, {
      message,
      stacktrace,
      level: "error",
      platform: "node",
      extra: context,
      request: requestHeaders ? { headers: requestHeaders } : undefined,
    });
  };

  process.on("uncaughtException", (error) => {
    void capture(error, { source: "uncaughtException" });
  });

  process.on("unhandledRejection", (reason) => {
    void capture(reason, { source: "unhandledRejection" });
  });
}
