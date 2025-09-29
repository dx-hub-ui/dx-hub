const STORAGE_KEY = "dx-posthog-distinct-id";

function ensureDistinctId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) {
      return existing;
    }
    const fresh = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

function sendEvent(url: string, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }

  void fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  }).catch(() => {
    // swallow network errors to avoid crashing the UI.
  });
}

export class PostHogLite {
  private distinctId = ensureDistinctId();
  private identifiedId: string | null = null;

  constructor(private apiKey: string, private host: string) {}

  capture(event: string, properties?: Record<string, unknown>) {
    if (!event) {
      return;
    }

    const endpoint = `${this.host}/capture/`;
    const distinctId = this.identifiedId ?? this.distinctId;
    sendEvent(endpoint, {
      api_key: this.apiKey,
      event,
      properties: {
        distinct_id: distinctId,
        $lib: "posthog-lite",
        $lib_version: "0.0.1",
        ...properties,
      },
    });
  }

  identify(userId: string, properties?: Record<string, unknown>) {
    if (!userId) {
      return;
    }
    this.identifiedId = userId;
    this.capture("$identify", {
      distinct_id: userId,
      $anon_distinct_id: this.distinctId,
      ...properties,
    });
  }
}
