# PostHog — Dashboards Iniciais

## Eventos padronizados

| Evento | Disparo | Propriedades base |
|--------|---------|-------------------|
| `page_view` | `useTelemetry.capture` no carregamento das páginas | `pathname`, `view` |
| `ui_click_button` | `DxButton` | `variant`, `size`, `density`, `telemetryId` |
| `ui_open_overlay` | `DxDialog`, `DxToast`, `DxTooltip` | `overlay`, `state`, `variant`, `telemetryId` |
| `ui_submit_form` | `DxInput` blur/Enter | `form`, `density`, `telemetryId` |
| `ui_dd_reorder` | `DxTable` drag & drop | `area`, `from`, `to`, `density` |
| `auth_login_success` | Fluxos de autenticação | `method`, `org_id`, `member_id_hash` |
| `ui_toggle_view` | Troca de tabela/kanban | `from`, `to`, `entity` |

## Dashboards recomendados

1. **UI Health (Sprint 2)** — métricas diárias para `page_view`, `ui_click_button`, `ui_open_overlay`, com filtro por `density`.
2. **Formulários** — funil `ui_submit_form` → `crm_contact_created` (quando implementado), destacando abandono por `form`.
3. **Interação Kanban** — tabela de `ui_dd_reorder` com segmentação por `area` e `role`.

> Configure alerts em PostHog para variações >30% semana a semana nos eventos principais.
