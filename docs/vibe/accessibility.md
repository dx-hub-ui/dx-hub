# Guia de Acessibilidade — Vibe

Siga estas orientações ao implementar componentes Vibe para garantir conformidade com WCAG 2.1 AA.

## Fundamentos
- Utilize o foco visual padrão do Vibe e evite removê-lo com CSS customizado.
- Garanta contraste mínimo 4.5:1 para texto e 3:1 para elementos gráficos.
- Prefira componentes Vibe que já expõem atributos semânticos corretos (ex.: `Dialog`, `Tooltip`, `Tabs`).

## Teclado e DnD
- Todas as ações devem ser acionáveis por teclado; forneça atalhos e rotação de foco previsível.
- Em fluxos de arrastar e soltar, utilize `aria-grabbed`, `aria-dropeffect` e mensagens em `aria-live` para anunciar mudanças.
- Evite capturar a roda do mouse ou gestos sem oferecer alternativa via teclado.

## Feedback e mensagens
- Utilize `Toast` ou `Snackbar` com duração adequada (≥6s) e opção de fechar.
- Mensagens de erro devem apontar o campo associado com `aria-describedby`.
- Em formulários assíncronos, mantenha `aria-busy="true"` até a conclusão.

## i18n
- Todas as strings devem passar pelo sistema de tradução: `t('namespace:key')`.
- Evite siglas e traduções literais; consulte o [glossário PT-BR](../i18n/glossario.md) (criar quando disponível).

> Execute o addon `@storybook/addon-a11y` e revise manualmente antes de aprovar o PR.
