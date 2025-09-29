# Guia de Contribuição UI — Vibe + @dx/ui

Este guia define como construir interfaces utilizando o Vibe Design System através dos wrappers `@dx/ui`. Todo desenvolvimento de UI deve seguir estas orientações.

## 1. Consultas obrigatórias ao MCP
- Antes de iniciar uma implementação, consulte o Vibe MCP para confirmar o componente correto, variantes disponíveis e recomendações de acessibilidade.
- Registre os links retornados (componentes, ícones, padrões) no seu PR dentro da seção **Referências Vibe/MCP**.

## 2. Princípios de implementação
- Utilize wrappers `@dx/ui` existentes; crie novos wrappers somente após validar a ausência no catálogo/parity matrix.
- Mantenha a API consistente: `size` (`"sm" | "md"`), `variant` (`"primary" | "secondary" | "ghost" | "danger"`) e `density` padrão `"compact"`.
- Não adicione estilos inline; preferir tokens e temas providos pelo Vibe.
- Garantir acessibilidade (`aria-*`, `role`, `tabIndex`) e estados de foco visíveis conforme documentação.
- Todo wrapper deve emitir telemetria PostHog conforme convenções (`ui_click_*`, `ui_open_*`, `ui_submit_*`, `ui_dd_reorder`).

## 3. Checklist rápido para features de UI
1. Consultou o MCP e salvou os links?
2. Validou as necessidades de internacionalização e utilizou `t('namespace:key')`?
3. Conferiu o [checklist de acessibilidade](../storybook/accessibility-checklist.md)?
4. Documentou a variante/ícone escolhido no PR com justificativa?
5. Atualizou/consultou a Parity Matrix (quando disponível) para evitar duplicidades?

## 4. Como colaborar
- Sugestões de melhorias devem ser abertas como issues com capturas do componente Vibe original e contexto de uso.
- Revisores UI (“UI Stewards”) devem confirmar o alinhamento com este guia antes de aprovar PRs.
- Divergências em relação ao Vibe precisam de aprovação do time de design com registro no docs.

> Dúvidas frequentes: utilize o canal `#dx-ui` com prints e links MCP para acelerar o suporte.
