# Plano de Implementação — Dashboards por Papel + Attention Box

> **Objetivo macro:** entregar painéis DX Hub multi-papel com KPIs acionáveis e Attention Box (CRUD) fiel às diretrizes vibe.monday.com/DX Hub: densidade compacta, tokens compartilhados, PT-BR, tema light/dark e a11y ≥ 90, sempre respeitando RBAC/RLS.

---

## Sprint 1 — Fundamentos de Experiência e Alinhamento Técnico

### Objetivos
- Consolidar tokens e componentes-base (layout 12 colunas, filtros persistentes, Attention Box shell) seguindo vibe.monday.com + DX Hub.
- Documentar contratos de dados/KPIs, regras de RLS e telemetria obrigatória.
- Garantir base de acessibilidade (focus order, aria, teclas) e internacionalização PT-BR.

### Entregas Principais
1. **Design System & Tokens**
   - Revisar/estender `dxDashboardTokens` (grid, gaps, breakpoints, densidade compacta) e confirmar paridade light/dark.
   - Catálogo de variantes Attention Box (info/success/warning/danger) com exemplos nos dois temas.
2. **Skeleton de UX**
   - Rota `/dashboards` com layout responsivo: filtros sempre visíveis, slots hierárquicos (Attention > Headline KPIs > gráficos/listas).
   - Componentes compartilhados (`DashboardFilterBar`, `WidgetPlaceholder`, containers de cards) com a11y base.
3. **Documentação Técnica**
   - Dicionário operacional de métricas (definições SQL, tabelas, periodicidade de cache/materialização).
   - Rascunho de políticas RLS e RBAC (Owner/Leader/Rep) + esquema `attention_boxes`/`attention_box_reads`.
   - Plano de telemetria (eventos, payload mínimo) e monitoramento (Sentry hooks).

### Critérios de Aceite
- Tokens validados em Figma/storybook com contrastes AA em light/dark.
- Skeleton navegável (desktop/tablet/mobile) com filtros funcionais (mock data) e strings PT-BR.
- Documentos revisados (produto + engenharia) publicados em `/docs/dashboards`.

---

## Sprint 2 — Dados Reais & Experiência do Org Owner

### Objetivos
- Implementar loaders/queries reais para KPIs comuns + widgets do Org Owner.
- Entregar CRUD completo de Attention Box (backend + UI) com validações, preview e telemetria.
- Preparar cache curto (60–120s) e materializações necessárias.

### Entregas Principais
1. **Backend & Performance**
   - Migrations + índices: `leads`, `contacts`, `activities`, `event_registrations`, `attention_boxes`, `cadence_assignments`.
   - Jobs (cron) para `goal_progress_snapshots`, `leaderboard_entries`, `microsite_conversions`.
   - Loader Next.js com cache revalidável + "Ver dados ao vivo" (revalidateTag + telemetry).
2. **Widgets Org Owner**
   - Headline KPIs com comparação (período anterior) e drill-down modal.
   - Funil orgânico (últimos 30d) + heatmap de atividade.
   - Performance por líder, microsites top, cadências (taxa de conclusão), metas & ranks, qualidade de dados.
   - Estados vazios e erros localizados.
3. **Attention Box CRUD**
   - Listagem com filtros (status, variante, público) e ordenação (pinned + datas).
   - Editor markdown seguro com preview light/dark, validação de datas, limites de título/corpo, "marcar como lida" (read tracking).
   - Emissão de `attention_box_viewed` e `attention_box_dismissed` + auditoria (created_by, updated_at).

### Critérios de Aceite
- Build/tipos verdes com dados reais mockados em Supabase local.
- Acessibilidade verificada (keyboard + aria-live em Attention Box/KPIs).
- RLS testado: apenas Owners conseguem CRUD; leitura respeita audiência e janelas de vigência.

---

## Sprint 3 — Experiências Leader & Rep + Interações

### Objetivos
- Adaptar widgets ao escopo Leader (subárvore) e Rep (individual) com filtros limitados.
- Implementar cadências, WhatsApp First e eventos pessoais com CTAs instrumentadas.
- Garantir consistência de telemetria (dashboard_view, kpi_click, cadence_task_action).

### Entregas Principais
1. **Leader Dashboard**
   - Reuso dos widgets do Owner com filtros automáticos (downline + self) + comparativo "Líder vs Org".
   - Distribuição de carga (tarefas pendentes por rep/cadência) e leaderboard parcial.
2. **Rep Dashboard**
   - Módulos "Minhas metas", "Minhas cadências" (due/overdue com ações Done/Snooze/WhatsApp), "WhatsApp First" (taxa resposta, tempo até 1º contato, templates populares).
   - Microsite pessoal (visitas, conversões, QR downloads) + próximos eventos/inscrições.
3. **Interações & UX Refinements**
   - Drill-downs respeitando escopo (Leader → subárvore, Rep → individual).
   - Empty states direcionais (CTA para criar microsite, iniciar cadência, etc.).
   - Telemetria detalhada por interação (payload inclui `role`, `scope`, `period`).

### Critérios de Aceite
- Guardas de UI e RLS impedem acesso indevido (testes automatizados + manuais).
- Cadence actions atualizam UI de forma otimista e sincronizam com backend.
- Strings PT-BR revisadas, sem hard-coded text no código.

---

## Sprint 4 — Hardening, A11y Final & Documentação

### Objetivos
- Otimizar performance, finalizar testes/auditorias e publicar documentação completa para operações.
- Preparar dashboards analíticos (PostHog) e guias de adoção.

### Entregas Principais
1. **Performance & Observabilidade**
   - Testes de carga nos loaders críticos; ajuste de caching e streaming quando aplicável.
   - Integração Sentry abrangendo loaders, mutações e interações críticas.
   - Botão "Ver dados ao vivo" com feedback visual e telemetria.
2. **Qualidade & Conformidade**
   - Auditoria de acessibilidade (>=90 Lighthouse/aXe), incluindo descrições textuais para gráficos.
   - Verificação light/dark e responsividade em breakpoints-chave (mobile/desktop/ultrawide).
   - Suite de testes (unitários + e2e com roles) cobrindo KPIs, Attention CRUD, cadências.
3. **Documentação & Enablement**
   - Playbook: interpretação de KPIs, criação de avisos, FAQ de filtros e escopos.
   - Atualização de dashboards PostHog: "Saúde do funil", "Adoção de cadências", "Engajamento com avisos".
   - Checklist DoD completo assinado por produto, design e engenharia.

### Critérios de Aceite
- Sem regressões de UX/performance (benchmarks comparados à Sprint 3).
- Documentação publicada (docs + Notion/handbook) e sessão de handoff registrada.
- Todos os itens do checklist DoD marcados ✅.

---

## Riscos & Mitigações
- **Carga de dados elevados:** antecipar índices e monitorar planos de execução; fallback para skeletons + mensagens amigáveis.
- **Conformidade RLS:** pair review de políticas + testes automatizados por papel.
- **Dark mode regressions:** snapshot visual/theme regression tests em componentes críticos.
- **Adoção de markdown malicioso:** sanitização estrita, whitelist de elementos e preview isomórfico.

---

## Dependências & Alinhamentos
- Aprovação de tokens e mockups vibe.monday.com (Design).
- Coordenação com time de dados para materializações diárias/semanais.
- Definição de targets/metas por papel (Produto) para widgets de metas & ranks.
- Configuração PostHog/Sentry em ambientes preview e produção.

