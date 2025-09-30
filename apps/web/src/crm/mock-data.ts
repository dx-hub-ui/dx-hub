import {
  DEMO_ORG_ID,
  PROSPECT_STATUS_ORDER,
  type ProspectActivity,
  type ProspectRecord,
} from "./types";

const now = new Date();

function isoDaysAgo(days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function buildActivities(prospectId: string, seed: Omit<ProspectActivity, "id">[]): ProspectActivity[] {
  return seed.map((activity, index) => ({
    ...activity,
    id: `${prospectId}-activity-${index + 1}`,
  }));
}

export const PROSPECTS_SEED: ProspectRecord[] = [
  {
    id: "prospect-ana-ribeiro",
    orgId: DEMO_ORG_ID,
    createdAt: isoDaysAgo(15),
    updatedAt: isoDaysAgo(2),
    nomeCompleto: "Ana Ribeiro",
    email: "ana.ribeiro@example.com",
    telefone: "+55 11 99888-1122",
    countryCode: "BR",
    status: "em_andamento",
    responsavelId: "member-joao",
    responsavelNome: "João Martins",
    interesse: "muito_interessado",
    origem: "instagram",
    proximoFollowUpAt: isoDaysAgo(-1),
    tags: ["instagram", "hot"],
    notas: "Interessada na proposta do kit premium, pediu para revisar plano de compensação.",
    activitiesCount: 6,
    archivedAt: null,
    activities: buildActivities("prospect-ana-ribeiro", [
      {
        prospectId: "prospect-ana-ribeiro",
        tipo: "mensagem",
        conteudo: "Resposta rápida no direct com dúvidas sobre o plano.",
        anexosCount: 0,
        criadoPor: "João Martins",
        createdAt: isoDaysAgo(2),
      },
      {
        prospectId: "prospect-ana-ribeiro",
        tipo: "follow_up",
        conteudo: "Agendado follow-up via WhatsApp para revisar contrato.",
        anexosCount: 0,
        criadoPor: "João Martins",
        createdAt: isoDaysAgo(1),
      },
    ]),
  },
  {
    id: "prospect-diego-silva",
    orgId: DEMO_ORG_ID,
    createdAt: isoDaysAgo(30),
    updatedAt: isoDaysAgo(5),
    nomeCompleto: "Diego Silva",
    email: "diego.silva@example.com",
    telefone: "+55 21 97777-3344",
    countryCode: "BR",
    status: "cadastrado",
    responsavelId: "member-paula",
    responsavelNome: "Paula Ribeiro",
    interesse: "interessado",
    origem: "indicacao",
    proximoFollowUpAt: isoDaysAgo(-3),
    tags: ["rede-sul", "premium"],
    notas: "Já assinou cadastro e aguarda kit inicial.",
    activitiesCount: 4,
    archivedAt: null,
    activities: buildActivities("prospect-diego-silva", [
      {
        prospectId: "prospect-diego-silva",
        tipo: "apresentacao",
        conteudo: "Participou da apresentação semanal com líderes regionais.",
        anexosCount: 1,
        criadoPor: "Paula Ribeiro",
        createdAt: isoDaysAgo(7),
      },
      {
        prospectId: "prospect-diego-silva",
        tipo: "sistema",
        conteudo: "Cadastro aprovado no backoffice MMN.",
        anexosCount: 0,
        criadoPor: "Sistema",
        createdAt: isoDaysAgo(3),
      },
    ]),
  },
  {
    id: "prospect-helena-oliveira",
    orgId: DEMO_ORG_ID,
    createdAt: isoDaysAgo(8),
    updatedAt: isoDaysAgo(3),
    nomeCompleto: "Helena Oliveira",
    email: "helena.oliveira@example.com",
    telefone: "+55 31 98888-8877",
    countryCode: "BR",
    status: "novo",
    responsavelId: "member-joao",
    responsavelNome: "João Martins",
    interesse: "interessado",
    origem: "evento",
    proximoFollowUpAt: isoDaysAgo(-2),
    tags: ["evento-bh"],
    notas: "Conheceu o produto no evento em BH, aguarda materiais.",
    activitiesCount: 2,
    archivedAt: null,
    activities: buildActivities("prospect-helena-oliveira", [
      {
        prospectId: "prospect-helena-oliveira",
        tipo: "nota",
        conteudo: "Interesse alto em revender cosméticos veganos.",
        anexosCount: 0,
        criadoPor: "João Martins",
        createdAt: isoDaysAgo(3),
      },
    ]),
  },
  {
    id: "prospect-marta-costa",
    orgId: DEMO_ORG_ID,
    createdAt: isoDaysAgo(60),
    updatedAt: isoDaysAgo(12),
    nomeCompleto: "Marta Costa",
    email: "marta.costa@example.com",
    telefone: "+351 91 555 6677",
    countryCode: "PT",
    status: "rejeitado",
    responsavelId: "member-paula",
    responsavelNome: "Paula Ribeiro",
    interesse: "nao_tao_interessado",
    origem: "outros",
    proximoFollowUpAt: null,
    tags: ["cold"],
    notas: "Preferiu aguardar próximo ciclo por motivos financeiros.",
    activitiesCount: 3,
    archivedAt: null,
    activities: buildActivities("prospect-marta-costa", [
      {
        prospectId: "prospect-marta-costa",
        tipo: "ligacao",
        conteudo: "Ligação de qualificação sem interesse imediato.",
        anexosCount: 0,
        criadoPor: "Paula Ribeiro",
        createdAt: isoDaysAgo(20),
      },
    ]),
  },
  {
    id: "prospect-igor-lopes",
    orgId: DEMO_ORG_ID,
    createdAt: isoDaysAgo(18),
    updatedAt: isoDaysAgo(1),
    nomeCompleto: "Igor Lopes",
    email: "igor.lopes@example.com",
    telefone: "+55 62 91234-5566",
    countryCode: "BR",
    status: "em_andamento",
    responsavelId: "member-larissa",
    responsavelNome: "Larissa Gomes",
    interesse: "muito_interessado",
    origem: "funil",
    proximoFollowUpAt: isoDaysAgo(-4),
    tags: ["funil-ebook", "seguimento"],
    notas: "Gerou lead pelo funil de e-book, já recebeu proposta.",
    activitiesCount: 5,
    archivedAt: null,
    activities: buildActivities("prospect-igor-lopes", [
      {
        prospectId: "prospect-igor-lopes",
        tipo: "follow_up",
        conteudo: "Follow-up via e-mail com proposta detalhada.",
        anexosCount: 2,
        criadoPor: "Larissa Gomes",
        createdAt: isoDaysAgo(4),
      },
      {
        prospectId: "prospect-igor-lopes",
        tipo: "mensagem",
        conteudo: "Respondeu no WhatsApp confirmando interesse em kit elite.",
        anexosCount: 0,
        criadoPor: "Larissa Gomes",
        createdAt: isoDaysAgo(1),
      },
    ]),
  },
];

export const CRM_CONTACTS_SEED = PROSPECTS_SEED;
export const BOARD_COLUMN_ORDER = PROSPECT_STATUS_ORDER;

export const PROSPECT_RESPONSIBLES = [
  { id: "member-joao", nome: "João Martins" },
  { id: "member-paula", nome: "Paula Ribeiro" },
  { id: "member-larissa", nome: "Larissa Gomes" },
];

export const DEFAULT_COLUMN_PREFERENCES = [
  { id: "select", visible: true, pinned: "left" as const },
  { id: "nome", visible: true, pinned: "left" as const },
  { id: "email", visible: true },
  { id: "telefone", visible: true },
  { id: "timeline", visible: true },
  { id: "interesse", visible: true },
  { id: "origem", visible: true },
  { id: "tags", visible: true },
  { id: "follow_up", visible: true },
  { id: "status", visible: true, pinned: "right" as const },
];

export const DEFAULT_GROUP_PREFERENCE = { key: "status" as const };
export const DEFAULT_SORT_PREFERENCE = { field: "atualizado_em" as const, direction: "desc" as const };
