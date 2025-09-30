"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  DxBadge,
  DxButton,
  DxCard,
  DxTable,
  dxDashboardTokens,
  type DxTableColumn,
  type DxTableRow,
} from "@dx/ui";
import {
  DashboardFilterBar,
  type DashboardFilterOption,
  type DashboardRole,
  type DashboardRoleOption,
} from "@/components/dashboard";
import { WidgetPlaceholder, WidgetPlaceholderAction } from "@/components/dashboard";
import { useAppLayout } from "@/components/app-shell/AppShell";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  getActivityHeatmap,
  getCadenceEfficiency,
  getDataQualityInsights,
  getFunnelStages,
  getGoalsOverview,
  getHeadlineMetrics,
  getLeaderPerformance,
  getMicrositePerformance,
} from "@/dashboards/selectors";
import { useAttentionBoxStore } from "@/dashboards/attention-store";
import { CURRENT_OWNER_ID } from "@/dashboards/mock-data";
import { markdownToHtml } from "@/dashboards/markdown";
import { computeDelta, formatNumber, formatPercent, resolvePeriodRange } from "@/dashboards/utils";
import type { DashboardPeriodKey, DashboardScope } from "@/dashboards/types";
import type {
  CadenceEfficiencyRow,
  DataQualityInsight,
  FunnelStageMetric,
  GoalsOverview,
  HeadlineMetric,
  HeatmapData,
  LeaderPerformanceRow,
  MicrositePerformanceRow,
} from "@/dashboards/selectors";
import styles from "./DashboardPage.module.css";

const HEADLINE_KPIS = ["newLeads", "newContacts", "meetings", "whatsappResponse", "conversion"] as const;

const CURRENT_MEMBER = {
  id: CURRENT_OWNER_ID,
  name: "João Martins",
  role: "owner" as DashboardRole,
};

const GRID_COLUMN_CLASSNAMES = {
  "span-3": styles["span-3"],
  "span-4": styles["span-4"],
  "span-6": styles["span-6"],
  "span-8": styles["span-8"],
  "span-12": styles["span-12"],
};

type WidgetDefinition = {
  id: string;
  span: keyof typeof GRID_COLUMN_CLASSNAMES;
  title: string;
  description: string;
  caption?: string;
  variant?: "primary" | "ghost";
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export default function DashboardsPage() {
  const router = useRouter();
  const { setConfig } = useAppLayout();

  const dashboardDictionary = useTranslation("dashboard");
  const tDashboard = dashboardDictionary.t;
  const locale = dashboardDictionary.locale;

  const { t: tAttention } = useTranslation("attention");
  const { t: tKpis } = useTranslation("kpis");

  const [role, setRole] = useState<DashboardRole>(CURRENT_MEMBER.role);
  const [period, setPeriod] = useState<DashboardPeriodKey>("7d");
  const [funnelStage, setFunnelStage] = useState("all");
  const [scope, setScope] = useState<DashboardScope>("org");
  const now = useMemo(() => new Date(), []);

  const attentionStore = useAttentionBoxStore(CURRENT_MEMBER.id);
  const attentionBoxes = attentionStore.visibleBoxes;

  const navigationItems = useMemo(
    () => [
      { id: "dashboards", label: tDashboard("navigation.items.dashboards") },
      { id: "attention", label: tDashboard("navigation.items.attention") },
    ],
    [tDashboard],
  );

  const roleOptions = useMemo<DashboardRoleOption[]>(
    () => [
      { value: "owner", label: tDashboard("filters.roleOptions.owner") },
      { value: "leader", label: tDashboard("filters.roleOptions.leader") },
      { value: "rep", label: tDashboard("filters.roleOptions.rep") },
    ],
    [tDashboard],
  );

  const periodOptions = useMemo<DashboardFilterOption[]>(
    () => [
      { value: "today", label: tDashboard("filters.periodOptions.today") },
      { value: "7d", label: tDashboard("filters.periodOptions.7d") },
      { value: "30d", label: tDashboard("filters.periodOptions.30d") },
      { value: "currentMonth", label: tDashboard("filters.periodOptions.currentMonth") },
    ],
    [tDashboard],
  );

  const funnelOptions = useMemo<DashboardFilterOption[]>(
    () => [
      { value: "all", label: tDashboard("filters.funnelOptions.all") },
      { value: "lead", label: tDashboard("filters.funnelOptions.lead") },
      { value: "contact", label: tDashboard("filters.funnelOptions.contact") },
      { value: "meeting", label: tDashboard("filters.funnelOptions.meeting") },
      { value: "sale", label: tDashboard("filters.funnelOptions.sale") },
    ],
    [tDashboard],
  );

  const scopeOptionsByRole = useMemo<Record<DashboardRole, DashboardFilterOption[]>>(
    () => ({
      owner: [
        { value: "org", label: tDashboard("filters.scopeOptions.org") },
        { value: "team", label: tDashboard("filters.scopeOptions.team") },
        { value: "self", label: tDashboard("filters.scopeOptions.self") },
      ],
      leader: [
        { value: "team", label: tDashboard("filters.scopeOptions.team") },
        { value: "self", label: tDashboard("filters.scopeOptions.self") },
      ],
      rep: [{ value: "self", label: tDashboard("filters.scopeOptions.self") }],
    }),
    [tDashboard],
  );

  const scopeOptions = scopeOptionsByRole[role];
  const defaultScope = scopeOptions[0]?.value ?? scope;

  useEffect(() => {
    if (!scopeOptions.some((option) => option.value === scope)) {
      setScope(defaultScope);
    }
  }, [defaultScope, scope, scopeOptions]);

  const layoutRoleLabel = tDashboard(`filters.roleOptions.${role}` as const);
  const memberInitials = useMemo(() => getInitials(CURRENT_MEMBER.name), []);

  useEffect(() => {
    setConfig({
      sidebar: {
        activeItemId: "dashboards",
        sections: [{ id: "insights", label: tDashboard("navigation.section"), items: navigationItems }],
      },
      workspace: {
        title: tDashboard("workspace.title"),
        board: tDashboard("workspace.board"),
        profile: {
          name: CURRENT_MEMBER.name,
          role: layoutRoleLabel,
          initials: memberInitials,
          label: `${CURRENT_MEMBER.name} — ${layoutRoleLabel}`,
        },
      },
    });
  }, [layoutRoleLabel, memberInitials, navigationItems, setConfig, tDashboard]);

  const isOwnerView = role === "owner";

  const ownerMetrics = useMemo(() => {
    if (!isOwnerView) {
      return null;
    }

    return {
      headline: getHeadlineMetrics({ period, scope, memberId: CURRENT_MEMBER.id, now }),
      funnel: getFunnelStages({ period, scope, memberId: CURRENT_MEMBER.id, now }),
      heatmap: getActivityHeatmap({ period, scope, memberId: CURRENT_MEMBER.id, now }),
      leaders: getLeaderPerformance({ period, scope, memberId: CURRENT_MEMBER.id, now }),
      microsites: getMicrositePerformance({ scope, memberId: CURRENT_MEMBER.id }),
      cadences: getCadenceEfficiency({ scope, memberId: CURRENT_MEMBER.id }),
      goals: getGoalsOverview({ scope, memberId: CURRENT_MEMBER.id }),
      quality: getDataQualityInsights({ scope, memberId: CURRENT_MEMBER.id }),
    };
  }, [isOwnerView, now, period, scope]);

  const commonWidgets = useMemo<WidgetDefinition[]>(
    () => [
      {
        id: "tasks",
        span: "span-6",
        title: tDashboard("sections.tasks.title"),
        description: tDashboard("sections.tasks.description"),
        caption: tDashboard("placeholders.draft"),
      },
      {
        id: "events",
        span: "span-6",
        title: tDashboard("sections.common.events.title"),
        description: tDashboard("sections.common.events.description"),
        caption: tDashboard("placeholders.a11y"),
        variant: "ghost",
      },
    ],
    [tDashboard],
  );

  const widgetsByRole = useMemo<Record<Exclude<DashboardRole, "owner">, WidgetDefinition[]>>(
    () => ({
      leader: [
        {
          id: "leader-funnel",
          span: "span-6",
          title: tDashboard("sections.leader.funnel.title"),
          description: tDashboard("sections.leader.funnel.description"),
          caption: tKpis("leader.funnel"),
        },
        {
          id: "leader-load",
          span: "span-6",
          title: tDashboard("sections.leader.load.title"),
          description: tDashboard("sections.leader.load.description"),
          caption: tKpis("leader.load"),
        },
        {
          id: "leader-comparison",
          span: "span-12",
          title: tDashboard("sections.leader.comparison.title"),
          description: tDashboard("sections.leader.comparison.description"),
          caption: tKpis("leader.comparison"),
          variant: "ghost",
        },
      ],
      rep: [
        {
          id: "rep-goals",
          span: "span-6",
          title: tDashboard("sections.rep.goals.title"),
          description: tDashboard("sections.rep.goals.description"),
          caption: tKpis("rep.goals"),
        },
        {
          id: "rep-cadences",
          span: "span-6",
          title: tDashboard("sections.rep.cadences.title"),
          description: tDashboard("sections.rep.cadences.description"),
          caption: tKpis("rep.cadences"),
        },
        {
          id: "rep-whatsapp",
          span: "span-6",
          title: tDashboard("sections.rep.whatsapp.title"),
          description: tDashboard("sections.rep.whatsapp.description"),
          caption: tKpis("rep.whatsapp"),
        },
        {
          id: "rep-microsite",
          span: "span-6",
          title: tDashboard("sections.rep.microsite.title"),
          description: tDashboard("sections.rep.microsite.description"),
          caption: tKpis("rep.microsite"),
        },
        {
          id: "rep-events",
          span: "span-12",
          title: tDashboard("sections.rep.events.title"),
          description: tDashboard("sections.rep.events.description"),
          caption: tKpis("rep.events"),
          variant: "ghost",
        },
      ],
    }),
    [tDashboard, tKpis],
  );

  const placeholderWidgets = useMemo(() => {
    if (role === "owner") {
      return [];
    }
    const roleWidgets = role === "leader" ? widgetsByRole.leader : widgetsByRole.rep;
    return [...commonWidgets, ...roleWidgets];
  }, [commonWidgets, role, widgetsByRole]);

  const gridStyle = { columnGap: dxDashboardTokens.grid.columnGap, rowGap: dxDashboardTokens.grid.rowGap };
  const kpiGridStyle = { columnGap: dxDashboardTokens.grid.columnGap, rowGap: dxDashboardTokens.grid.rowGap };

  const periodRange = resolvePeriodRange(period, now);
  const periodLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" });
    const startLabel = formatter.format(periodRange.start);
    const endLabel = formatter.format(periodRange.end);
    return `${startLabel} – ${endLabel}`;
  }, [locale, periodRange.end, periodRange.start]);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <section className={styles.hero}>
          <header>
            <h1 className={styles.title}>{tDashboard("hero.title")}</h1>
            <p className={styles.description}>{tDashboard("hero.description")}</p>
            <p className={styles.roleHint}>{tDashboard("hero.roleHint")}</p>
          </header>
          <DashboardFilterBar
            sectionLabel={tDashboard("hero.title")}
            role={role}
            onRoleChange={setRole}
            roleOptions={roleOptions}
            period={period}
            onPeriodChange={(value) => setPeriod(value as DashboardPeriodKey)}
            periodOptions={periodOptions}
            scope={scope}
            onScopeChange={(value) => setScope(value as DashboardScope)}
            scopeOptions={scopeOptions}
            funnelStage={funnelStage}
            onFunnelStageChange={setFunnelStage}
            funnelOptions={funnelOptions}
            labels={{
              role: tDashboard("filters.role"),
              period: tDashboard("filters.period"),
              scope: tDashboard("filters.scope"),
              funnelStage: tDashboard("filters.funnelStage"),
            }}
          />
        </section>

        <section className={styles.attentionSection} aria-labelledby="attention-heading">
          <div className={styles.sectionHeader}>
            <h2 id="attention-heading" className={styles.sectionTitle}>
              {tDashboard("sections.attention.title")}
            </h2>
            <p className={styles.sectionDescription}>{tDashboard("sections.attention.description")}</p>
            <p className={styles.placeholdersNote}>{tAttention("live")}</p>
          </div>
          <div className={styles.attentionList} role="list" aria-live="polite">
            {attentionBoxes.length === 0 ? (
              <div role="listitem" className={styles.attentionCard}>
                <p className={styles.sectionDescription}>{tAttention("empty")}</p>
              </div>
            ) : (
              attentionBoxes.map((box) => {
                const html = markdownToHtml(box.bodyMd);
                const isPinned = box.pinned;
                const isRead = attentionStore.readBoxIds.has(box.id);
                return (
                  <article
                    key={box.id}
                    className={styles.attentionCard}
                    data-pinned={isPinned}
                    data-variant={box.variant}
                    data-read={isRead}
                    role="listitem"
                  >
                    <div>
                      {isPinned ? <span className={styles.placeholdersNote}>{tAttention("preview.pinned")}</span> : null}
                      <h3 className={styles.attentionHeading}>{box.title}</h3>
                      <div
                        className={styles.attentionBody}
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    </div>
                    <div className={styles.attentionMeta}>
                      <span>
                        {tAttention("meta.summary", {
                          values: {
                            label: tAttention("meta.audience"),
                            value: tAttention(`audiences.${box.audience}` as const),
                          },
                        })}
                      </span>
                      <span>
                        {tAttention("meta.summary", {
                          values: {
                            label: tAttention("meta.period"),
                            value: `${new Intl.DateTimeFormat(locale, {
                              day: "2-digit",
                              month: "short",
                            }).format(new Date(box.startAt))} – ${new Intl.DateTimeFormat(locale, {
                              day: "2-digit",
                              month: "short",
                            }).format(new Date(box.endAt))}`,
                          },
                        })}
                      </span>
                    </div>
                    <div className={styles.attentionActions}>
                      <DxButton
                        density="compact"
                        size="md"
                        variant="secondary"
                        onClick={() => attentionStore.markAsRead(box.id)}
                      >
                        {tAttention("actions.markAsRead")}
                      </DxButton>
                      {isOwnerView ? (
                        <DxButton
                          density="compact"
                          size="md"
                          variant="primary"
                          onClick={() => router.push("/dashboards/attention")}
                        >
                          {tAttention("actions.manage")}
                        </DxButton>
                      ) : null}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className={styles.headlineSection} aria-labelledby="headline-kpis">
          <div className={styles.sectionHeader}>
            <h2 id="headline-kpis" className={styles.sectionTitle}>
              {tDashboard("sections.headline.title")}
            </h2>
            <p className={styles.sectionDescription}>
              {tDashboard("sections.headline.description", { values: { period: periodLabel } })}
            </p>
          </div>
          <div className={styles.kpiGrid} style={kpiGridStyle}>
            {isOwnerView && ownerMetrics
              ? HEADLINE_KPIS.map((key) => {
                  const metric = ownerMetrics.headline.find((item) => item.id === key) as HeadlineMetric | undefined;
                  if (!metric) {
                    return null;
                  }

                  const label = tKpis(`headline.${key}` as const);
                  let detail: string | undefined;
                  if (metric.id === "whatsappResponse" && metric.numerator !== undefined) {
                    detail = tDashboard("metrics.samples.whatsappResponse", {
                      values: {
                        responded: formatNumber(metric.numerator, locale, { maximumFractionDigits: 0 }),
                        contacted: formatNumber(metric.denominator ?? 0, locale, { maximumFractionDigits: 0 }),
                      },
                    });
                  }
                  if (metric.id === "conversion" && metric.numerator !== undefined) {
                    detail = tDashboard("metrics.samples.conversion", {
                      values: {
                        converted: formatNumber(metric.numerator, locale, { maximumFractionDigits: 0 }),
                        leads: formatNumber(metric.denominator ?? 0, locale, { maximumFractionDigits: 0 }),
                      },
                    });
                  }

                  return (
                    <MetricCard
                      key={metric.id}
                      metric={metric}
                      label={label}
                      locale={locale}
                      deltaLabel={tDashboard("metrics.delta.label")}
                      newLabel={tDashboard("metrics.delta.new")}
                      detail={detail}
                    />
                  );
                })
              : HEADLINE_KPIS.map((key) => (
                  <WidgetPlaceholder
                    key={key}
                    title={tKpis(`headline.${key}` as const)}
                    description={tDashboard("placeholders.drilldown")}
                    metric="--"
                    metricDescription={tDashboard("placeholders.draft")}
                    variant="ghost"
                    ariaLive="polite"
                    className={styles.kpiCard}
                  />
                ))}
          </div>
        </section>

        {isOwnerView && ownerMetrics ? (
          <section className={styles.section} aria-labelledby="widgets-grid">
            <div className={styles.sectionHeader}>
              <h2 id="widgets-grid" className={styles.sectionTitle}>
                {tDashboard("sections.owner.funnel.title")}
              </h2>
              <p className={styles.sectionDescription}>{tDashboard("sections.owner.funnel.description")}</p>
            </div>
            <div className={styles.grid} style={gridStyle}>
              <div className={`${styles.funnelCard} ${styles["span-6"]}`}>
                <FunnelWidget
                  stages={ownerMetrics.funnel}
                  locale={locale}
                  t={tDashboard}
                  activeStage={funnelStage}
                />
              </div>
              <div className={`${styles.heatmapCard} ${styles["span-6"]}`}>
                <HeatmapWidget data={ownerMetrics.heatmap} locale={locale} t={tDashboard} />
              </div>
              <div className={`${styles.tableCard} ${styles["span-6"]}`}>
                <LeaderPerformanceWidget rows={ownerMetrics.leaders} locale={locale} t={tDashboard} />
              </div>
              <div className={`${styles.tableCard} ${styles["span-6"]}`}>
                <MicrositeWidget rows={ownerMetrics.microsites} locale={locale} t={tDashboard} />
              </div>
              <div className={`${styles.cadenceCard} ${styles["span-4"]}`}>
                <CadenceWidget rows={ownerMetrics.cadences} locale={locale} t={tDashboard} />
              </div>
              <div className={`${styles.qualityCard} ${styles["span-4"]}`}>
                <DataQualityWidget insight={ownerMetrics.quality} locale={locale} t={tDashboard} />
              </div>
              <div className={`${styles.goalsCard} ${styles["span-4"]}`}>
                <GoalsWidget data={ownerMetrics.goals} locale={locale} t={tDashboard} />
              </div>
            </div>
          </section>
        ) : null}

        {placeholderWidgets.length > 0 ? (
          <section className={styles.section} aria-labelledby="widgets-placeholder">
            <div className={styles.sectionHeader}>
              <h2 id="widgets-placeholder" className={styles.sectionTitle}>
                {tDashboard("placeholders.draft")}
              </h2>
              <p className={styles.sectionDescription}>{tDashboard("placeholders.a11y")}</p>
            </div>
            <div className={styles.grid} style={gridStyle}>
              {placeholderWidgets.map((widget) => (
                <WidgetPlaceholder
                  key={widget.id}
                  title={widget.title}
                  description={widget.description}
                  caption={widget.caption}
                  variant={widget.variant}
                  className={GRID_COLUMN_CLASSNAMES[widget.span]}
                  actions={
                    <WidgetPlaceholderAction>{tDashboard("placeholders.drilldown")}</WidgetPlaceholderAction>
                  }
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({
  metric,
  label,
  locale,
  deltaLabel,
  newLabel,
  detail,
}: {
  metric: HeadlineMetric;
  label: string;
  locale: string;
  deltaLabel: string;
  newLabel: string;
  detail?: string;
}) {
  const isPercentage = metric.type === "percentage";
  const formattedValue = isPercentage
    ? formatPercent(metric.value, locale, metric.id === "whatsappResponse" ? 0 : 1)
    : formatNumber(metric.value, locale, { maximumFractionDigits: 0 });

  const deltaValue = metric.previousValue === 0 && metric.value !== 0 ? null : computeDelta(metric.value, metric.previousValue);
  const deltaVariant = deltaValue === null ? "neutral" : deltaValue >= 0 ? "positive" : "negative";
  const deltaText =
    deltaValue === null
      ? newLabel
      : formatPercent(deltaValue, locale, Math.abs(deltaValue) < 0.1 ? 1 : 0);

  return (
    <DxCard className={styles.kpiCard} density="compact">
      <header className={styles.kpiHeader}>
        <span className={styles.kpiLabel}>{label}</span>
        <span className={styles.kpiValue} role="status" aria-live="polite">
          {formattedValue}
        </span>
      </header>
      <p className={`${styles.kpiDelta} ${styles[`kpiDelta-${deltaVariant}`]}`}>
        {deltaText} <span className={styles.kpiDeltaCaption}>{deltaLabel}</span>
      </p>
      {detail ? <p className={styles.kpiDetail}>{detail}</p> : null}
    </DxCard>
  );
}

function FunnelWidget({
  stages,
  locale,
  t,
  activeStage,
}: {
  stages: FunnelStageMetric[];
  locale: string;
  t: (key: string, options?: { values?: Record<string, unknown> }) => string;
  activeStage: string;
}) {
  return (
    <div>
      <header className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{t("sections.owner.funnel.title")}</h3>
        <p className={styles.sectionDescription}>{t("sections.owner.funnel.description")}</p>
      </header>
      <ul className={styles.funnelList}>
        {stages.map((stage) => {
          const formattedValue = formatNumber(stage.value, locale, { maximumFractionDigits: 0 });
          const delta = stage.previousValue === 0 && stage.value !== 0 ? null : computeDelta(stage.value, stage.previousValue);
          const deltaLabel =
            delta === null
              ? t("metrics.delta.new")
              : formatPercent(delta, locale, Math.abs(delta) < 0.1 ? 1 : 0);
          const conversion = stage.conversionFromPrevious ?? 0;
          const isActive = activeStage !== "all" && activeStage !== "visitors" && stage.id.includes(activeStage);
          return (
            <li key={stage.id} className={styles.funnelStage} data-active={isActive}>
              <div className={styles.funnelStageHeader}>
                <div>
                  <p className={styles.funnelStageLabel}>{t(`widgets.funnel.stages.${stage.id}`)}</p>
                  <p className={styles.funnelStageValue}>{formattedValue}</p>
                </div>
                <div className={styles.funnelStageMeta}>
                  <span>{deltaLabel}</span>
                  <span>
                    {t("widgets.funnel.conversion", {
                      values: { value: formatPercent(conversion || 0, locale, 0) },
                    })}
                  </span>
                </div>
              </div>
              <div className={styles.funnelProgressTrack}>
                <div className={styles.funnelProgressValue} style={{ width: `${Math.min(100, (conversion || 0) * 100)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HeatmapWidget({ data, locale, t }: { data: HeatmapData; locale: string; t: (key: string, options?: { values?: Record<string, unknown> }) => string }) {
  const dayFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short" }), [locale]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }), [locale]);

  return (
    <div>
      <header className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{t("sections.owner.heatmap.title")}</h3>
        <p className={styles.sectionDescription}>{t("sections.owner.heatmap.description")}</p>
      </header>
      <div className={styles.heatmapGrid} role="grid" aria-label={t("widgets.heatmap.ariaLabel") ?? "Heatmap"}>
        {data.days.map((dayIso, dayIndex) => {
          const date = new Date(dayIso);
          const dayLabel = dayFormatter.format(date);
          const dateLabel = dateFormatter.format(date);
          return (
            <div key={dayIso} className={styles.heatmapRow} role="row">
              <span className={styles.heatmapDayLabel}>{`${dayLabel} ${dateLabel}`}</span>
              <div className={styles.heatmapRowCells} role="presentation">
                {data.hours.map((hour) => {
                  const value = data.matrix[dayIndex]?.[hour] ?? 0;
                  const intensity = data.maxValue === 0 ? 0 : value / data.maxValue;
                  return (
                    <span
                      key={`${dayIso}-${hour}`}
                      role="gridcell"
                      aria-label={t("widgets.heatmap.cellLabel", {
                        values: {
                          day: `${dayLabel} ${dateLabel}`,
                          hour: `${hour.toString().padStart(2, "0")}:00`,
                          value: formatNumber(value, locale, { maximumFractionDigits: 0 }),
                        },
                      })}
                      className={styles.heatmapCell}
                      style={{ "--heatmap-intensity": intensity } as CSSProperties}
                      title={`${dayLabel} ${dateLabel} • ${hour.toString().padStart(2, "0")}:00`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.heatmapLegend}>
        <span>{t("widgets.heatmap.legend.low")}</span>
        <span aria-hidden className={styles.heatmapLegendScale} />
        <span>{t("widgets.heatmap.legend.high")}</span>
      </div>
    </div>
  );
}

function LeaderPerformanceWidget({ rows, locale, t }: { rows: LeaderPerformanceRow[]; locale: string; t: (key: string) => string }) {
  const columns: DxTableColumn[] = [
    { id: "leader", title: t("widgets.leaders.columns.leader"), accessor: "leader" },
    { id: "leads", title: t("widgets.leaders.columns.leads"), accessor: "leads" },
    { id: "response", title: t("widgets.leaders.columns.response"), accessor: "response" },
    { id: "meetings", title: t("widgets.leaders.columns.meetings"), accessor: "meetings" },
    { id: "conversion", title: t("widgets.leaders.columns.conversion"), accessor: "conversion" },
  ];

  const tableRows: DxTableRow[] = rows.map((row) => ({
    id: row.id,
    cells: {
      leader: row.name,
      leads: formatNumber(row.leads, locale, { maximumFractionDigits: 0 }),
      response: formatPercent(row.responseRate || 0, locale, 0),
      meetings: formatNumber(row.meetings, locale, { maximumFractionDigits: 0 }),
      conversion: formatPercent(row.conversion || 0, locale, 0),
    },
  }));

  return (
    <div>
      <header className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{t("sections.owner.leaders.title")}</h3>
        <p className={styles.sectionDescription}>{t("sections.owner.leaders.description")}</p>
      </header>
      <DxTable
        columns={columns}
        rows={tableRows}
        density="compact"
        size="sm"
        dataState={{ isLoading: false, isError: false }}
        emptyState={<p className={styles.tableMessage}>{t("widgets.leaders.empty")}</p>}
        errorState={
          <p role="alert" className={`${styles.tableMessage} ${styles.tableMessageError}`}>
            {t("widgets.leaders.error")}
          </p>
        }
      />
    </div>
  );
}

function MicrositeWidget({ rows, locale, t }: { rows: MicrositePerformanceRow[]; locale: string; t: (key: string) => string }) {
  const columns: DxTableColumn[] = [
    { id: "microsite", title: t("widgets.microsites.columns.microsite"), accessor: "microsite" },
    { id: "visits", title: t("widgets.microsites.columns.visits"), accessor: "visits" },
    { id: "leads", title: t("widgets.microsites.columns.leads"), accessor: "leads" },
    { id: "conversion", title: t("widgets.microsites.columns.conversion"), accessor: "conversion" },
    { id: "topRep", title: t("widgets.microsites.columns.topRep"), accessor: "topRep" },
  ];

  const tableRows: DxTableRow[] = rows.map((row) => ({
    id: row.id,
    cells: {
      microsite: row.title,
      visits: formatNumber(row.visits, locale, { maximumFractionDigits: 0 }),
      leads: formatNumber(row.leads, locale, { maximumFractionDigits: 0 }),
      conversion: formatPercent(row.conversion || 0, locale, 1),
      topRep: `${row.topRepName} • ${formatNumber(row.topRepLeads, locale, { maximumFractionDigits: 0 })}`,
    },
  }));

  return (
    <div>
      <header className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{t("sections.owner.microsites.title")}</h3>
        <p className={styles.sectionDescription}>{t("sections.owner.microsites.description")}</p>
      </header>
      <DxTable
        columns={columns}
        rows={tableRows}
        density="compact"
        size="sm"
        dataState={{ isLoading: false, isError: false }}
        emptyState={<p className={styles.tableMessage}>{t("widgets.microsites.empty")}</p>}
        errorState={
          <p role="alert" className={`${styles.tableMessage} ${styles.tableMessageError}`}>
            {t("widgets.microsites.error")}
          </p>
        }
      />
    </div>
  );
}

function CadenceWidget({ rows, locale, t }: { rows: CadenceEfficiencyRow[]; locale: string; t: (key: string) => string }) {
  return (
    <div>
      <header className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{t("sections.owner.cadence.title")}</h3>
        <p className={styles.sectionDescription}>{t("sections.owner.cadence.description")}</p>
      </header>
      <ul className={styles.cadenceList}>
        {rows.map((row) => (
          <li key={row.id} className={styles.cadenceItem}>
            <div className={styles.cadenceHeader}>
              <p className={styles.cadenceName}>{row.cadenceName}</p>
              <span>{t("widgets.cadence.dueSteps", { values: { value: formatNumber(row.dueSteps, locale, { maximumFractionDigits: 0 }) } })}</span>
            </div>
            <div className={styles.progressBar}>
              <span
                className={styles.progressValue}
                style={{ width: `${Math.min(100, row.completionRate * 100)}%` }}
              />
            </div>
            <div className={styles.cadenceMeta}>
              <DxBadge variant="primary" size="sm">
                {t("widgets.cadence.completion", {
                  values: { value: formatPercent(row.completionRate || 0, locale, 0) },
                })}
              </DxBadge>
              <DxBadge variant="danger" size="sm">
                {t("widgets.cadence.overdue", {
                  values: { value: formatPercent(row.overdueRate || 0, locale, 0) },
                })}
              </DxBadge>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GoalsWidget({ data, locale, t }: { data: GoalsOverview; locale: string; t: (key: string) => string }) {
  return (
    <div>
      <header className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{t("sections.owner.goals.title")}</h3>
        <p className={styles.sectionDescription}>{t("sections.owner.goals.description")}</p>
      </header>
      <div className={styles.goalsSummary}>
        <p className={styles.goalsHeadline}>{formatPercent(data.attainmentRate || 0, locale, 0)}</p>
        <p className={styles.sectionDescription}>
          {t("widgets.goals.onTrack", {
            values: {
              count: data.repsOnTrack,
              total: data.totalMembers,
            },
          })}
        </p>
      </div>
      <ul className={styles.leaderboardList}>
        {data.leaderboard.map((entry) => (
          <li key={entry.memberId} className={styles.leaderboardItem}>
            <div>
              <p className={styles.leaderboardName}>{entry.name}</p>
              <p className={styles.sectionDescription}>
                {t("widgets.goals.progress", {
                  values: {
                    contacts: formatPercent(entry.contactsProgress || 0, locale, 0),
                    meetings: formatPercent(entry.meetingsProgress || 0, locale, 0),
                    sales: formatPercent(entry.salesProgress || 0, locale, 0),
                  },
                })}
              </p>
            </div>
            <DxBadge variant="primary" size="sm">
              {formatPercent(entry.score || 0, locale, 0)}
            </DxBadge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DataQualityWidget({ insight, locale, t }: { insight: DataQualityInsight; locale: string; t: (key: string) => string }) {
  const totalLabel = formatNumber(insight.totalContacts, locale, { maximumFractionDigits: 0 });
  return (
    <div>
      <header className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{t("sections.owner.quality.title")}</h3>
        <p className={styles.sectionDescription}>{t("sections.owner.quality.description")}</p>
      </header>
      <div className={styles.qualityGrid}>
        <div>
          <p className={styles.qualityLabel}>{t("widgets.quality.total")}</p>
          <p className={styles.qualityValue}>{totalLabel}</p>
        </div>
        <div>
          <p className={styles.qualityLabel}>{t("widgets.quality.stale")}</p>
          <p className={styles.qualityValue}>{formatPercent(insight.stalePercentage || 0, locale, 0)}</p>
          <p className={styles.sectionDescription}>
            {t("widgets.quality.staleCount", {
              values: {
                count: formatNumber(insight.staleCount, locale, { maximumFractionDigits: 0 }),
              },
            })}
          </p>
        </div>
        <div>
          <p className={styles.qualityLabel}>{t("widgets.quality.critical")}</p>
          <p className={styles.qualityValue}>{formatPercent(insight.criticalPercentage || 0, locale, 0)}</p>
          <p className={styles.sectionDescription}>
            {t("widgets.quality.criticalCount", {
              values: {
                count: formatNumber(insight.criticalCount, locale, { maximumFractionDigits: 0 }),
              },
            })}
          </p>
        </div>
        <div>
          <p className={styles.qualityLabel}>{t("widgets.quality.duplicates")}</p>
          <p className={styles.qualityValue}>{formatPercent(insight.duplicatePercentage || 0, locale, 0)}</p>
          <p className={styles.sectionDescription}>
            {t("widgets.quality.duplicatesCount", {
              values: {
                count: formatNumber(insight.duplicates, locale, { maximumFractionDigits: 0 }),
              },
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
