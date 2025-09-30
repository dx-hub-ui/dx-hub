export type DashboardPeriodKey = "today" | "7d" | "30d" | "currentMonth";
export type DashboardScope = "org" | "team" | "self";
export type DashboardMemberRole = "owner" | "leader" | "rep";

export interface DashboardMember {
  id: string;
  name: string;
  role: DashboardMemberRole;
  teamId: string;
  leaderId?: string;
}

export interface DashboardTeam {
  id: string;
  name: string;
  memberIds: string[];
  leaderId?: string;
}

export type LeadSource = "microsite" | "whatsapp" | "import" | "event";

export interface LeadRecord {
  id: string;
  createdAt: string;
  ownerId: string;
  teamId: string;
  source: LeadSource;
  contactedAt?: string;
  respondedAt?: string;
  contactId?: string;
}

export interface ContactRecord {
  id: string;
  leadId?: string;
  createdAt: string;
  ownerId: string;
  teamId: string;
  lastActivityAt: string;
}

export type MeetingStatus = "registered" | "completed" | "no_show";

export interface MeetingRecord {
  id: string;
  leadId?: string;
  scheduledAt: string;
  organizerId: string;
  teamId: string;
  status: MeetingStatus;
}

export interface SaleRecord {
  id: string;
  leadId?: string;
  closedAt: string;
  ownerId: string;
  teamId: string;
  amount: number;
}

export type ActivityType =
  | "lead_created"
  | "contact_created"
  | "meeting"
  | "whatsapp"
  | "cadence"
  | "microsite";

export interface ActivityRecord {
  id: string;
  timestamp: string;
  memberId: string;
  teamId: string;
  type: ActivityType;
}

export interface MicrositeSnapshot {
  id: string;
  slug: string;
  title: string;
  teamId: string;
  visits: number;
  leads: number;
  topRepId: string;
  topRepLeads: number;
  updatedAt: string;
}

export interface MicrositeVisitRecord {
  date: string;
  teamId: string;
  visits: number;
}

export interface CadenceAssignmentRecord {
  id: string;
  cadenceId: string;
  cadenceName: string;
  memberId: string;
  teamId: string;
  dueSteps: number;
  completedSteps: number;
  overdueSteps: number;
  periodStart: string;
  periodEnd: string;
}

export interface GoalProgressSnapshot {
  id: string;
  memberId: string;
  month: string;
  contactsTarget: number;
  contactsAchieved: number;
  meetingsTarget: number;
  meetingsAchieved: number;
  salesTarget: number;
  salesAchieved: number;
  lastUpdatedAt: string;
}

export interface ContactQualityRecord {
  contactId: string;
  memberId: string;
  teamId: string;
  daysSinceLastFollowup: number;
  hasDuplicate: boolean;
}

export interface AttentionBoxRecord {
  id: string;
  orgId: string;
  title: string;
  bodyMd: string;
  variant: "info" | "success" | "warning" | "danger";
  audience: "org" | "leaders" | "reps" | "custom";
  audienceMemberIds?: string[];
  startAt: string;
  endAt: string;
  pinned: boolean;
  createdByMemberId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttentionBoxReadRecord {
  attentionBoxId: string;
  memberId: string;
  readAt: string;
}
