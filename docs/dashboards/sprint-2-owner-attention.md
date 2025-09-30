# Sprint 2 — Owner Dashboards & Attention Box CRUD

## Objetivos Entregues
- Conectar o dashboard de Org Owner a pipelines de dados mockados com seletores de período/escopo.
- Renderizar widgets operacionais (Funil, Heatmap, Performance por líder, Microsites, Cadências, Qualidade de dados e Metas).
- Disponibilizar CRUD completo de Attention Boxes com segmentação, agendamento e pré-visualização em markdown.

## Experiência do Org Owner
- **Headline KPIs** com deltas vs período anterior e detalhes contextualizados (respostas 24h, conversão lead→contato).
- **Funil Visitantes→Leads→Contatos→Reuniões→Vendas** com comparação histórica e conversão por etapa.
- **Heatmap de atividade** (7 dias rolling) acessível via ARIA e escalas tokenizadas.
- **Tabelas compactas** para líderes e microsites com ordenação semântica e badges de destaque.
- **Cadências e Qualidade de dados** com badges semânticos, percentuais formatados e mensagens prontas para playbooks.
- **Metas & Ranks** com resumo de atingimento e leaderboard tokenizado.

## Gestão de Attention Boxes
- **Listagem filtrável** por status, variante e público; destaque para itens fixados e ativos.
- **Editor guiado** com validações de título, markdown e intervalo de datas (datetime-local com fuso local).
- **Suporte a audiências personalizadas** com checkboxes e validação obrigatória.
- **Preview ao vivo** (HTML seguro + resumo em texto) alinhada ao componente Vibe AttentionBox.
- **Ações rápidas**: criar, editar, duplicar (anexa sufixo "(cópia)"), excluir com confirmação e reset automático de seleção.

## Internacionalização & Acessibilidade
- Novos namespaces PT-BR para métricas, widgets e gestão de avisos.
- Descrições de gráficos compatíveis com leitores de tela (`aria-live`, rótulos por célula, foco visível).
- Conversão consistente de datas para ISO/local (`formatDateTimeLocalInput`, `toIsoStringFromLocalInput`).

## Próximos Passos
- Cobrir casos de Leader/Rep com dados reais e telemetry PostHog.
- Implementar leituras persistidas via API e políticas RLS reais.
- Adicionar testes automatizados dos seletores e do store de Attention Boxes.
