# Storybook — Fonte de Verdade Visual

O Storybook deve refletir fielmente os componentes do Vibe utilizados via `@dx/ui`. Enquanto o catálogo é expandido, mantenha estas práticas:

- Cada story deve conter, no campo `parameters.docs.description.component`, links para a documentação oficial do Vibe e, quando aplicável, snippets de uso retornados pelo MCP.
- Inclua a [Checklist de Acessibilidade](./accessibility-checklist.md) como seção destacada nas páginas MDX para revisão rápida.
- Adicione controles (`argTypes`) que respeitem a API padronizada (`size`, `variant`, `density`).
- Utilize temas light/dark e densidade compact nas histórias padrão; densidades adicionais podem ser adicionadas como histórias secundárias.
- Configure o addon `@storybook/addon-a11y` e execute a verificação `axe` a cada PR.

## Snippet sugerido (`.storybook/preview.ts`)
```ts
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    docs: {
      description: {
        component: [
          '📚 [Vibe Docs — Button](https://monday.com/vibe/components/button)',
          '🤖 Consultado via MCP: `button.variants`'
        ].join('\n'),
      },
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'aria-required-attr', enabled: true },
        ],
      },
    },
  },
};

export default preview;
```

> Atualize o repositório com exemplos reais conforme novos componentes forem adicionados.
