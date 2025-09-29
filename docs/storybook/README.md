# Storybook — Fonte de Verdade Visual

O Storybook deve refletir fielmente os componentes do Vibe utilizados via `@dx/ui`. Enquanto o catálogo é expandido, mantenha estas práticas:

- Cada story deve conter, no campo `parameters.docs.description.component`, links para a documentação oficial do Vibe utilizada na implementação.
- Inclua a [Checklist de Acessibilidade](./accessibility-checklist.md) como seção destacada nas páginas MDX para revisão rápida.
- Adicione controles (`argTypes`) que respeitem a API padronizada (`size`, `variant`, `density`).
- Publique variações nos temas `light` e `dark`, densidade `compact` como padrão e estados (`default`, `hover`, `focus`, `disabled`, `error`, `loading`).
- Configure os addons `@storybook/addon-a11y`, `@storybook/addon-essentials` (Controls/Docs) e `@storybook/addon-viewport`.
- Gere preview por PR (Vercel) e compartilhe o link na descrição para revisão de UI.

## Snippet sugerido (`.storybook/preview.ts`)
```ts
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    docs: {
      description: {
        component: [
          '📚 [Vibe Docs — Button](https://monday.com/vibe/components/button)',
          '🧭 Varie `size` e `density` conforme guia interno (docs/vibe/themes-density.md)'
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
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1440px', height: '900px' },
        },
      },
    },
  },
};

export default preview;
```

> Atualize o repositório com exemplos reais conforme novos componentes forem adicionados.
