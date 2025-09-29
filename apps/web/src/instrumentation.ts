import { initServerSentry } from "@/monitoring/sentry-lite-server";

export async function register() {
  initServerSentry(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
}
