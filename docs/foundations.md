# Fundamentos de Infraestrutura — Sprint 1

## Monorepo
- Utilizamos `pnpm` + `turbo` para orquestrar builds. Execute `pnpm install` e `pnpm turbo run lint test build` antes de abrir PR.
- Pastas principais: `apps/` (front), `packages/` (bibliotecas compartilhadas), `docs/` (governança).

## CI
- Pipeline deve rodar lint (`pnpm lint`), typecheck (`pnpm typecheck`) e testes (`pnpm test`).
- Falhas bloqueiam merge; resolva localmente ou ajuste o pipeline conforme necessário.

## Vercel
- Cada PR gera preview automático. Inclua o link na seção de screenshots do template.
- Utilize o preview para validar temas (light/dark), densidades e checklist de acessibilidade.

## Supabase
- Versione alterações de schema em `supabase/migrations/*.sql`.
- Teste policies RLS no Supabase Studio e registre resultados na descrição do PR quando afetarem permissões.

## Observabilidade
- Sentry Lite captura erros no cliente/servidor via `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN`. O envio remove headers sensíveis automaticamente.
- PostHog Lite (configurado em `DxThemeProvider`) publica eventos padronizados (`page_view`, `ui_click_*`, `ui_open_overlay`, etc.).
- Ative `productionBrowserSourceMaps` para permitir upload de sourcemaps no pipeline.


> Estes fundamentos garantem que a ausência do MCP seja compensada por processos sólidos e verificáveis.

