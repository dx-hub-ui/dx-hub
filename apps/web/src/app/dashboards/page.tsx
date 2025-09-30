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
import { useTranslation, type TranslateFn } from "@/i18n/I18nProvider";
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

/**
 * NOTE:
 * We intentionally avoid page-level wrappers that redefine width/padding/scroll.
 * The AppShell provides:
 *  - max content width (`--dx-layout-max-width`)
 *  - horizontal/vertical padding via `.scroller`
 *  - the single scroll container
 */

const HEADLINE_KPIS = ["newLeads", "newContacts", "meetings", "whatsappResponse", "conversion"] as const;

const CURRENT_MEMBER = {
  id: CURRENT_OWNER_ID,
  name: "João Martins",
  role: "owner" as DashboardRole,
};

type WidgetDefinition = {
  id: string;
  span: 3 | 4 | 6 | 8 | 12;
  title: string;
  description: string;
  caption?: string;
  variant?: "primary" | "ghost";
};

function toDashboardScope(value: string | undefined): DashboardScope | null {
  if (value === "org" || value === "team" || value === "self") return value;
  return null;
}

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
  const defaultScope = useMemo<DashboardScope>(() => toDashboardScope(scopeOptions[0]?.value) ?? scope, [scope, scopeOptions]);

  useEffect(() => {
    if (!scopeOptions.some((option) => option.value === scope)) setScope(defaultScope);
  }, [defaultScope, scope, scopeOptions]);

  const layoutRoleLabel = tDashboard(`filters.roleOptions.${role}` as const);
  const memberInitials = useMemo(() => getInitials(CURRENT_MEMBER.name), []);

  // Configure AppShell (title, board, profile, active nav item)
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
    if (!isOwnerView) return null;
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

  // Grid gaps derived from dxDashboardTokens (keeps visual rhythm with DX)
  const gridStyle = { columnGap: dxDashboardTokens.grid.columnGap, rowGap: dxDashboardTokens.grid.rowGap } as CSSProperties;
  const kpiGridStyle = { columnGap: dxDashboardTokens.grid.columnGap, rowGap: dxDashboardTokens.grid.rowGap } as CSSProperties;

  const periodRange = resolvePeriodRange(period, now);
  const periodLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" });
    const startLabel = formatter.format(periodRange.start);
    const endLabel = formatter.format(periodRange.end);
    return `${startLabel} – ${endLabel}`;
  }, [locale, periodRange.end, periodRange.start]);

  // Section styles using DX tokens
  const sectionStyle: CSSProperties = { display: "grid", gap: "var(--dx-space-5)" };
  const sectionHeaderStyle: CSSProperties = { display: "grid", gap: "var(--dx-space-2)" };
  const sectionTitleStyle: CSSProperties = { font: "var(--dx-font-h2)", letterSpacing: "var(--dx-ls-h2)", margin: 0 as unknown as number };
  const sectionDescStyle: CSSProperties = { color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number };
  const kpiGridClass: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    ...kpiGridStyle,
  };
  const gridClass: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
    ...gridStyle,
  };
  const span = (n: number): CSSProperties => ({ gridColumn: `span ${n} / span ${n}` });

  // Role-specific placeholders (leader/rep) defined last to keep memo small
  const commonWidgets = useMemo<WidgetDefinition[]>(
    () => [
      {
        id: "tasks",
        span: 6,
        title: tDashboard("sections.tasks.title"),
        description: tDashboard("sections.tasks.description"),
        caption: tDashboard("placeholders.draft"),
      },
      {
        id: "events",
        span: 6,
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
          span: 6,
          title: tDashboard("sections.leader.funnel.title"),
          description: tDashboard("sections.leader.funnel.description"),
          caption: tKpis("leader.funnel"),
        },
        {
          id: "leader-load",
          span: 6,
          title: tDashboard("sections.leader.load.title"),
          description: tDashboard("sections.leader.load.description"),
          caption: tKpis("leader.load"),
        },
        {
          id: "leader-comparison",
          span: 12,
          title: tDashboard("sections.leader.comparison.title"),
          description: tDashboard("sections.leader.comparison.description"),
          caption: tKpis("leader.comparison"),
          variant: "ghost",
        },
      ],
      rep: [
        {
          id: "rep-goals",
          span: 6,
          title: tDashboard("sections.rep.goals.title"),
          description: tDashboard("sections.rep.goals.description"),
          caption: tKpis("rep.goals"),
        },
        {
          id: "rep-cadences",
          span: 6,
          title: tDashboard("sections.rep.cadences.title"),
          description: tDashboard("sections.rep.cadences.description"),
          caption: tKpis("rep.cadences"),
        },
        {
          id: "rep-whatsapp",
          span: 6,
          title: tDashboard("sections.rep.whatsapp.title"),
          description: tDashboard("sections.rep.whatsapp.description"),
          caption: tKpis("rep.whatsapp"),
        },
        {
          id: "rep-microsite",
          span: 6,
          title: tDashboard("sections.rep.microsite.title"),
          description: tDashboard("sections.rep.microsite.description"),
          caption: tKpis("rep.microsite"),
        },
        {
          id: "rep-events",
          span: 12,
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
    if (role === "owner") return [];
    const roleWidgets = role === "leader" ? widgetsByRole.leader : widgetsByRole.rep;
    return [...commonWidgets, ...roleWidgets];
  }, [commonWidgets, role, widgetsByRole]);

  return (
    <>
      {/* HERO / FILTERS */}
      <section aria-labelledby="hero-title" style={sectionStyle}>
        <header style={sectionHeaderStyle}>
          <h1 id="hero-title" style={{ font: "var(--dx-font-h1)", letterSpacing: "var(--dx-ls-h1)", margin: 0 as unknown as number }}>
            {tDashboard("hero.title")}
          </h1>
          <p style={sectionDescStyle}>{tDashboard("hero.description")}</p>
          <p style={{ ...sectionDescStyle, font: "var(--dx-font-body-strong)" }}>{tDashboard("hero.roleHint")}</p>
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

      {/* ATTENTION */}
      <section aria-labelledby="attention-heading" style={sectionStyle}>
        <header style={sectionHeaderStyle}>
          <h2 id="attention-heading" style={sectionTitleStyle}>{tDashboard("sections.attention.title")}</h2>
          <p style={sectionDescStyle}>{tDashboard("sections.attention.description")}</p>
          <p style={{ ...sectionDescStyle, font: "var(--dx-font-body-strong)" }}>{tAttention("live")}</p>
        </header>

        <div role="list" aria-live="polite" style={{ display: "grid", gap: "var(--dx-space-4)" }}>
          {attentionBoxes.length === 0 ? (
            <div role="listitem">
              <DxCard density="compact">
                <p style={sectionDescStyle}>{tAttention("empty")}</p>
              </DxCard>
            </div>
          ) : (
            attentionBoxes.map((box) => {
              const html = markdownToHtml(box.bodyMd);
              const isPinned = box.pinned;
              const isRead = attentionStore.readBoxIds.has(box.id);
              return (
                <div role="listitem" key={box.id}>
                  <DxCard density="compact" data-pinned={isPinned} data-read={isRead}>
                    <div style={{ display: "grid", gap: "var(--dx-space-3)" }}>
                      <div>
                        {isPinned ? (
                          <span style={{ font: "var(--dx-font-body-strong)", color: "var(--dx-color-text-secondary)" }}>
                            {tAttention("preview.pinned")}
                          </span>
                        ) : null}
                        <h3 style={{ font: "var(--dx-font-h3)", margin: 0 as unknown as number }}>{box.title}</h3>
                        <div dangerouslySetInnerHTML={{ __html: html }} />
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dx-space-4)", color: "var(--dx-color-text-secondary)" }}>
                        <span>
                          {tAttention("meta.summary", {
                            values: { label: tAttention("meta.audience"), value: tAttention(`audiences.${box.audience}` as const) },
                          })}
                        </span>
                        <span>
                          {tAttention("meta.summary", {
                            values: {
                              label: tAttention("meta.period"),
                              value: `${new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(box.startAt))} – ${new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(box.endAt))}`,
                            },
                          })}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "var(--dx-space-2)" }}>
                        <DxButton density="compact" size="md" variant="secondary" onClick={() => attentionStore.markAsRead(box.id)}>
                          {tAttention("actions.markAsRead")}
                        </DxButton>
                        {isOwnerView ? (
                          <DxButton density="compact" size="md" variant="primary" onClick={() => router.push("/dashboards/attention")}>
                            {tAttention("actions.manage")}
                          </DxButton>
                        ) : null}
                      </div>
                    </div>
                  </DxCard>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* HEADLINE KPIs */}
      <section aria-labelledby="headline-kpis" style={sectionStyle}>
        <header style={sectionHeaderStyle}>
          <h2 id="headline-kpis" style={sectionTitleStyle}>{tDashboard("sections.headline.title")}</h2>
          <p style={sectionDescStyle}>
            {tDashboard("sections.headline.description", { values: { period: periodLabel } })}
          </p>
        </header>

        <div style={kpiGridClass}>
          {isOwnerView && ownerMetrics
            ? HEADLINE_KPIS.map((key) => {
                const metric = ownerMetrics.headline.find((item) => item.id === key) as HeadlineMetric | undefined;
                if (!metric) return null;

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
                />
              ))}
        </div>
      </section>

      {/* OWNER WIDGETS */}
      {isOwnerView && ownerMetrics ? (
        <section aria-labelledby="widgets-grid" style={sectionStyle}>
          <header style={sectionHeaderStyle}>
            <h2 id="widgets-grid" style={sectionTitleStyle}>{tDashboard("sections.owner.funnel.title")}</h2>
            <p style={sectionDescStyle}>{tDashboard("sections.owner.funnel.description")}</p>
          </header>

          <div style={gridClass}>
            <DxCard style={span(6)} density="compact">
              <FunnelWidget stages={ownerMetrics.funnel} locale={locale} t={tDashboard} activeStage={funnelStage} />
            </DxCard>

            <DxCard style={span(6)} density="compact">
              <HeatmapWidget data={ownerMetrics.heatmap} locale={locale} t={tDashboard} />
            </DxCard>

            <DxCard style={span(6)} density="compact">
              <LeaderPerformanceWidget rows={ownerMetrics.leaders} locale={locale} t={tDashboard} />
            </DxCard>

            <DxCard style={span(6)} density="compact">
              <MicrositeWidget rows={ownerMetrics.microsites} locale={locale} t={tDashboard} />
            </DxCard>

            <DxCard style={span(4)} density="compact">
              <CadenceWidget rows={ownerMetrics.cadences} locale={locale} t={tDashboard} />
            </DxCard>

            <DxCard style={span(4)} density="compact">
              <DataQualityWidget insight={ownerMetrics.quality} locale={locale} t={tDashboard} />
            </DxCard>

            <DxCard style={span(4)} density="compact">
              <GoalsWidget data={ownerMetrics.goals} locale={locale} t={tDashboard} />
            </DxCard>
          </div>
        </section>
      ) : null}

      {/* PLACEHOLDERS (Leader/Rep) */}
      {placeholderWidgets.length > 0 ? (
        <section aria-labelledby="widgets-placeholder" style={sectionStyle}>
          <header style={sectionHeaderStyle}>
            <h2 id="widgets-placeholder" style={sectionTitleStyle}>{tDashboard("placeholders.draft")}</h2>
            <p style={sectionDescStyle}>{tDashboard("placeholders.a11y")}</p>
          </header>

      <div style={gridClass}>
+          {placeholderWidgets.map((widget) => (
+            <div key={widget.id} style={span(widget.span)}>
+              <WidgetPlaceholder
+                title={widget.title}
+                description={widget.description}
+                caption={widget.caption}
+                variant={widget.variant}
+                actions={<WidgetPlaceholderAction>{tDashboard("placeholders.drilldown")}</WidgetPlaceholderAction>}
+              />
+            </div>
+          ))}
+        </div>
        </section>
      ) : null}
    </>
  );
}

/* === Local, presentation-only building blocks =========================== */

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
    deltaValue === null ? newLabel : formatPercent(deltaValue, locale, Math.abs(deltaValue) < 0.1 ? 1 : 0);

  const deltaColor =
    deltaVariant === "positive"
      ? "var(--positive-color)"
      : deltaVariant === "negative"
      ? "var(--negative-color)"
      : "var(--dx-color-text-secondary)";

  return (
    <DxCard density="compact">
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--dx-space-3)" }}>
        <span style={{ color: "var(--dx-color-text-secondary)" }}>{label}</span>
        <span role="status" aria-live="polite" style={{ font: "var(--dx-font-h3)" }}>
          {formattedValue}
        </span>
      </header>

      <p style={{ color: deltaColor, margin: "var(--dx-space-2) 0" }}>
        {deltaText}{" "}
        <span style={{ color: "var(--dx-color-text-secondary)" }}>{deltaLabel}</span>
      </p>

      {detail ? <p style={{ color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number }}>{detail}</p> : null}
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
  t: TranslateFn;
  activeStage: string;
}) {
  return (
    <div style={{ display: "grid", gap: "var(--dx-space-4)" }}>
      <header style={{ display: "grid", gap: "var(--dx-space-1)" }}>
        <h3 style={{ font: "var(--dx-font-h3)", margin: 0 as unknown as number }}>{t("sections.owner.funnel.title")}</h3>
        <p style={{ color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number }}>{t("sections.owner.funnel.description")}</p>
      </header>

      <ul style={{ display: "grid", gap: "var(--dx-space-3)", listStyle: "none", margin: 0, padding: 0 }}>
        {stages.map((stage) => {
          const formattedValue = formatNumber(stage.value, locale, { maximumFractionDigits: 0 });
          const delta = stage.previousValue === 0 && stage.value !== 0 ? null : computeDelta(stage.value, stage.previousValue);
          const deltaLabel =
            delta === null ? t("metrics.delta.new") : formatPercent(delta, locale, Math.abs(delta) < 0.1 ? 1 : 0);
          const conversion = stage.conversionFromPrevious ?? 0;
          const isActive = activeStage !== "all" && activeStage !== "visitors" && stage.id.includes(activeStage);

          return (
            <li key={stage.id} data-active={isActive}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--dx-space-4)" }}>
                <div>
                  <p style={{ margin: 0 as unknown as number }}>{t(`widgets.funnel.stages.${stage.id}`)}</p>
                  <p style={{ font: "var(--dx-font-h4)", margin: 0 as unknown as number }}>{formattedValue}</p>
                </div>
                <div style={{ display: "flex", gap: "var(--dx-space-4)", color: "var(--dx-color-text-secondary)" }}>
                  <span>{deltaLabel}</span>
                  <span>
                    {t("widgets.funnel.conversion", {
                      values: { value: formatPercent(conversion || 0, locale, 0) },
                    })}
                  </span>
                </div>
              </div>
              <div style={{ height: 8, background: "var(--primary-highlighted-color)", borderRadius: 9999, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (conversion || 0) * 100)}%`, height: "100%", background: "var(--primary-color)" }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HeatmapWidget({ data, locale, t }: { data: HeatmapData; locale: string; t: TranslateFn }) {
  const dayFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short" }), [locale]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }), [locale]);

  return (
    <div style={{ display: "grid", gap: "var(--dx-space-4)" }}>
      <header style={{ display: "grid", gap: "var(--dx-space-1)" }}>
        <h3 style={{ font: "var(--dx-font-h3)", margin: 0 as unknown as number }}>{t("sections.owner.heatmap.title")}</h3>
        <p style={{ color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number }}>{t("sections.owner.heatmap.description")}</p>
      </header>

      <div role="grid" aria-label={t("widgets.heatmap.ariaLabel") ?? "Heatmap"} style={{ display: "grid", gap: "var(--dx-space-2)" }}>
        {data.days.map((dayIso, dayIndex) => {
          const date = new Date(dayIso);
          const dayLabel = dayFormatter.format(date);
          const dateLabel = dateFormatter.format(date);
          return (
            <div key={dayIso} role="row" style={{ display: "grid", gridTemplateColumns: "120px 1fr", alignItems: "center", gap: "var(--dx-space-3)" }}>
              <span style={{ color: "var(--dx-color-text-secondary)" }}>{`${dayLabel} ${dateLabel}`}</span>
              <div role="presentation" style={{ display: "grid", gridTemplateColumns: "repeat(24, 1fr)", gap: 2 }}>
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
                      title={`${dayLabel} ${dateLabel} • ${hour.toString().padStart(2, "0")}:00`}
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        borderRadius: 4,
                        background: `rgba(0, 127, 155, ${Math.max(0.08, intensity * 0.9)})`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--dx-space-3)" }}>
        <span>{t("widgets.heatmap.legend.low")}</span>
        <span aria-hidden style={{ flex: 1, height: 6, background: "linear-gradient(90deg, rgba(0,127,155,0.12), rgba(0,127,155,0.9))", borderRadius: 9999 }} />
        <span>{t("widgets.heatmap.legend.high")}</span>
      </div>
    </div>
  );
}

function LeaderPerformanceWidget({ rows, locale, t }: { rows: LeaderPerformanceRow[]; locale: string; t: TranslateFn }) {
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
    <div style={{ display: "grid", gap: "var(--dx-space-4)" }}>
      <header style={{ display: "grid", gap: "var(--dx-space-1)" }}>
        <h3 style={{ font: "var(--dx-font-h3)", margin: 0 as unknown as number }}>{t("sections.owner.leaders.title")}</h3>
        <p style={{ color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number }}>{t("sections.owner.leaders.description")}</p>
      </header>
      <DxTable
        columns={columns}
        rows={tableRows}
        density="compact"
        size="sm"
        dataState={{ isLoading: false, isError: false }}
        emptyState={<p style={{ color: "var(--dx-color-text-secondary)" }}>{t("widgets.leaders.empty")}</p>}
        errorState={
          <p role="alert" style={{ color: "var(--negative-color)" }}>
            {t("widgets.leaders.error")}
          </p>
        }
      />
    </div>
  );
}

function MicrositeWidget({ rows, locale, t }: { rows: MicrositePerformanceRow[]; locale: string; t: TranslateFn }) {
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
    <div style={{ display: "grid", gap: "var(--dx-space-4)" }}>
      <header style={{ display: "grid", gap: "var(--dx-space-1)" }}>
        <h3 style={{ font: "var(--dx-font-h3)", margin: 0 as unknown as number }}>{t("sections.owner.microsites.title")}</h3>
        <p style={{ color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number }}>{t("sections.owner.microsites.description")}</p>
      </header>
      <DxTable
        columns={columns}
        rows={tableRows}
        density="compact"
        size="sm"
        dataState={{ isLoading: false, isError: false }}
        emptyState={<p style={{ color: "var(--dx-color-text-secondary)" }}>{t("widgets.microsites.empty")}</p>}
        errorState={
          <p role="alert" style={{ color: "var(--negative-color)" }}>
            {t("widgets.microsites.error")}
          </p>
        }
      />
    </div>
  );
}

function CadenceWidget({ rows, locale, t }: { rows: CadenceEfficiencyRow[]; locale: string; t: TranslateFn }) {
  return (
    <div style={{ display: "grid", gap: "var(--dx-space-4)" }}>
      <header style={{ display: "grid", gap: "var(--dx-space-1)" }}>
        <h3 style={{ font: "var(--dx-font-h3)", margin: 0 as unknown as number }}>{t("sections.owner.cadence.title")}</h3>
        <p style={{ color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number }}>{t("sections.owner.cadence.description")}</p>
      </header>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "var(--dx-space-3)" }}>
        {rows.map((row) => (
          <li key={row.id} style={{ display: "grid", gap: "var(--dx-space-2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <p style={{ margin: 0 as unknown as number, font: "var(--dx-font-body-strong)" }}>{row.cadenceName}</p>
              <span style={{ color: "var(--dx-color-text-secondary)" }}>
                {t("widgets.cadence.dueSteps", { values: { value: formatNumber(row.dueSteps, locale, { maximumFractionDigits: 0 }) } })}
              </span>
            </div>

            <div style={{ height: 8, background: "var(--primary-highlighted-color)", borderRadius: 9999 }}>
              <span
                style={{
                  display: "block",
                  width: `${Math.min(100, row.completionRate * 100)}%`,
                  height: "100%",
                  borderRadius: 9999,
                  background: "var(--primary-color)",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "var(--dx-space-2)" }}>
              <DxBadge variant="primary" size="sm">
                {t("widgets.cadence.completion", { values: { value: formatPercent(row.completionRate || 0, locale, 0) } })}
              </DxBadge>
              <DxBadge variant="danger" size="sm">
                {t("widgets.cadence.overdue", { values: { value: formatPercent(row.overdueRate || 0, locale, 0) } })}
              </DxBadge>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GoalsWidget({ data, locale, t }: { data: GoalsOverview; locale: string; t: TranslateFn }) {
  return (
    <div style={{ display: "grid", gap: "var(--dx-space-4)" }}>
      <header style={{ display: "grid", gap: "var(--dx-space-1)" }}>
        <h3 style={{ font: "var(--dx-font-h3)", margin: 0 as unknown as number }}>{t("sections.owner.goals.title")}</h3>
        <p style={{ color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number }}>{t("sections.owner.goals.description")}</p>
      </header>

      <div>
        <p style={{ font: "var(--dx-font-h2)", margin: 0 as unknown as number }}>{formatPercent(data.attainmentRate || 0, locale, 0)}</p>
        <p style={{ color: "var(--dx-color-text-secondary)", margin: "var(--dx-space-1) 0 0" }}>
          {t("widgets.goals.onTrack", { values: { count: data.repsOnTrack, total: data.totalMembers } })}
        </p>
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "var(--dx-space-2)" }}>
        {data.leaderboard.map((entry) => (
          <li key={entry.memberId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0 as unknown as number, font: "var(--dx-font-body-strong)" }}>{entry.name}</p>
              <p style={{ color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number }}>
                {t("widgets.goals.progress", {
                  values: {
                    contacts: formatPercent(entry.contactsProgress || 0, locale, 0),
                    meetings: formatPercent(entry.meetingsProgress || 0, locale, 0),
                    sales: formatPercent(entry.salesProgress || 0, locale, 0),
                  },
                })}
              </p>
            </div>
            <DxBadge variant="primary" size="sm">{formatPercent(entry.score || 0, locale, 0)}</DxBadge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DataQualityWidget({ insight, locale, t }: { insight: DataQualityInsight; locale: string; t: TranslateFn }) {
  const totalLabel = formatNumber(insight.totalContacts, locale, { maximumFractionDigits: 0 });
  return (
    <div style={{ display: "grid", gap: "var(--dx-space-4)" }}>
      <header style={{ display: "grid", gap: "var(--dx-space-1)" }}>
        <h3 style={{ font: "var(--dx-font-h3)", margin: 0 as unknown as number }}>{t("sections.owner.quality.title")}</h3>
        <p style={{ color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number }}>{t("sections.owner.quality.description")}</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "var(--dx-space-4)" }}>
        <div>
          <p style={{ color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number }}>{t("widgets.quality.total")}</p>
          <p style={{ font: "var(--dx-font-h4)", margin: 0 as unknown as number }}>{totalLabel}</p>
        </div>
        <div>
          <p style={{ color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number }}>{t("widgets.quality.stale")}</p>
          <p style={{ font: "var(--dx-font-h4)", margin: 0 as unknown as number }}>{formatPercent(insight.stalePercentage || 0, locale, 0)}</p>
          <p style={{ color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number }}>
            {t("widgets.quality.staleCount", { values: { count: formatNumber(insight.staleCount, locale, { maximumFractionDigits: 0 }) } })}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number }}>{t("widgets.quality.critical")}</p>
          <p style={{ font: "var(--dx-font-h4)", margin: 0 as unknown as number }}>{formatPercent(insight.criticalPercentage || 0, locale, 0)}</p>
          <p style={{ color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number }}>
            {t("widgets.quality.criticalCount", { values: { count: formatNumber(insight.criticalCount, locale, { maximumFractionDigits: 0 }) } })}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number }}>{t("widgets.quality.duplicates")}</p>
          <p style={{ font: "var(--dx-font-h4)", margin: 0 as unknown as number }}>{formatPercent(insight.duplicatePercentage || 0, locale, 0)}</p>
          <p style={{ color: "var(--dx-color-text-secondary)", margin: 0 as unknown as number }}>
            {t("widgets.quality.duplicatesCount", { values: { count: formatNumber(insight.duplicates, locale, { maximumFractionDigits: 0 }) } })}
          </p>
        </div>
      </div>
    </div>
  );
}
