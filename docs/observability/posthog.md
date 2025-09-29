# PostHog — Dashboards Iniciais

## Eventos padronizados

| Evento | Disparo | Propriedades base |
|--------|---------|-------------------|
| `page_view` | `useTelemetry.capture` no carregamento das páginas | `pathname`, `view`, `entity` |
| `ui_click_button` | `DxButton` | `variant`, `size`, `density`, `telemetryId` |
| `ui_open_overlay` | `DxDialog`, `DxToast`, `DxTooltip` | `overlay`, `state`, `variant`, `telemetryId` |
| `ui_submit_form` | `DxInput` blur/Enter | `form`, `density`, `telemetryId` |
| `ui_dd_reorder` | `DxTable` drag & drop | `area`, `from`, `to`, `density` |
| `crm_contact_created` | Formulário "Novo contato" | `contact_id`, `stage`, `org_id`, `entity` |
| `crm_contact_stage_changed` | Kanban/table alteram estágio | `contact_id`, `from_stage`, `to_stage`, `org_id`, `entity` |
| `microsite_created` | Dialog de criação de microsite | `microsite_id`, `slug`, `role`, `org_id` |
| `microsite_published` | Ação "Publicar" no painel | `microsite_id`, `slug`, `member_id`, `role` |
| `microsite_qr_downloaded` | Botões de download de QR | `microsite_id`, `format`, `slug` |
| `microsite_lead_submitted` | Formulário público `/m/{org}/{slug}` | `microsite_id`, `org_id`, `assigned_member_id` |
| `auth_login_success` | Fluxos de autenticação | `method`, `org_id`, `member_id_hash` |
| `ui_toggle_view` | Troca de tabela/kanban | `from`, `to`, `entity` |

## Dashboards recomendados

1. **UI Health (Sprint 3)** — métricas diárias para `page_view`, `ui_click_button`, `ui_open_overlay`, segmentadas por `view`.
2. **Funil de Contatos** — `ui_submit_form` → `crm_contact_created` com comparação por estágio inicial (`stage`).
3. **Interação Kanban** — `crm_contact_stage_changed` por etapa destino + `ui_dd_reorder` com segmentação por `area`.
4. **Funil Microsites** — `microsite_lead_submitted` → `crm_contact_created` filtrando por `microsite_id` e `assigned_member_id`.

> Configure alerts em PostHog para variações >30% semana a semana nos eventos principais.