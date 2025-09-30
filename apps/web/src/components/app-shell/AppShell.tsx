"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Avatar, Heading, Icon, Search, Text, type SubIcon } from "@vibe/core";
import {
  Apps as AppsIcon,
  Board as BoardIcon,
  Chart as ChartIcon,
  Dashboard as DashboardIcon,
  Integrations as IntegrationsIcon,
  Invite as InviteIcon,
  Notifications as NotificationsIcon,
} from "@vibe/icons";
import { useTranslation } from "@/i18n/I18nProvider";
import styles from "./AppShell.module.css";

type NavigationItem = {
  id: string;
  label: string;
};

type NavigationSection = {
  id: string;
  label: string;
  items: NavigationItem[];
};

type SidebarFooter = {
  title?: string;
  description?: string;
};

type SidebarConfig = {
  activeItemId?: string;
  sections: NavigationSection[];
  footer?: SidebarFooter;
};

type WorkspaceSearchConfig = {
  value: string;
  placeholder?: string;
  telemetryId?: string;
  onChange?: (value: string) => void;
};

type WorkspaceProfileConfig = {
  name: string;
  role?: string;
  label?: string;
  initials?: string;
};

type WorkspacePlanCta = {
  label: string;
  telemetryId?: string;
  icon?: SubIcon;
  onClick?: () => void;
};

type WorkspaceConfig = {
  appName?: string;
  appAcronym?: string;
  title?: string;
  board?: string;
  search?: WorkspaceSearchConfig;
  inviteLabel?: string;
  notificationsLabel?: string;
  notificationsIcon?: string;
  profile?: WorkspaceProfileConfig;
  planCta?: WorkspacePlanCta;
};

type AppLayoutConfig = {
  sidebar: SidebarConfig;
  workspace: WorkspaceConfig;
};

type AppLayoutContextValue = {
  config: AppLayoutConfig;
  setConfig: (patch: PartialAppLayoutConfig | ((prev: AppLayoutConfig) => PartialAppLayoutConfig)) => void;
};

type PartialAppLayoutConfig = Partial<{ sidebar: Partial<SidebarConfig>; workspace: Partial<WorkspaceConfig> }>;

const defaultLayout: AppLayoutConfig = {
  sidebar: {
    sections: [],
  },
  workspace: {},
};

const AppLayoutContext = createContext<AppLayoutContextValue | undefined>(undefined);
const fallbackContext: AppLayoutContextValue = {
  config: defaultLayout,
  setConfig: () => undefined,
};

type LayoutCSSProperties = CSSProperties & {
  "--dx-rail-width-expanded"?: string;
};

const NAVIGATION_ICONS: Record<string, SubIcon> = {
  overview: DashboardIcon,
  crm: BoardIcon,
  automations: IntegrationsIcon,
  dashboards: ChartIcon,
  marketing: AppsIcon,
};

export function AppShell({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<AppLayoutConfig>(defaultLayout);
  const [leftPaneState, setLeftPaneState] = useState<"collapsed" | "expanded">("expanded");
  const [railWidth, setRailWidth] = useState<number | null>(null);
  const { t: tCommon } = useTranslation("common");

  const setConfig = useCallback<AppLayoutContextValue["setConfig"]>((patch) => {
    setConfigState((previous) => {
      const resolvedPatch = typeof patch === "function" ? patch(previous) : patch;
      return mergeConfig(previous, resolvedPatch);
    });
  }, []);

  const contextValue = useMemo<AppLayoutContextValue>(() => ({ config, setConfig }), [config, setConfig]);

  const appName = config.workspace.appName ?? tCommon("appName");
  const appAcronym = useMemo(() => {
    if (config.workspace.appAcronym) {
      return config.workspace.appAcronym;
    }
    return appName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2);
  }, [appName, config.workspace.appAcronym]);
  const hasUtilityIcons = Boolean(config.workspace.inviteLabel || config.workspace.notificationsLabel);
  const workspaceDescriptor =
    config.workspace.profile?.label ??
    config.workspace.profile?.role ??
    tCommon("workspace") ??
    "Workspace";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isPinned = window.localStorage.getItem("first_level_control_is_pinned") !== "false";
    const storedWidth = Number.parseInt(window.localStorage.getItem("leftpane_current_width") ?? "", 10);

    setLeftPaneState(isPinned ? "expanded" : "collapsed");

    if (isPinned && Number.isFinite(storedWidth)) {
      setRailWidth(storedWidth);
    }
  }, []);

  const firstLevelStyle = useMemo<LayoutCSSProperties | undefined>(() => {
    if (!railWidth || railWidth <= 0) {
      return undefined;
    }
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention -- CSS custom property requires kebab case
      "--dx-rail-width-expanded": `${railWidth}px`,
    };
  }, [railWidth]);

  return (
    <AppLayoutContext.Provider value={contextValue}>
        <div
          id="application"
          className={`application new-layout ${styles.applicationRoot}`}
        style={{ background: "var(--dx-color-page-background)" }}
      >
        <div id="application-layers" className="application-layers">
          <div id="surface" className="surface">
            <div id="surface-control" className="surface-control" />
            <div id="surface-content" className="surface-content" />
          </div>

          <div
            id="first-level"
            className={`first-level layout_2025 ${styles.firstLevel}`}
            data-leftpane={leftPaneState}
            style={firstLevelStyle}
          >
            <nav
              id="first-level-control"
              className={`first-level-control ${styles.sidebar}`}
              tabIndex={-1}
              aria-label={tCommon("navigation") ?? "Navigation"}
            >
              <div className={styles.sidebarHeader}>
                <span>{workspaceDescriptor}</span>
              </div>
              <div className={styles.workspaceRow}>
                <button type="button" className={styles.workspaceSelect} aria-label={workspaceDescriptor}>
                  <span className={styles.workspaceBadge}>{appAcronym}</span>
                  <span className={styles.workspaceName}>{appName}</span>
                </button>
              </div>
              <div className={styles.sidebarContent}>
                {config.sidebar.sections.map((section) => {
                  const sectionLabelId = `${section.id}-nav-label`;
                  return (
                    <section
                      key={section.id}
                      className={styles.navSection}
                      aria-labelledby={sectionLabelId}
                    >
                      <Text
                        id={sectionLabelId}
                        type={Text.types.TEXT3}
                        weight={Text.weights.MEDIUM}
                        className={styles.sectionLabel}
                      >
                        {section.label}
                      </Text>
                      <div className={styles.navList}>
                        {section.items.map((item) => {
                          const isActive = item.id === config.sidebar.activeItemId;
                          const IconComponent = NAVIGATION_ICONS[item.id];
                        const buttonClassName = [
                          styles.navItemButton,
                          isActive ? styles.navItemButtonActive : undefined,
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={buttonClassName}
                            aria-pressed={isActive}
                          >
                            {IconComponent ? <Icon icon={IconComponent} aria-hidden iconSize={18} /> : null}
                            <span className={styles.navItemLabel}>{item.label}</span>
                          </button>
                        );
                      })}
                      </div>
                    </section>
                  );
                })}
              </div>
              {config.sidebar.footer ? (
                <footer className={styles.sidebarFooter}>
                  {config.sidebar.footer.title ? (
                    <p className={styles.sidebarFooterTitle}>{config.sidebar.footer.title}</p>
                  ) : null}
                  {config.sidebar.footer.description ? <p>{config.sidebar.footer.description}</p> : null}
                </footer>
              ) : null}
            </nav>

            <div className="transparent-wrapper">
              <div
                id="first-level-content-wrapper"
                className={`first-level-content-wrapper ${styles.contentWrapper}`}
              >
                <header
                  id="first-level-content-header"
                  className={`first-level-content-header ${styles.topbar}`}
                >
                  <div className={styles.topbarInner}>
                    <div className={styles.topbarLeft}>
                      <div className={styles.brand}>
                        <div className={styles.brandLogo} aria-hidden>
                          {appAcronym}
                        </div>
                        <div className={styles.brandText}>
                          <span className={styles.brandName}>{appName}</span>
                          <span className={styles.brandSub}>
                            {config.workspace.profile?.label ?? config.workspace.profile?.role ?? "CRM"}
                          </span>
                        </div>
                      </div>
                      <div className={styles.titleGroup} aria-live="polite">
                        {config.workspace.title ? (
                          <Heading
                            type={Heading.types.H3}
                            weight={Heading.weights.BOLD}
                            color={Heading.colors.PRIMARY}
                            className={styles.topbarTitle}
                          >
                            {config.workspace.title}
                          </Heading>
                        ) : null}
                        {config.workspace.board ? (
                          <Text type={Text.types.TEXT2} color={Text.colors.SECONDARY} className={styles.topbarSubtitle}>
                            {config.workspace.board}
                          </Text>
                        ) : null}
                      </div>
                      {config.workspace.planCta ? (
                        <button
                          type="button"
                          className={styles.pill}
                          onClick={config.workspace.planCta.onClick}
                          data-telemetry-id={config.workspace.planCta.telemetryId}
                        >
                          {config.workspace.planCta.icon ? (
                            <Icon icon={config.workspace.planCta.icon} aria-hidden iconSize={14} />
                          ) : null}
                          {config.workspace.planCta.label}
                        </button>
                      ) : null}
                    </div>
                    <div className={styles.topbarRight}>
                      {config.workspace.search ? (
                        <Search
                          value={config.workspace.search.value}
                          onChange={(value) => config.workspace.search?.onChange?.(value)}
                          placeholder={config.workspace.search.placeholder}
                          className={styles.search}
                          size="small"
                        />
                      ) : null}
                      <div className={styles.iconCluster}>
                        {config.workspace.inviteLabel ? (
                          <button
                            type="button"
                            className={styles.iconBtn}
                            aria-label={config.workspace.inviteLabel}
                            title={config.workspace.inviteLabel}
                          >
                            <Icon icon={InviteIcon} aria-hidden iconSize={18} />
                          </button>
                        ) : null}
                        {config.workspace.notificationsLabel ? (
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDot}`}
                            aria-label={config.workspace.notificationsLabel}
                            title={config.workspace.notificationsLabel}
                          >
                            <Icon icon={NotificationsIcon} aria-hidden iconSize={18} />
                          </button>
                        ) : null}
                        {hasUtilityIcons ? <span className={styles.divider} aria-hidden /> : null}
                        <div className={styles.iconBtn} aria-hidden>
                          <div className={`${styles.brandLogo} ${styles.brandLogoSmall}`}>{appAcronym}</div>
                        </div>
                        {config.workspace.profile ? (
                          <Avatar
                            text={config.workspace.profile.initials}
                            withoutTooltip
                            ariaLabel={config.workspace.profile.name}
                            className={styles.profileAvatar}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </header>

                <div id="board-view-ui-container" className={styles.boardViewContainer} />

                <main
                  id="first-level-content"
                  className={`first-level-content ${styles.main}`}
                  tabIndex={-1}
                  aria-label={tCommon("mainContent") ?? "Main content"}
                >
                  <div className={`scroller ${styles.scroller}`}>{children}</div>
                </main>

                <div id="thumbnail-container" />
                <div id="video-center-button-container" />
                <div id="monday-only-bug-button-container" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayoutContext.Provider>
  );
}

export function useAppLayout() {
  const context = useContext(AppLayoutContext);
  if (!context) {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console -- surfaced only during development to help with debugging
      console.warn("useAppLayout was called outside of an AppShell provider. Falling back to default layout context.");
    }
    return fallbackContext;
  }
  return context;
}

function mergeConfig(base: AppLayoutConfig, patch: PartialAppLayoutConfig): AppLayoutConfig {
  const nextSidebar = patch.sidebar
    ? (mergeBranch(base.sidebar, patch.sidebar) as SidebarConfig)
    : base.sidebar;
  const nextWorkspace = patch.workspace
    ? (mergeBranch(base.workspace, patch.workspace) as WorkspaceConfig)
    : base.workspace;

  const sidebarChanged = nextSidebar !== base.sidebar;
  const workspaceChanged = nextWorkspace !== base.workspace;

  if (!sidebarChanged && !workspaceChanged) {
    return base;
  }

  return {
    sidebar: sidebarChanged ? nextSidebar : base.sidebar,
    workspace: workspaceChanged ? nextWorkspace : base.workspace,
  };
}

function mergeBranch(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  let result: Record<string, unknown> | undefined;

  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    const baseValue = base[key];
    let nextValue = value;

    if (isPlainObject(baseValue) && isPlainObject(value)) {
      nextValue = mergeBranch(baseValue, value as Record<string, unknown>);
    }

    if (!Object.is(baseValue, nextValue)) {
      if (!result) {
        result = { ...base };
      }
      result[key] = nextValue;
    } else if (result) {
      result[key] = baseValue;
    }
  });

  return result ?? base;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
