# Checklist de Acessibilidade (Storybook)

Utilize esta lista ao revisar componentes e telas no Storybook. Todos os itens devem ser validados antes de aprovar um PR.

## Navegação e foco
- [ ] Ordem de tabulação segue a hierarquia visual e funcional.
- [ ] Estados de foco são visíveis em todos os temas (light/dark) e densidades.
- [ ] Componentes de arrastar e soltar informam início/fim da interação (announcements ou atributos `aria-live`).

## Semântica
- [ ] Elementos interativos utilizam `role` apropriado (`button`, `menuitem`, `dialog`, etc.).
- [ ] Atributos `aria-*` obrigatórios estão presentes (`aria-expanded`, `aria-controls`, `aria-describedby`...).
- [ ] Labels acessíveis utilizam `aria-label`, `aria-labelledby` ou `<label for>` conforme o caso.

## Contraste e temas
- [ ] Contraste mínimo 4.5:1 para texto normal e 3:1 para ícones/botões.
- [ ] Verifique ambos os temas (light/dark) e densidades (`compact`, `comfortable`).
- [ ] Estados de erro/aviso mantêm contraste adequado.

## Internacionalização
- [ ] Strings exibidas vêm do sistema de i18n (sem literais fixos).
- [ ] Placeholders e mensagens são auditáveis em PT-BR.

## Telemetria (quando aplicável)
- [ ] Eventos PostHog são disparados na interação principal do componente.
- [ ] Propriedades incluem `org_id`, `role`, `member_id_hash`, `entity` e `entity_id`.

> Use o addon `@storybook/addon-a11y` para rodar testes automatizados, mas não substitua a validação manual.
