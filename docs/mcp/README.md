# Vibe MCP — Guia de Instalação Rápida

O Vibe MCP provê acesso assistido à documentação oficial do design system da monday.com diretamente no IDE ou agente de código (Cursor, Claude Code, Zed, etc.). Siga os passos abaixo para padronizar o ambiente da equipe.

## 1. Pré-requisitos
- Node.js 22 ou superior (mesma versão utilizada no monorepo).
- Acesso à internet para baixar o pacote `@mondaycom/mcp-vibe` (beta público).
- IDE/agente com suporte a MCP (Cursor ≥ 0.45, Claude Code ≥ 1.1 ou outra ferramenta compatível com o manifesto MCP).

## 2. Instalação
1. **Instale o cliente MCP globalmente** (exemplo com `npm`):
   ```bash
   npm install -g @modelcontextprotocol/cli
   ```
2. **Adicione o servidor Vibe MCP** utilizando o arquivo [`vibe-mcp.json`](./vibe-mcp.json):
   ```bash
   mcp install ./docs/mcp/vibe-mcp.json
   ```
3. **Configure o IDE** apontando para o perfil MCP instalado. Consulte o manual específico do Cursor ou Claude Code para adicionar o servidor chamado `vibe`.

## 3. Fluxo recomendado
- Antes de criar um wrapper ou tela, consulte o MCP com prompts do tipo: `"Quais variantes de Button existem no Vibe?"`.
- Copie as referências de componentes e insira os links retornados pelo MCP no template de PR.
- Ao gerar código via agente, valide se os atributos de acessibilidade e i18n estão alinhados com os guias internos.

## 4. Dúvidas e problemas
- Erros de autenticação ou schema: verifique se o pacote está atualizado e reinstale via `mcp install`.
- Componentes ausentes: reporte no canal `#dx-ui` com o link de documentação esperado.

> Complete o [checklist de onboarding](./onboarding-checklist.md) antes de iniciar qualquer tarefa de UI.
