import { nanoid } from "nanoid";
import type { MicrositeActivity, MicrositeLead, MicrositeMember, MicrositeRecord, MicrositeRole } from "./types";

const MICROSITES_REFERENCE_TIME = Date.UTC(2024, 2, 11, 12, 0, 0);
const MINUTE_IN_MS = 1000 * 60;
const HOUR_IN_MS = MINUTE_IN_MS * 60;

function minutesAgo(minutes: number) {
  return new Date(MICROSITES_REFERENCE_TIME - minutes * MINUTE_IN_MS).toISOString();
}

function hoursAgo(hours: number) {
  return new Date(MICROSITES_REFERENCE_TIME - hours * HOUR_IN_MS).toISOString();
}

function daysAgo(days: number) {
  return hoursAgo(days * 24);
}

export const DEMO_ORG_ID = "org-demo-001";

export const MICROSITE_MEMBERS: MicrositeMember[] = [
  { id: "member-owner", name: "João Martins", role: "owner", email: "joao@dxcrm.com" },
  { id: "member-leader", name: "Ana Souza", role: "leader", email: "ana@dxcrm.com" },
  { id: "member-rep-1", name: "Marcos Lima", role: "rep", email: "marcos@dxcrm.com" },
  { id: "member-rep-2", name: "Patrícia Alves", role: "rep", email: "patricia@dxcrm.com" },
];

export const MICROSITES_SEED: MicrositeRecord[] = [
  {
    id: "ms-001",
    orgId: DEMO_ORG_ID,
    ownerId: "member-owner",
    ownerName: "João Martins",
    ownerRole: "owner",
    slug: "demo-horizonte-tech",
    title: "Horizonte Tech",
    headline: "Acelere sua transformação digital",
    description:
      "Apresente seus serviços de consultoria com formulários acessíveis, integrações nativas e acompanhamento em tempo real.",
    status: "published",
    theme: "light",
    lastPublishedAt: hoursAgo(8),
    totalLeads: 18,
    lastLeadAt: minutesAgo(20),
    showContactPhone: true,
    enableCaptcha: true,
  },
  {
    id: "ms-002",
    orgId: DEMO_ORG_ID,
    ownerId: "member-leader",
    ownerName: "Ana Souza",
    ownerRole: "leader",
    slug: "demo-rede-varejo",
    title: "Rede Varejo",
    headline: "Conheça nossas soluções omnichannel",
    description:
      "Capte oportunidades qualificada com landing pages prontas para mobile, QR code e integração automática com CRM.",
    status: "draft",
    theme: "dark",
    lastPublishedAt: null,
    totalLeads: 6,
    lastLeadAt: daysAgo(1),
    showContactPhone: false,
    enableCaptcha: false,
  },
  {
    id: "ms-003",
    orgId: DEMO_ORG_ID,
    ownerId: "member-rep-1",
    ownerName: "Marcos Lima",
    ownerRole: "rep",
    slug: "demo-startup-summit",
    title: "Startup Summit",
    headline: "Participe da rodada de mentoria",
    description:
      "Agende uma conversa rápida com nosso time e descubra como aumentar a taxa de conversão com cadência personalizada.",
    status: "published",
    theme: "light",
    lastPublishedAt: daysAgo(2),
    totalLeads: 12,
    lastLeadAt: hoursAgo(5),
    showContactPhone: true,
    enableCaptcha: false,
  },
];

export const MICROSITE_ACTIVITIES: MicrositeActivity[] = [
  {
    id: "act-001",
    micrositeId: "ms-001",
    type: "lead",
    createdAt: minutesAgo(20),
    actorId: "member-rep-1",
    actorName: "Marcos Lima",
    summary: "Lead via microsite — estágio atualizado para 'Novo'.",
  },
  {
    id: "act-002",
    micrositeId: "ms-002",
    type: "updated",
    createdAt: hoursAgo(3),
    actorId: "member-leader",
    actorName: "Ana Souza",
    summary: "Layout atualizado com novas perguntas obrigatórias.",
  },
  {
    id: "act-003",
    micrositeId: "ms-003",
    type: "published",
    createdAt: hoursAgo(30),
    actorId: "member-rep-1",
    actorName: "Marcos Lima",
    summary: "Microsite republicado com imagens otimizadas.",
  },
];

export const MICROSITE_LEADS: MicrositeLead[] = [
  {
    id: "lead-001",
    micrositeId: "ms-001",
    name: "Fernanda Oliveira",
    email: "fernanda@empresa.com",
    phone: "+55 11 98800-1020",
    message: "Gostaria de uma demonstração ainda esta semana.",
    createdAt: minutesAgo(15),
    assignedMemberId: "member-rep-2",
  },
  {
    id: "lead-002",
    micrositeId: "ms-003",
    name: "Ricardo Alves",
    email: "ricardo@startup.com",
    createdAt: hoursAgo(5),
    assignedMemberId: "member-rep-1",
  },
];

export function createMicrositeId() {
  return `ms-${nanoid(8)}`;
}

export function createLeadId() {
  return `lead-${nanoid(10)}`;
}

export function isRoleElevated(role: MicrositeRole) {
  return role === "owner" || role === "leader";
}
export const MICROSITE_DOWNLINES: Record<string, string[]> = {
  "member-owner": MICROSITE_MEMBERS.filter((member) => member.id !== "member-owner").map((member) => member.id),
  "member-leader": ["member-rep-1", "member-rep-2"],
};

export function canEditMicrosite(memberId: string, record: MicrositeRecord) {
  if (memberId === record.ownerId) {
    return true;
  }

  const member = MICROSITE_MEMBERS.find((item) => item.id === memberId);
  if (!member) {
    return false;
  }

  if (member.role === "owner") {
    return true;
  }

  if (member.role === "leader") {
    const downline = MICROSITE_DOWNLINES[memberId] ?? [];
    return downline.includes(record.ownerId) || record.ownerRole === "leader";
  }

  return false;
}
