import {
  ACTIVITIES,
  CADENCE_ASSIGNMENTS,
  CONTACTS,
  CONTACT_QUALITY,
  DASHBOARD_MEMBERS,
  DASHBOARD_TEAMS,
  GOAL_SNAPSHOTS,
  LEADS,
  MEETINGS,
  MICROSITES,
  MICROSITE_VISITS_DAILY,
  SALES,
} from "./mock-data";
import {
  differenceInHours,
  getComparisonRange,
  isWithinRange,
  parseDate,
  resolvePeriodRange,
  safeDivide,
  startOfDay,
  endOfDay,
} from "./utils";
import type { DashboardMemberRole, DashboardPeriodKey, DashboardScope } from "./types";

const MEMBERS_BY_ID = new Map(DASHBOARD_MEMBERS.map((member) => [member.id, member]));

function resolveScopeMembers(scope: DashboardScope, memberId: string) {
  if (scope === "org") {
    return null;
  }

  if (scope === "self") {
    return new Set([memberId]);
  }

  const team = DASHBOARD_TEAMS.find((item) => item.memberIds.includes(memberId));
  if (!team) {
    return new Set([memberId]);
  }

  return new Set(team.memberIds);
}

function filterByMembers<T>(records: T[], members: Set<string> | null, accessor: (record: T) => string) {
  if (!members) {
    return records;
  }
  return records.filter((record) => members.has(accessor(record)));
}

function getDownline(memberId: string, cache = new Map<string, Set<string>>()) {
  if (cache.has(memberId)) {
    return cache.get(memberId)!;
  }

  const set = new Set<string>([memberId]);
  DASHBOARD_MEMBERS.forEach((member) => {
    if (member.leaderId === memberId) {
      const branch = getDownline(member.id, cache);
      branch.forEach((id) => set.add(id));
    }
  });

  cache.set(memberId, set);
  return set;
}

function getMemberRole(memberId: string): DashboardMemberRole | undefined {
  return MEMBERS_BY_ID.get(memberId)?.role;
}

function aggregateVisitors(range: { start: Date; end: Date }, scopeMembers: Set<string> | null) {
  const visitsByTeam = new Map<string, number>();
  MICROSITE_VISITS_DAILY.forEach((record) => {
    if (isWithinRange(record.date, range)) {
      visitsByTeam.set(record.teamId, (visitsByTeam.get(record.teamId) ?? 0) + record.visits);
    }
  });

  if (!scopeMembers) {
    let total = 0;
    visitsByTeam.forEach((value) => {
      total += value;
    });
    return total;
  }

  if (scopeMembers.size === 1) {
    const [memberId] = Array.from(scopeMembers);
    const member = MEMBERS_BY_ID.get(memberId);
    if (!member) {
      return 0;
    }

    const teamTotal = visitsByTeam.get(member.teamId) ?? 0;
    const teamLeads = LEADS.filter((lead) => lead.teamId === member.teamId && isWithinRange(lead.createdAt, range));
    const memberLeads = teamLeads.filter((lead) => lead.ownerId === memberId);
    const share = safeDivide(memberLeads.length, teamLeads.length);
    return Math.round(teamTotal * share);
  }

  const teamIds = new Set<string>();
  scopeMembers.forEach((memberId) => {
    const member = MEMBERS_BY_ID.get(memberId);
    if (member) {
      teamIds.add(member.teamId);
    }
  });

  let total = 0;
  teamIds.forEach((teamId) => {
    total += visitsByTeam.get(teamId) ?? 0;
  });
  return total;
}

export interface HeadlineMetric {
  id: "newLeads" | "newContacts" | "meetings" | "whatsappResponse" | "conversion";
  value: number;
  previousValue: number;
  type: "count" | "percentage";
  numerator?: number;
  denominator?: number;
}

export function getHeadlineMetrics({
  period,
  scope,
  memberId,
  now = new Date(),
}: {
  period: DashboardPeriodKey;
  scope: DashboardScope;
  memberId: string;
  now?: Date;
}): HeadlineMetric[] {
  const range = resolvePeriodRange(period, now);
  const comparisonRange = getComparisonRange(range);
  const scopeMembers = resolveScopeMembers(scope, memberId);

  const scopedLeads = filterByMembers(LEADS, scopeMembers, (lead) => lead.ownerId);
  const scopedContacts = filterByMembers(CONTACTS, scopeMembers, (contact) => contact.ownerId);
  const scopedMeetings = filterByMembers(MEETINGS, scopeMembers, (meeting) => meeting.organizerId);

  const leadsInRange = scopedLeads.filter((lead) => isWithinRange(lead.createdAt, range));
  const leadsPrevious = scopedLeads.filter((lead) => isWithinRange(lead.createdAt, comparisonRange));

  const contactsInRange = scopedContacts.filter((contact) => isWithinRange(contact.createdAt, range));
  const contactsPrevious = scopedContacts.filter((contact) => isWithinRange(contact.createdAt, comparisonRange));

  const meetingsInRange = scopedMeetings.filter(
    (meeting) => meeting.status !== "no_show" && isWithinRange(meeting.scheduledAt, range),
  );
  const meetingsPrevious = scopedMeetings.filter(
    (meeting) => meeting.status !== "no_show" && isWithinRange(meeting.scheduledAt, comparisonRange),
  );

  const leadsContactedCurrent = scopedLeads.filter(
    (lead) => lead.contactedAt && isWithinRange(lead.contactedAt, range),
  );
  const leadsContactedPrevious = scopedLeads.filter(
    (lead) => lead.contactedAt && isWithinRange(lead.contactedAt, comparisonRange),
  );

  const respondedCurrent = leadsContactedCurrent.filter((lead) => {
    if (!lead.respondedAt || !lead.contactedAt) {
      return false;
    }
    return differenceInHours(lead.respondedAt, lead.contactedAt) <= 24;
  });
  const respondedPrevious = leadsContactedPrevious.filter((lead) => {
    if (!lead.respondedAt || !lead.contactedAt) {
      return false;
    }
    return differenceInHours(lead.respondedAt, lead.contactedAt) <= 24;
  });

  const leadsIdsInRange = new Set(leadsInRange.map((lead) => lead.id));
  const leadsIdsPrevious = new Set(leadsPrevious.map((lead) => lead.id));

  const convertedCurrent = contactsInRange.filter((contact) => contact.leadId && leadsIdsInRange.has(contact.leadId));
  const convertedPrevious = contactsPrevious.filter(
    (contact) => contact.leadId && leadsIdsPrevious.has(contact.leadId),
  );

  const responseRateCurrent = safeDivide(respondedCurrent.length, leadsContactedCurrent.length);
  const responseRatePrevious = safeDivide(respondedPrevious.length, leadsContactedPrevious.length);
  const conversionCurrent = safeDivide(convertedCurrent.length, leadsInRange.length);
  const conversionPrevious = safeDivide(convertedPrevious.length, leadsPrevious.length);

  return [
    {
      id: "newLeads",
      value: leadsInRange.length,
      previousValue: leadsPrevious.length,
      type: "count",
    },
    {
      id: "newContacts",
      value: contactsInRange.length,
      previousValue: contactsPrevious.length,
      type: "count",
    },
    {
      id: "meetings",
      value: meetingsInRange.length,
      previousValue: meetingsPrevious.length,
      type: "count",
    },
    {
      id: "whatsappResponse",
      value: responseRateCurrent,
      previousValue: responseRatePrevious,
      type: "percentage",
      numerator: respondedCurrent.length,
      denominator: leadsContactedCurrent.length,
    },
    {
      id: "conversion",
      value: conversionCurrent,
      previousValue: conversionPrevious,
      type: "percentage",
      numerator: convertedCurrent.length,
      denominator: leadsInRange.length,
    },
  ];
}

export interface FunnelStageMetric {
  id: "visitors" | "leads" | "contacts" | "meetings" | "sales";
  value: number;
  previousValue: number;
  conversionFromPrevious?: number;
}

export function getFunnelStages({
  period,
  scope,
  memberId,
  now = new Date(),
}: {
  period: DashboardPeriodKey;
  scope: DashboardScope;
  memberId: string;
  now?: Date;
}): FunnelStageMetric[] {
  const range = resolvePeriodRange(period, now);
  const comparisonRange = getComparisonRange(range);
  const scopeMembers = resolveScopeMembers(scope, memberId);

  const visitorCurrent = aggregateVisitors(range, scopeMembers);
  const visitorPrevious = aggregateVisitors(comparisonRange, scopeMembers);

  const scopedLeads = filterByMembers(LEADS, scopeMembers, (lead) => lead.ownerId);
  const scopedContacts = filterByMembers(CONTACTS, scopeMembers, (contact) => contact.ownerId);
  const scopedMeetings = filterByMembers(MEETINGS, scopeMembers, (meeting) => meeting.organizerId);
  const scopedSales = filterByMembers(SALES, scopeMembers, (sale) => sale.ownerId);

  const leadsCurrent = scopedLeads.filter((lead) => isWithinRange(lead.createdAt, range));
  const leadsPrevious = scopedLeads.filter((lead) => isWithinRange(lead.createdAt, comparisonRange));

  const contactsCurrent = scopedContacts.filter((contact) => isWithinRange(contact.createdAt, range));
  const contactsPrevious = scopedContacts.filter((contact) => isWithinRange(contact.createdAt, comparisonRange));

  const meetingsCurrent = scopedMeetings.filter((meeting) => isWithinRange(meeting.scheduledAt, range));
  const meetingsPrevious = scopedMeetings.filter((meeting) => isWithinRange(meeting.scheduledAt, comparisonRange));

  const salesCurrent = scopedSales.filter((sale) => isWithinRange(sale.closedAt, range));
  const salesPrevious = scopedSales.filter((sale) => isWithinRange(sale.closedAt, comparisonRange));

  const metrics: FunnelStageMetric[] = [
    { id: "visitors", value: visitorCurrent, previousValue: visitorPrevious },
    { id: "leads", value: leadsCurrent.length, previousValue: leadsPrevious.length },
    { id: "contacts", value: contactsCurrent.length, previousValue: contactsPrevious.length },
    { id: "meetings", value: meetingsCurrent.length, previousValue: meetingsPrevious.length },
    { id: "sales", value: salesCurrent.length, previousValue: salesPrevious.length },
  ];

  metrics.forEach((stage, index) => {
    if (index === 0) {
      stage.conversionFromPrevious = 1;
      return;
    }
    const previousStage = metrics[index - 1];
    stage.conversionFromPrevious = safeDivide(stage.value, previousStage.value);
  });

  return metrics;
}

export interface HeatmapData {
  days: string[];
  hours: number[];
  matrix: number[][];
  maxValue: number;
}

export function getActivityHeatmap({
  period,
  scope,
  memberId,
  now = new Date(),
}: {
  period: DashboardPeriodKey;
  scope: DashboardScope;
  memberId: string;
  now?: Date;
}): HeatmapData {
  const range = resolvePeriodRange(period, now);
  const end = endOfDay(range.end);
  const start = startOfDay(new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000));
  const scopeMembers = resolveScopeMembers(scope, memberId);

  const days: Date[] = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    days.push(day);
  }

  const hours = Array.from({ length: 24 }, (_, index) => index);
  const matrix = days.map(() => Array(24).fill(0));

  const scopedActivities = filterByMembers(ACTIVITIES, scopeMembers, (activity) => activity.memberId).filter((activity) =>
    isWithinRange(activity.timestamp, { start, end }),
  );

  const startMidnight = startOfDay(days[0]);

  scopedActivities.forEach((activity) => {
    const date = parseDate(activity.timestamp);
    const dayDiff = Math.floor((startOfDay(date).getTime() - startMidnight.getTime()) / (24 * 60 * 60 * 1000));
    const hour = date.getHours();
    if (dayDiff >= 0 && dayDiff < matrix.length && hour >= 0 && hour < 24) {
      matrix[dayDiff][hour] += 1;
    }
  });

  const maxValue = matrix.reduce((max, row) => Math.max(max, ...row), 0);

  return {
    days: days.map((day) => day.toISOString()),
    hours,
    matrix,
    maxValue,
  };
}

export interface LeaderPerformanceRow {
  id: string;
  name: string;
  role: DashboardMemberRole;
  leads: number;
  responseRate: number;
  meetings: number;
  conversion: number;
}

export function getLeaderPerformance({
  period,
  scope,
  memberId,
  now = new Date(),
}: {
  period: DashboardPeriodKey;
  scope: DashboardScope;
  memberId: string;
  now?: Date;
}): LeaderPerformanceRow[] {
  const range = resolvePeriodRange(period, now);
  const scopeMembers = resolveScopeMembers(scope, memberId);
  const downlineCache = new Map<string, Set<string>>();

  const leaders = DASHBOARD_MEMBERS.filter((member) => member.role !== "rep");
  const rows: LeaderPerformanceRow[] = [];

  leaders.forEach((leader) => {
    const downline = getDownline(leader.id, downlineCache);
    if (scopeMembers) {
      const intersects = Array.from(downline).some((id) => scopeMembers.has(id));
      if (!intersects) {
        return;
      }
    }

    const leadsDownline = LEADS.filter(
      (lead) => downline.has(lead.ownerId) && isWithinRange(lead.createdAt, range),
    );

    const contactsDownline = CONTACTS.filter(
      (contact) => contact.ownerId && downline.has(contact.ownerId) && isWithinRange(contact.createdAt, range),
    );

    const meetingsDownline = MEETINGS.filter(
      (meeting) => downline.has(meeting.organizerId) && isWithinRange(meeting.scheduledAt, range),
    );

    const contacted = leadsDownline.filter((lead) => lead.contactedAt && isWithinRange(lead.contactedAt, range));
    const responded = contacted.filter((lead) => {
      if (!lead.respondedAt || !lead.contactedAt) {
        return false;
      }
      return differenceInHours(lead.respondedAt, lead.contactedAt) <= 24;
    });

    const leadsIds = new Set(leadsDownline.map((lead) => lead.id));
    const converted = contactsDownline.filter((contact) => contact.leadId && leadsIds.has(contact.leadId));

    rows.push({
      id: leader.id,
      name: leader.name,
      role: leader.role,
      leads: leadsDownline.length,
      responseRate: safeDivide(responded.length, contacted.length),
      meetings: meetingsDownline.filter((meeting) => meeting.status !== "no_show").length,
      conversion: safeDivide(converted.length, leadsDownline.length),
    });
  });

  return rows
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 10);
}

export interface MicrositePerformanceRow {
  id: string;
  slug: string;
  title: string;
  teamId: string;
  visits: number;
  leads: number;
  conversion: number;
  topRepId: string;
  topRepName: string;
  topRepLeads: number;
}

export function getMicrositePerformance({
  scope,
  memberId,
}: {
  scope: DashboardScope;
  memberId: string;
}): MicrositePerformanceRow[] {
  const scopeMembers = resolveScopeMembers(scope, memberId);
  const teamIds = new Set<string>();
  if (scopeMembers) {
    scopeMembers.forEach((id) => {
      const member = MEMBERS_BY_ID.get(id);
      if (member) {
        teamIds.add(member.teamId);
      }
    });
  }

  const rows = MICROSITES.filter((record) => {
    if (!scopeMembers) {
      return true;
    }

    if (scopeMembers.size === 1) {
      const [targetMember] = Array.from(scopeMembers);
      return record.topRepId === targetMember;
    }

    return teamIds.has(record.teamId);
  }).map((record) => {
    const topRepName = MEMBERS_BY_ID.get(record.topRepId)?.name ?? "";
    return {
      id: record.id,
      slug: record.slug,
      title: record.title,
      teamId: record.teamId,
      visits: record.visits,
      leads: record.leads,
      conversion: safeDivide(record.leads, record.visits),
      topRepId: record.topRepId,
      topRepName,
      topRepLeads: record.topRepLeads,
    };
  });

  return rows.sort((a, b) => b.visits - a.visits).slice(0, 6);
}

export interface CadenceEfficiencyRow {
  id: string;
  cadenceId: string;
  cadenceName: string;
  dueSteps: number;
  completedSteps: number;
  overdueSteps: number;
  completionRate: number;
  overdueRate: number;
}

export function getCadenceEfficiency({
  scope,
  memberId,
}: {
  scope: DashboardScope;
  memberId: string;
}): CadenceEfficiencyRow[] {
  const scopeMembers = resolveScopeMembers(scope, memberId);
  const assignments = filterByMembers(CADENCE_ASSIGNMENTS, scopeMembers, (assignment) => assignment.memberId);

  const grouped = new Map<string, CadenceEfficiencyRow>();
  assignments.forEach((assignment) => {
    const current = grouped.get(assignment.cadenceId) ?? {
      id: assignment.cadenceId,
      cadenceId: assignment.cadenceId,
      cadenceName: assignment.cadenceName,
      dueSteps: 0,
      completedSteps: 0,
      overdueSteps: 0,
      completionRate: 0,
      overdueRate: 0,
    };

    current.dueSteps += assignment.dueSteps;
    current.completedSteps += assignment.completedSteps;
    current.overdueSteps += assignment.overdueSteps;
    grouped.set(assignment.cadenceId, current);
  });

  grouped.forEach((value, key) => {
    value.completionRate = safeDivide(value.completedSteps, value.dueSteps);
    value.overdueRate = safeDivide(value.overdueSteps, value.dueSteps);
    grouped.set(key, value);
  });

  return Array.from(grouped.values()).sort((a, b) => b.completionRate - a.completionRate);
}

export interface GoalsOverview {
  totalMembers: number;
  repsOnTrack: number;
  attainmentRate: number;
  leaderboard: {
    memberId: string;
    name: string;
    role: DashboardMemberRole;
    contactsProgress: number;
    meetingsProgress: number;
    salesProgress: number;
    score: number;
  }[];
}

export function getGoalsOverview({
  scope,
  memberId,
}: {
  scope: DashboardScope;
  memberId: string;
}): GoalsOverview {
  const scopeMembers = resolveScopeMembers(scope, memberId);
  const snapshots = filterByMembers(GOAL_SNAPSHOTS, scopeMembers, (snapshot) => snapshot.memberId);

  const repSnapshots = snapshots.filter((snapshot) => getMemberRole(snapshot.memberId) === "rep");
  const totalMembers = repSnapshots.length;

  let repsOnTrack = 0;
  const leaderboard = repSnapshots
    .map((snapshot) => {
      const contactsProgress = safeDivide(snapshot.contactsAchieved, snapshot.contactsTarget);
      const meetingsProgress = safeDivide(snapshot.meetingsAchieved, snapshot.meetingsTarget);
      const salesProgress = safeDivide(snapshot.salesAchieved, snapshot.salesTarget);
      const score = (contactsProgress + meetingsProgress + salesProgress) / 3;
      const onTrack = contactsProgress >= 1 && meetingsProgress >= 1 && salesProgress >= 1;
      if (onTrack) {
        repsOnTrack += 1;
      }
      return {
        memberId: snapshot.memberId,
        name: MEMBERS_BY_ID.get(snapshot.memberId)?.name ?? snapshot.memberId,
        role: getMemberRole(snapshot.memberId) ?? "rep",
        contactsProgress,
        meetingsProgress,
        salesProgress,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const attainmentRate = safeDivide(repsOnTrack, totalMembers);

  return {
    totalMembers,
    repsOnTrack,
    attainmentRate,
    leaderboard,
  };
}

export interface DataQualityInsight {
  totalContacts: number;
  staleCount: number;
  criticalCount: number;
  duplicates: number;
  stalePercentage: number;
  criticalPercentage: number;
  duplicatePercentage: number;
}

const STALE_THRESHOLD = 7;
const CRITICAL_THRESHOLD = 14;

export function getDataQualityInsights({
  scope,
  memberId,
}: {
  scope: DashboardScope;
  memberId: string;
}): DataQualityInsight {
  const scopeMembers = resolveScopeMembers(scope, memberId);
  const records = filterByMembers(CONTACT_QUALITY, scopeMembers, (record) => record.memberId);
  const totalContacts = records.length;

  const staleCount = records.filter((record) => record.daysSinceLastFollowup > STALE_THRESHOLD).length;
  const criticalCount = records.filter((record) => record.daysSinceLastFollowup > CRITICAL_THRESHOLD).length;
  const duplicates = records.filter((record) => record.hasDuplicate).length;

  return {
    totalContacts,
    staleCount,
    criticalCount,
    duplicates,
    stalePercentage: safeDivide(staleCount, totalContacts),
    criticalPercentage: safeDivide(criticalCount, totalContacts),
    duplicatePercentage: safeDivide(duplicates, totalContacts),
  };
}
