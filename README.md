# DX Hub

Monorepo (web + mobile) com pnpm + Turbo. Supabase para Auth/DB/Storage.

## Governança de UI
- Consulte a [documentação interna](docs/README.md) para acessar o Vibe Index, cookbook de padrões, guia de acessibilidade e fluxo de revisões com UI Steward.
- Utilize o template de PR para registrar as referências Vibe consultadas e comprovar as validações de acessibilidade, i18n e telemetria.

## Observabilidade & Telemetria
- `@dx/ui` encapsula wrappers do Vibe com telemetria automática (`ui_click_*`, `ui_open_overlay`, `ui_submit_form`, `ui_dd_reorder`).
- PostHog Lite é inicializado via `DxThemeProvider` (configure `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`).
- Sentry Lite captura erros em client/server (`NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN`) e remove PII antes do envio.
