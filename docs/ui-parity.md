# @dx/ui — Parity Matrix com Vibe

Use esta matriz para acompanhar o status dos wrappers `@dx/ui` frente ao catálogo Vibe. Atualize-a a cada sprint.

| Componente Vibe | Categoria | Status | Storybook | Observações |
|-----------------|-----------|--------|-----------|-------------|
| Button | Forms | ✅ Wrapped | `Primitives/Button` | API padronizada com `size`, `variant`, `density`. |
| Input | Forms | ✅ Wrapped | `Primitives/Input` | Integração com validação leve e telemetria. |
| Dialog | Overlay | ✅ Wrapped | `Primitives/Dialog` | Foco inicial garantido e telemetria de overlay. |
| Tooltip | Overlay | ✅ Wrapped | `Primitives/Tooltip` | Telemetria `ui_open_overlay` conectada. |
| Toast | Feedback | ✅ Wrapped | `Primitives/Toast` | Duração padrão 4s, telemetria unificada. |
| Table | Data Display | ✅ Wrapped | `Primitives/Table` | Reordenação acessível via drag & drop + `crm_contact_stage_changed`. |
| Card | Data Display | ✅ Wrapped | `Primitives/Card` | Wrapper fino via `Box`. |
| Kanban primitives (Card + Badge + DnD) | Data Display | 🛠️ Em uso | `CRM/Board` | Construído com wrappers existentes e A11y de DnD documentada. |
| Tabs | Navigation | 📝 Planejado | — | Mapear combinação com densidades. |
| Skeleton | Feedback | ✅ Wrapped | `Primitives/Skeleton` | Utilizar para carregamentos longos. |
| Badge | Feedback | ✅ Wrapped | `Primitives/Badge` | Revisar uso com ícones. |

Legenda: ✅ pronto · 🛠️ em progresso · 📝 planejado.
