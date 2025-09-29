# Testes de RLS para CRM Contatos

Os cenários abaixo foram executados no Supabase Studio após aplicar a migração `20250212000100_crm_rbac.sql`. Cada passo utiliza o editor SQL autenticado como o usuário correspondente para validar as permissões.

## Preparação
1. Criar um registro em `organizations` para `demo-org`.
2. Inserir membros para os papéis de Owner, Leader e Rep:
   ```sql
   insert into public.members (org_id, user_id, role, full_name)
   values
     ('<demo-org-id>', '<owner-user-id>', 'owner', 'Owner Demo'),
     ('<demo-org-id>', '<leader-user-id>', 'leader', 'Leader Demo'),
     ('<demo-org-id>', '<rep-user-id>', 'rep', 'Rep Demo');
   update public.members set leader_id = (select id from public.members where role = 'leader') where role = 'rep';
   ```
3. Criar um contato base associado ao Owner para servir de fixture.

## Owner
- ✅ `SELECT` retorna todos os contatos da organização.
- ✅ Pode `INSERT`, `UPDATE`, `DELETE` em `public.contacts`.
- ✅ Pode inserir atividades com `actor_member_id` próprio e enxergar todas.

## Leader
- ✅ Visualiza contatos da organização e qualquer contato atribuído aos reps sob sua liderança.
- ✅ Pode criar e atualizar contatos, desde que `org_id` corresponda e mantenha controle sobre reps liderados.
- ❌ Não consegue deletar contatos (policy restrita ao Owner).
- ✅ Consegue registrar atividades para contatos acessíveis.

## Rep
- ✅ Visualiza somente contatos em que é `owner_member_id` ou `assigned_member_id`.
- ✅ Pode atualizar contatos que possui ou que estão atribuídos a ele.
- ✅ Pode criar novos contatos desde que se auto-atribua.
- ❌ Não consegue inserir atividades para contatos que não controla (bloqueio pelo `with check`).

## Auditoria
- Cada cenário foi registrado com capturas de tela anexadas ao ticket interno DX-CRM-45.
- Logs de Postgres confirmam que políticas `member_can_access_contact` e `member_can_manage_contact` foram acionadas conforme esperado.
