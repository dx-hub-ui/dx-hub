export const PROSPECT_STATUS_ORDER = [
  "novo",
  "em_andamento",
  "cadastrado",
  "rejeitado"
] as const;

export type ProspectStatus = (typeof PROSPECT_STATUS_ORDER)[number];

export const PROSPECT_INTEREST_OPTIONS = [
  "nao_tao_interessado",
  "interessado",
  "muito_interessado"
] as const;

export type ProspectInterest = (typeof PROSPECT_INTEREST_OPTIONS)[number];

export const PROSPECT_ORIGINS = [
  "instagram",
  "indicacao",
  "evento",
  "funil",
  "outros"
] as const;

export type ProspectOrigin = (typeof PROSPECT_ORIGINS)[number];

export type ProspectActivityType =
  | "nota"
  | "ligacao"
  | "mensagem"
  | "reuniao"
  | "apresentacao"
  | "follow_up"
  | "sistema";

export interface ProspectActivityMeta {
  recordingUrl?: string;
  durationSeconds?: number;
  externalId?: string;
  attachments?: number;
}

export interface ProspectActivity {
  id: string;
  prospectId: string;
  tipo: ProspectActivityType;
  conteudo: string;
  anexosCount: number;
  criadoPor: string;
  createdAt: string;
  meta?: ProspectActivityMeta;
}

export interface ProspectRecord {
  id: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  nomeCompleto: string;
  email?: string | null;
  telefone?: string | null;
  countryCode?: string | null;
  status: ProspectStatus;
  responsavelId: string;
  responsavelNome: string;
  interesse: ProspectInterest;
  origem: ProspectOrigin;
  proximoFollowUpAt?: string | null;
  tags: string[];
  notas?: string | null;
  activitiesCount: number;
  archivedAt?: string | null;
  activities?: ProspectActivity[];
}

export interface ProspectGroupPreference {
  key: "responsavel" | "status" | "origem" | "tag" | "none";
}

export interface ProspectSortPreference {
  field: "nome" | "status" | "proximo_follow_up" | "interesse" | "atualizado_em";
  direction: "asc" | "desc";
}

export interface ProspectFilters {
  search?: string;
  responsaveis?: string[];
  status?: ProspectStatus[];
  interesse?: ProspectInterest[];
  origem?: ProspectOrigin[];
  tags?: string[];
  periodo?: {
    from?: string;
    to?: string;
  };
  archived?: boolean;
}

export type ProspectColumnId =
  | "select"
  | "nome"
  | "email"
  | "telefone"
  | "timeline"
  | "interesse"
  | "origem"
  | "tags"
  | "follow_up"
  | "status";

export interface ProspectColumnPreference {
  id: ProspectColumnId;
  visible: boolean;
  width?: number;
  pinned?: "left" | "right" | null;
}

export const DEMO_ORG_ID = "demo-org";
