"use client";

import { useEffect, useMemo, useState } from "react";
import { DxButton, dxDashboardTokens } from "@dx/ui";
import {
  DashboardFilterBar,
  type DashboardFilterOption,
  type DashboardRole,
  type DashboardRoleOption,
} from "@/components/dashboard";
import { WidgetPlaceholder, WidgetPlaceholderAction } from "@/components/dashboard";
import { useAppLayout } from "@/components/app-shell/AppShell";
import { useTranslation } from "@/i18n/I18nProvider";
import styles from "./DashboardPage.module.css";

const HEADLINE_KPIS = ["newLeads", "newContacts", "meetings", "whatsappResponse", "conversion"] as const;

const MOCK_ATTENTION_BOXES = [
  {
    id: "pinned-1",
    pinned: true,
    title: "Checklist de cadências para o Quarter Kickoff",
    body: "Revise os fluxos automáticos e valide as mensagens de WhatsApp antes de sexta-feira.",
    audience: "leaders" as const,
    period: "05/09 – 12/09",
  },
  {
    id: "info-1",
    pinned: false,
    title: "Nova meta de conversão lead→contato",
    body: "A meta mínima sobe para 35% em setembro. Use o drill-down para identificar gargalos.",
    audience: "org" as const,
    period: "01/09 – 30/09",
  },
];

const CURRENT_MEMBER = {
  name: "João Martins",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

type WidgetDefinition = {
  id: string;
  span: keyof typeof GRID_COLUMN_CLASSNAMES;
  title: string;
  description: string;
  caption?: string;
  variant?: "primary" | "ghost";
};

const GRID_COLUMN_CLASSNAMES = {
  "span-3": styles["span-3"],
  "span-4": styles["span-4"],
  "span-6": styles["span-6"],
  "span-8": styles["span-8"],
  "span-12": styles["span-12"],
};

export default function DashboardsPage() {
  const { setConfig } = useAppLayout();
  const { t: tDashboard } = useTranslation("dashboard");
  const { t: tAttention } = useTranslation("attention");
  const { t: tKpis } = useTranslation("kpis");

  const [role, setRole] = useState<DashboardRole>("owner");
  const [period, setPeriod] = useState("7d");
  const [funnelStage, setFunnelStage] = useState("all");
  const [scope, setScope] = useState("org");

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

  const widgetsByRole = useMemo<Record<DashboardRole, WidgetDefinition[]>>(
    () => ({
      owner: [
        {
          id: "funnel",
          span: "span-6",
          title: tDashboard("sections.owner.funnel.title"),
          description: tDashboard("sections.owner.funnel.description"),
          caption: tKpis("owner.funnel"),
        },
        {
          id: "heatmap",
          span: "span-6",
          title: tDashboard("sections.owner.heatmap.title"),
          description: tDashboard("sections.owner.heatmap.description"),
          caption: tKpis("owner.heatmap"),
        },
        {
          id: "leaders",
          span: "span-6",
          title: tDashboard("sections.owner.leaders.title"),
          description: tDashboard("sections.owner.leaders.description"),
          caption: tKpis("owner.leaders"),
        },
        {
          id: "microsites",
          span: "span-6",
          title: tDashboard("sections.owner.microsites.title"),
          description: tDashboard("sections.owner.microsites.description"),
          caption: tKpis("owner.microsites"),
        },
        {
          id: "cadence",
          span: "span-4",
          title: tDashboard("sections.owner.cadence.title"),
          description: tDashboard("sections.owner.cadence.description"),
          caption: tKpis("owner.cadence"),
        },
        {
          id: "quality",
          span: "span-4",
          title: tDashboard("sections.owner.quality.title"),
          description: tDashboard("sections.owner.quality.description"),
          caption: tKpis("owner.quality"),
          variant: "ghost",
        },
        {
          id: "goals",
          span: "span-4",
          title: tDashboard("sections.owner.goals.title"),
          description: tDashboard("sections.owner.goals.description"),
          caption: tKpis("owner.goals"),
        },
      ],
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

  const activeWidgets = useMemo(
    () => [...commonWidgets, ...widgetsByRole[role]],
    [commonWidgets, widgetsByRole, role],
  );

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

  const attentionBoxes = MOCK_ATTENTION_BOXES;
  const isOwnerView = role === "owner";
  const gridStyle = { columnGap: dxDashboardTokens.grid.columnGap, rowGap: dxDashboardTokens.grid.rowGap };
  const kpiGridStyle = { columnGap: dxDashboardTokens.grid.columnGap, rowGap: dxDashboardTokens.grid.rowGap };

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
            onRoleChange={(value) => setRole(value)}
            roleOptions={roleOptions}
            period={period}
            onPeriodChange={setPeriod}
            periodOptions={periodOptions}
            scope={scope}
            onScopeChange={setScope}
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
              attentionBoxes.map((box) => (
                <article key={box.id} className={styles.attentionCard} data-pinned={box.pinned} role="listitem">
                  <div>
                    {box.pinned ? <span className={styles.placeholdersNote}>{tAttention("preview.pinned")}</span> : null}
                    <h3 className={styles.attentionHeading}>{box.title}</h3>
                    <p className={styles.description}>{box.body}</p>
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
                          value: box.period,
                        },
                      })}
                    </span>
                  </div>
                  <div className={styles.attentionActions}>
                    <DxButton density="compact" size="md" variant="secondary">
                      {tAttention("actions.markAsRead")}
                    </DxButton>
                    {isOwnerView ? (
                      <DxButton density="compact" size="md" variant="primary">
                        {tAttention("actions.manage")}
                      </DxButton>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className={styles.headlineSection} aria-labelledby="headline-kpis">
          <div className={styles.sectionHeader}>
            <h2 id="headline-kpis" className={styles.sectionTitle}>
              {tDashboard("sections.headline.title")}
            </h2>
            <p className={styles.sectionDescription}>{tDashboard("sections.headline.description")}</p>
          </div>
          <div className={styles.kpiGrid} style={kpiGridStyle}>
            {HEADLINE_KPIS.map((key) => (
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

        <section className={styles.section} aria-labelledby="widgets-grid">
          <div className={styles.sectionHeader}>
            <h2 id="widgets-grid" className={styles.sectionTitle}>
              {tDashboard("placeholders.draft")}
            </h2>
            <p className={styles.sectionDescription}>{tDashboard("placeholders.a11y")}</p>
          </div>
          <div className={styles.grid} style={gridStyle}>
            {activeWidgets.map((widget) => (
              <WidgetPlaceholder
                key={widget.id}
                title={widget.title}
                description={widget.description}
                caption={widget.caption}
                variant={widget.variant}
                className={GRID_COLUMN_CLASSNAMES[widget.span]}
                actions={
                  <WidgetPlaceholderAction>
                    {tDashboard("placeholders.drilldown")}
                  </WidgetPlaceholderAction>
                }
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
