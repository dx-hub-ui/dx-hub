# Sprint 1 — Fundações do Dashboard DX Hub

## Visão geral
- **Objetivo:** estabelecer o esqueleto de UX para os painéis por papel e preparar o CRUD de Attention Box.
- **Entrega:** layout responsivo 12 colunas (compact density), filtros sempre visíveis, placeholders acessíveis e tokens compartilhados alinhados ao Vibe.
- **Escopo:** App web Next.js (`apps/web`), design tokens globais, documentação de métricas e regras de acesso.

## Tokens e theming (DX Hub + Vibe)
| Token | Tipo | Definição | Uso |
| --- | --- | --- | --- |
| `--dx-space-1..8` | Espaçamento | Escala compacta (0.25rem – 3rem) | Gaps de cards, filtros e grids |
| `--dx-radius-sm/md/lg` | Raios | 12px / 16px / 24px | Cartões, Attention Box, botões |
| `--dx-shadow-soft/elevated` | Sombra | Referência a `@vibe/core` | Profundidade de cards e filtros |
| `--dx-layout-max-width` | Layout | 1180px | Limite do conteúdo principal |
| `--dx-layout-content-gap` | Layout | 2rem | Espaçamento vertical entre seções |
| `--dx-typography-xs/sm/md/lg` | Tipografia | Escala PT-BR legível | Labels, descrições e títulos |
| `dxDashboardTokens` | TS export | Grid, filtros, attention box | Reuso em futuros widgets |

## Layout e componentes
- **Hero + filtros:** `DashboardFilterBar` expõe papel, período, escopo e estágio com `aria-label` e teclado.
- **Attention Section:** cards prioritários (pinned primeiro) com `aria-live` e ação "Gerenciar avisos" gated para Owner.
- **Headline KPIs:** placeholders com `WidgetPlaceholder` e suporte a `aria-live` para animação de números.
- **Widgets por papel:** grid 12 col com `WidgetPlaceholder` pré-mapeado (Owner, Leader, Rep) + blocos comuns (Tarefas, Eventos).
- **Tokens usados diretamente:** `dxDashboardTokens.grid` aplica `rowGap/columnGap` garantindo consistência com theme.

## Filtros e escopos por papel
| Papel | Escopos liberados | Notas |
| --- | --- | --- |
| Owner | Org / Team / Self | Pode criar/gerir Attention Boxes |
| Leader | Team / Self | Visual limitado à subárvore |
| Rep | Self | Sem ações administrativas |

## Métricas — contrato operacional
| Métrica | Definição | Fonte | Observações |
| --- | --- | --- | --- |
| Novos leads | `COUNT(leads)` por período + escopo | `leads` | Cache 60–120s |
| Novos contatos | `COUNT(contacts)` por período + escopo | `contacts` | Drill-down lista contatos |
| Reuniões marcadas | `COUNT(event_registrations WHERE type='reunião' AND status='registered')` | `event_registrations` | Suporte a agenda |
| Taxa resposta 24h | `respostas <=24h / leads contatados` | `activities` | Heurística Fase 1 |
| Conversão lead→contato | `contatos originados / leads` | `contacts`, `leads` | Ocultar se dados incompletos |
| Qualidade de dados | `% contatos sem follow-up > X dias`, duplicidades | `contacts`, `activities` | Alertas em Attention Box |

## Attention Box — RLS & UX
- **Tabelas:** `attention_boxes`, `attention_box_reads` (marcar como lido).
- **RLS:**
  - `SELECT`: membros da org com `org_id` + período ativo + público compatível.
  - `INSERT/UPDATE/DELETE`: somente Org Owner.
- **Prioridade de exibição:** pinned DESC > start_at DESC. Pinned permanece mesmo lido.
- **Telemetria:** eventos `attention_box_viewed` e `attention_box_dismissed` emitidos pelo componente.

## Telemetria & Observabilidade
- **Eventos definidos:** `dashboard_view`, `kpi_click`, `attention_box_viewed/dismissed`, `cadence_task_action` (futuro).
- **Ações futuras:** integrar PostHog via `DxTelemetryProvider`, instrumentar CTA dos placeholders e mapear `scope/period` como propriedades.

## Próximos passos (Sprint 2+)
1. Implementar queries reais e jobs de materialização (`goal_progress_snapshots`, `leaderboard_entries`, `microsite_conversions`).
2. Construir CRUD completo de Attention Box com preview dark/light + validações de markdown.
3. Conectar widgets a dados reais e aplicar RLS (Owner/Subárvore/Rep) nas requisições.
4. Adicionar estados vazios, loaders e smoke tests de acessibilidade (keyboard + aria-live).
