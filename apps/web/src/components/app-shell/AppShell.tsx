"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DxButton } from "@dx/ui";
import {
  Avatar,
  Flex,
  Heading,
  Icon,
  IconButton,
  Search,
  Text,
  type SubIcon,
} from "@vibe/core";
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

const NAVIGATION_ICONS: Record<string, SubIcon> = {
  overview: DashboardIcon,
  crm: BoardIcon,
  automations: IntegrationsIcon,
  dashboards: ChartIcon,
  marketing: AppsIcon,
};

function mergeConfig(base: AppLayoutConfig, patch: PartialAppLayoutConfig): AppLayoutConfig {
  const result: AppLayoutConfig = {
    sidebar: { ...base.sidebar },
    workspace: { ...base.workspace },
  };

  if (patch.sidebar) {
    result.sidebar = mergeObject(base.sidebar, patch.sidebar) as SidebarConfig;
  }

  if (patch.workspace) {
    result.workspace = mergeObject(base.workspace, patch.workspace) as WorkspaceConfig;
  }

  return result;
}

function mergeObject(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    const baseValue = base[key];
    if (isPlainObject(baseValue) && isPlainObject(value)) {
      result[key] = mergeObject(baseValue, value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  });
  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function AppShell({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<AppLayoutConfig>(defaultLayout);
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

  return (
    <AppLayoutContext.Provider value={contextValue}>
      <div className={styles.root}>
        <aside className={styles.sidebar} aria-label={tCommon("navigation") ?? "Navigation"}>
          {config.sidebar.sections.map((section) => (
            <div key={section.id} className={styles.sidebarHeader}>
              <Text type={Text.types.TEXT2} weight={Text.weights.MEDIUM} className={styles.sidebarTitle} aria-hidden>
                {section.label}
              </Text>
              <nav className={styles.navList} aria-label={section.label}>
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
              </nav>
            </div>
          ))}
          {config.sidebar.footer ? (
            <div className={styles.sidebarFooter}>
              {config.sidebar.footer.title ? (
                <p className={styles.sidebarFooterTitle}>{config.sidebar.footer.title}</p>
              ) : null}
              {config.sidebar.footer.description ? <p>{config.sidebar.footer.description}</p> : null}
            </div>
          ) : null}
        </aside>
        <div className={styles.layout}>
          <header className={styles.topbar}>
            <Flex align={Flex.align.CENTER} gap={Flex.gaps.MEDIUM} className={styles.topbarInfo} aria-live="polite">
              <div className={styles.appBadge}>{appAcronym}</div>
              <div className={styles.topbarTitles}>
                {config.workspace.title ? (
                  <Heading type={Heading.types.H3} weight={Heading.weights.BOLD} color={Heading.colors.PRIMARY}>
                    {config.workspace.title}
                  </Heading>
                ) : null}
                {config.workspace.board ? (
                  <Text type={Text.types.TEXT2} color={Text.colors.SECONDARY}>
                    {config.workspace.board}
                  </Text>
                ) : null}
              </div>
            </Flex>
            <div className={styles.topbarActions}>
              {config.workspace.search ? (
                <Search
                  value={config.workspace.search.value}
                  onChange={(value) => config.workspace.search?.onChange?.(value)}
                  placeholder={config.workspace.search.placeholder}
                  className={styles.search}
                  size="small"
                />
              ) : null}
              {config.workspace.inviteLabel ? (
                <DxButton
                  variant="secondary"
                  size="sm"
                  telemetryId="workspace.invite"
                  leftIcon={InviteIcon}
                >
                  {config.workspace.inviteLabel}
                </DxButton>
              ) : null}
              {config.workspace.notificationsLabel ? (
                <IconButton
                  icon={NotificationsIcon}
                  ariaLabel={config.workspace.notificationsLabel}
                  tooltipContent={config.workspace.notificationsLabel}
                />
              ) : null}
              {config.workspace.profile ? (
                <Avatar
                  text={config.workspace.profile.initials}
                  withoutTooltip
                  ariaLabel={config.workspace.profile.name}
                  className={styles.profileAvatar}
                />
              ) : null}
            </div>
          </header>
          <main className={styles.main}>{children}</main>
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
