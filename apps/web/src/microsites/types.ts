export type MicrositeRole = "owner" | "leader" | "rep";

export interface MicrositeMember {
  id: string;
  name: string;
  role: MicrositeRole;
  email: string;
}

export interface MicrositeRecord {
  id: string;
  orgId: string;
  ownerId: string;
  ownerName: string;
  ownerRole: MicrositeRole;
  slug: string;
  title: string;
  headline: string;
  description: string;
  status: "draft" | "published" | "archived";
  theme: "light" | "dark";
  lastPublishedAt: string | null;
  totalLeads: number;
  lastLeadAt: string | null;
  showContactPhone: boolean;
  enableCaptcha: boolean;
}

export interface MicrositeLead {
  id: string;
  micrositeId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  createdAt: string;
  assignedMemberId: string;
}

export interface MicrositeActivity {
  id: string;
  micrositeId: string;
  type: "published" | "unpublished" | "lead" | "updated";
  createdAt: string;
  actorId: string;
  actorName: string;
  summary: string;
}
