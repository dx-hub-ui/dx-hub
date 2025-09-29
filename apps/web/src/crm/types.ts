export const CONTACT_STAGE_ORDER = [
  "prospecting",
  "discovery",
  "negotiation",
  "blocked",
  "won",
  "lost",
] as const;

export type ContactStage = (typeof CONTACT_STAGE_ORDER)[number];

export type ContactActivityType = "note" | "email" | "meeting" | "stage" | "created";

export interface ContactActivity {
  id: string;
  type: ContactActivityType;
  actor: string;
  timestamp: string;
  summaryKey: string;
  summaryValues?: Record<string, string>;
}

export interface ContactRecord {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: ContactStage;
  owner: string;
  assignedTo: string;
  orgId: string;
  lastInteraction: string;
  activities: ContactActivity[];
}

export const DEMO_ORG_ID = "demo-org";
