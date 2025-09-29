# Cookbook DX — Padrões Aprovados com Vibe

Use estes fluxos como referência para compor telas completas respeitando o Vibe Design System. Cada receita inclui os componentes recomendados, considerações de acessibilidade e eventos de telemetria sugeridos.

## Dialog + Form + Toast (Criação de registro)
- **Componentes**: `Dialog`, `Form`, `Input`, `Select`, `Button`, `Toast`.
- **Acessibilidade**: defina `role="dialog"`, foque o primeiro campo ao abrir e mantenha `aria-describedby` com instruções.
- **Telemetria**: dispare `ui_open_overlay` ao abrir e `ui_submit_form` com resultado (`success`/`error`).
- **i18n**: mensagens de validação e feedback em `t('contacts:create.success')`, `t('contacts:create.error')` etc.

## Card + Menu + Dialog (Kanban actions)
- **Componentes**: `Card`, `Menu`, `MenuItem`, `Dialog`, `Badge`.
- **Acessibilidade**: botão de menu com `aria-haspopup="menu"` e gerenciamento de foco entre menu e diálogo.
- **Telemetria**: `ui_click_menu` para abertura do menu contextual e `crm_contact_stage_changed` ao confirmar.
- **Densidade**: mantenha `density="compact"` como padrão e utilize tokens de espaçamento do Vibe.

## Table + Toolbar + Skeleton (Listagens)
- **Componentes**: `Table`, `Toolbar`, `Search`, `Filter`, `Skeleton`, `EmptyState`.
- **Acessibilidade**: títulos de coluna com `scope="col"` e leitura de resultados (`aria-live`) ao aplicar filtros.
- **Telemetria**: `ui_toggle_view` quando alternar densidade/colunas e `page_view` com `entity='contacts_table'`.
- **Performance**: utilize `Skeleton` enquanto dados carregam para evitar layout shift.

## Tooltip + IconButton (Ações rápidas)
- **Componentes**: `IconButton`, `Tooltip`.
- **Acessibilidade**: `aria-label` descritivo e fallback textual para leitores de tela.
- **Telemetria**: `ui_click_*` com `entity_action` especificando a ação executada.
- **Temas**: verifique contraste em light/dark principalmente para ícones.

> Ao propor novos padrões, documente-os neste cookbook com o racional e links de Storybook correspondentes.
