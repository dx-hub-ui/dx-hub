import { CONTACT_STAGE_ORDER, DEMO_ORG_ID, type ContactRecord } from "./types";

const MOCK_REFERENCE_TIME = Date.UTC(2024, 3, 18, 15, 0, 0);
const HOUR_IN_MS = 1000 * 60 * 60;

function hoursAgo(hours: number) {
  return new Date(MOCK_REFERENCE_TIME - hours * HOUR_IN_MS).toISOString();
}

function daysAgo(days: number) {
  return hoursAgo(days * 24);
}

export const CRM_CONTACTS_SEED: ContactRecord[] = [
  {
    id: "contact-ana-souza",
    name: "Ana Souza",
    company: "Flow Logistics",
    email: "ana.souza@flowlog.com",
    phone: "+55 11 99888-1122",
    stage: "discovery",
    owner: "João Martins",
    assignedTo: "João Martins",
    orgId: DEMO_ORG_ID,
    lastInteraction: hoursAgo(5),
    activities: [
      {
        id: "activity-ana-created",
        type: "created",
        actor: "João Martins",
        timestamp: daysAgo(3),
        summaryKey: "timeline.events.created",
        summaryValues: { actor: "João Martins" },
      },
      {
        id: "activity-ana-discovery",
        type: "meeting",
        actor: "João Martins",
        timestamp: daysAgo(1),
        summaryKey: "timeline.events.discoveryCall",
        summaryValues: { actor: "João Martins" },
      },
      {
        id: "activity-ana-stage",
        type: "stage",
        actor: "João Martins",
        timestamp: hoursAgo(5),
        summaryKey: "timeline.events.stageChanged",
        summaryValues: { actor: "João Martins", stage: "discovery", from: "prospecting" },
      },
    ],
  },
  {
    id: "contact-marcelo-lima",
    name: "Marcelo Lima",
    company: "AgroNext",
    email: "marcelo.lima@agronext.com",
    phone: "+55 19 97777-3344",
    stage: "negotiation",
    owner: "Ana Prado",
    assignedTo: "Paula Ribeiro",
    orgId: DEMO_ORG_ID,
    lastInteraction: hoursAgo(12),
    activities: [
      {
        id: "activity-marcelo-created",
        type: "created",
        actor: "Ana Prado",
        timestamp: daysAgo(6),
        summaryKey: "timeline.events.created",
        summaryValues: { actor: "Ana Prado" },
      },
      {
        id: "activity-marcelo-email",
        type: "email",
        actor: "Paula Ribeiro",
        timestamp: daysAgo(1),
        summaryKey: "timeline.events.proposalSent",
        summaryValues: { actor: "Paula Ribeiro" },
      },
      {
        id: "activity-marcelo-stage",
        type: "stage",
        actor: "Paula Ribeiro",
        timestamp: hoursAgo(12),
        summaryKey: "timeline.events.stageChanged",
        summaryValues: { actor: "Paula Ribeiro", stage: "negotiation", from: "discovery" },
      },
    ],
  },
  {
    id: "contact-camila-freitas",
    name: "Camila Freitas",
    company: "InovaEdu",
    email: "camila.freitas@inovaedu.co",
    phone: "+55 21 96666-7788",
    stage: "won",
    owner: "Ana Prado",
    assignedTo: "Ana Prado",
    orgId: DEMO_ORG_ID,
    lastInteraction: daysAgo(2),
    activities: [
      {
        id: "activity-camila-created",
        type: "created",
        actor: "Ana Prado",
        timestamp: daysAgo(8),
        summaryKey: "timeline.events.created",
        summaryValues: { actor: "Ana Prado" },
      },
      {
        id: "activity-camila-demo",
        type: "meeting",
        actor: "Ana Prado",
        timestamp: daysAgo(4),
        summaryKey: "timeline.events.demoCompleted",
        summaryValues: { actor: "Ana Prado" },
      },
      {
        id: "activity-camila-stage",
        type: "stage",
        actor: "Ana Prado",
        timestamp: daysAgo(2),
        summaryKey: "timeline.events.stageChanged",
        summaryValues: { actor: "Ana Prado", stage: "won", from: "negotiation" },
      },
    ],
  },
  {
    id: "contact-leo-santos",
    name: "Léo Santos",
    company: "UrbanX",
    email: "leo.santos@urbanx.ai",
    phone: "+55 31 95555-6677",
    stage: "prospecting",
    owner: "João Martins",
    assignedTo: "Isabela Costa",
    orgId: DEMO_ORG_ID,
    lastInteraction: hoursAgo(8),
    activities: [
      {
        id: "activity-leo-created",
        type: "created",
        actor: "Isabela Costa",
        timestamp: daysAgo(2),
        summaryKey: "timeline.events.created",
        summaryValues: { actor: "Isabela Costa" },
      },
      {
        id: "activity-leo-note",
        type: "note",
        actor: "Isabela Costa",
        timestamp: hoursAgo(8),
        summaryKey: "timeline.events.qualifyNote",
        summaryValues: { actor: "Isabela Costa" },
      },
    ],
  },
  {
    id: "contact-helena-dias",
    name: "Helena Dias",
    company: "PulseHR",
    email: "helena.dias@pulsehr.com",
    phone: "+55 47 94444-8899",
    stage: "lost",
    owner: "João Martins",
    assignedTo: "João Martins",
    orgId: DEMO_ORG_ID,
    lastInteraction: daysAgo(14),
    activities: [
      {
        id: "activity-helena-created",
        type: "created",
        actor: "João Martins",
        timestamp: daysAgo(45),
        summaryKey: "timeline.events.created",
        summaryValues: { actor: "João Martins" },
      },
      {
        id: "activity-helena-stage",
        type: "stage",
        actor: "João Martins",
        timestamp: daysAgo(14),
        summaryKey: "timeline.events.stageChanged",
        summaryValues: { actor: "João Martins", stage: "lost", from: "negotiation" },
      },
    ],
  },
];

export const BOARD_COLUMN_ORDER = CONTACT_STAGE_ORDER;
