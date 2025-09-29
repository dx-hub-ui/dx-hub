# Fluxo de Revisões — UI Steward

Para manter o alinhamento com o Vibe sem depender de MCPs externos, instituímos o papel de **UI Steward** em cada squad.

## Responsabilidades do UI Steward
- Validar se o PR referencia os componentes corretos no [Vibe Index](../vibe/index.md).
- Confirmar que a API utilizada está alinhada ao @dx/ui (`size`, `variant`, `density`).
- Garantir que a checklist de acessibilidade foi preenchida e que o Storybook possui exemplos atualizados.
- Solicitar correções quando estilos customizados se afastarem dos tokens oficiais do Vibe.

## Fluxo de aprovação leve
1. **Autor** abre PR preenchendo o [template](../../.github/pull_request_template.md) com links e justificativas.
2. **UI Steward** revisa o Storybook preview (Vercel) e valida checklist de A11y/i18n/telemetria.
3. **UI Steward** aprova com comentário registrando o racional ou solicita ajustes.
4. **Merge** somente após aprovação do Steward + revisões usuais (QA, backend, etc.).

## Boas práticas
- Documente decisões que divergem do Vibe em `docs/governance/`.
- Reavalie este fluxo a cada sprint para reduzir gargalos e atualizar responsáveis.

> Em casos de dúvidas, compartilhe capturas ou vídeos curtos no canal `#dx-ui` para agilizar feedbacks.
