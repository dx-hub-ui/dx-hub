# Guia de Temas e Densidade — Vibe

## Temas
- O tema padrão é `light`; ofereça opção `dark` em todas as telas principais.
- Utilize tokens de cor do Vibe (`color-bg-primary`, `color-text-secondary`, etc.) em vez de valores hexadecimais.
- Valide contrastes de cada estado (default, hover, active, disabled) em ambos os temas.

## Densidades
- O padrão do @dx/ui é `density="compact"`.
- Forneça controles ou variantes somente quando houver orientação explícita de UX; evite densidades customizadas.
- Revise espaçamentos utilizando tokens de layout (`space-xs`, `space-sm`, `space-md`).

## Componentes compostos
- Quando combinar componentes (ex.: `Table` + `Dialog`), confirme que ambos utilizam o mesmo tema/densidade ativos.
- Em telas com listas extensas, considere `density="comfortable"` apenas se houver justificativa documentada em PR.

> Documente variações no Storybook para todos os estados (`default`, `hover`, `focus`, `disabled`, `error`, `loading`).
