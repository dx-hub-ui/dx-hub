"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DxButton, DxInput } from "@dx/ui";
import { useTranslation } from "@/i18n/I18nProvider";

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
      <div className="flex min-h-screen bg-[var(--dx-color-page-background)] text-[var(--dx-color-text-primary)]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--dx-color-border)] bg-[var(--dx-color-surface)] px-4 py-6 lg:flex">
          {config.sidebar.sections.map((section) => (
            <div key={section.id} className="mb-6 last:mb-0">
              <div className="px-2 text-xs font-semibold uppercase tracking-wide text-[var(--dx-color-text-tertiary)]">
                {section.label}
              </div>
              <div className="mt-3 flex flex-col gap-1 text-sm">
                {section.items.map((item) => {
                  const isActive = item.id === config.sidebar.activeItemId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`flex items-center justify-between rounded-md px-3 py-2 text-left transition-colors ${
                        isActive
                          ? "bg-[var(--dx-color-page-background)] font-semibold text-[var(--dx-color-text-primary)]"
                          : "text-[var(--dx-color-text-secondary)] hover:bg-[var(--dx-color-page-background)] hover:text-[var(--dx-color-text-primary)]"
                      }`}
                      aria-pressed={isActive}
                    >
                      <span>{item.label}</span>
                      {isActive ? (
                        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--dx-color-accent)]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {config.sidebar.footer ? (
            <div className="mt-auto rounded-lg bg-[var(--dx-color-page-background)] p-3 text-xs text-[var(--dx-color-text-secondary)]">
              {config.sidebar.footer.title ? (
                <p className="font-semibold text-[var(--dx-color-text-primary)]">{config.sidebar.footer.title}</p>
              ) : null}
              {config.sidebar.footer.description ? <p>{config.sidebar.footer.description}</p> : null}
            </div>
          ) : null}
        </aside>
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex flex-col gap-4 border-b border-[var(--dx-color-border)] bg-[var(--dx-color-surface)] px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--dx-color-accent)] text-sm font-semibold uppercase tracking-wide text-white">
                {appAcronym}
              </div>
              <div className="flex flex-col">
                {config.workspace.title ? (
                  <span className="text-sm font-semibold text-[var(--dx-color-text-primary)]">{config.workspace.title}</span>
                ) : null}
                {config.workspace.board ? (
                  <span className="text-xs text-[var(--dx-color-text-tertiary)]">{config.workspace.board}</span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              {config.workspace.search ? (
                <DxInput
                  name="workspace-search"
                  value={config.workspace.search.value}
                  onChange={(value) => config.workspace.search?.onChange?.(value)}
                  placeholder={config.workspace.search.placeholder}
                  telemetryId={config.workspace.search.telemetryId}
                  density="compact"
                  className="w-full md:w-72"
                />
              ) : null}
              <div className="flex items-center gap-2">
                {config.workspace.inviteLabel ? (
                  <DxButton variant="secondary" size="sm" telemetryId="workspace.invite">
                    {config.workspace.inviteLabel}
                  </DxButton>
                ) : null}
                {config.workspace.notificationsLabel ? (
                  <DxButton
                    variant="ghost"
                    size="sm"
                    telemetryId="workspace.notifications"
                    aria-label={config.workspace.notificationsLabel}
                  >
                    <span aria-hidden="true" role="img">
                      {config.workspace.notificationsIcon}
                    </span>
                  </DxButton>
                ) : null}
                {config.workspace.profile ? (
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-[var(--dx-color-border)] bg-[var(--dx-color-surface)] px-3 py-1 text-left transition-shadow hover:shadow-sm"
                    aria-label={config.workspace.profile.label}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--dx-color-accent)] text-sm font-semibold uppercase text-white">
                      {config.workspace.profile.initials}
                    </span>
                    <span className="hidden flex-col leading-tight sm:flex">
                      <span className="text-sm font-medium text-[var(--dx-color-text-primary)]">
                        {config.workspace.profile.name}
                      </span>
                      {config.workspace.profile.role ? (
                        <span className="text-xs text-[var(--dx-color-text-tertiary)]">{config.workspace.profile.role}</span>
                      ) : null}
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-[var(--dx-color-page-background)]">{children}</main>
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
