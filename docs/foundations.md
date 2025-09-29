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

> Estes fundamentos garantem que a ausência do MCP seja compensada por processos sólidos e verificáveis.
