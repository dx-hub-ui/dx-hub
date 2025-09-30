"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DxButton, DxDialog, DxInput, DxToast, DxTooltip, useTelemetry } from "@dx/ui";
import { useAppLayout } from "@/components/app-shell/AppShell";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  DEFAULT_COLUMN_PREFERENCES,
  DEFAULT_GROUP_PREFERENCE,
  DEFAULT_SORT_PREFERENCE,
  PROSPECTS_SEED,
  PROSPECT_RESPONSIBLES,
} from "@/crm/mock-data";
import {
  DEMO_ORG_ID,
  PROSPECT_INTEREST_OPTIONS,
  PROSPECT_ORIGINS,
  PROSPECT_STATUS_ORDER,
  type ProspectActivity,
  type ProspectColumnId,
  type ProspectColumnPreference,
  type ProspectFilters,
  type ProspectRecord,
  type ProspectSortPreference,
  type ProspectStatus,
} from "@/crm/types";
import { PROSPECT_STATUS_THEME } from "@/crm/stage-theme";
import styles from "./ContactsPage.module.css";

type ViewMode = "table" | "kanban";

type GroupKey = "none" | "status" | "responsavel" | "origem" | "tag";

type TableVirtualItem =
  | { type: "group"; id: string; height: number; title: string; count: number }
  | { type: "row"; id: string; height: number; prospect: ProspectRecord };

type ActivityComposerState = {
  tipo: ProspectActivity["tipo"];
  conteudo: string;
};

const COLUMN_WIDTHS: Record<ProspectColumnId, number> = {
  select: 52,
  nome: 320,
  email: 240,
  telefone: 180,
  timeline: 160,
  interesse: 190,
  origem: 160,
  tags: 220,
  follow_up: 200,
  status: 180,
};

const TABLE_ROW_HEIGHT = 68;
const GROUP_HEADER_HEIGHT = 48;
const VIRTUAL_OVERSCAN_PX = 280;
const ACTIVITY_TYPES: ProspectActivity["tipo"][] = [
  "nota",
  "ligacao",
  "mensagem",
  "reuniao",
  "apresentacao",
  "follow_up",
  "sistema",
];

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function buildColumns(
  preferences: ProspectColumnPreference[],
): ProspectColumnPreference[] {
  const map = new Map<ProspectColumnId, ProspectColumnPreference>();
  preferences.forEach((pref) => {
    map.set(pref.id, pref);
  });
  DEFAULT_COLUMN_PREFERENCES.forEach((fallback) => {
    if (!map.has(fallback.id)) {
      map.set(fallback.id, fallback);
    }
  });
  return Array.from(map.values());
}

function buildGridTemplate(columns: ProspectColumnPreference[]): string {
  return columns
    .filter((column) => column.visible)
    .map((column) => `${column.width ?? COLUMN_WIDTHS[column.id]}px`)
    .join(" ");
}

function computePinnedOffset(
  columns: ProspectColumnPreference[],
  target: ProspectColumnId,
): number {
  let offset = 0;
  for (const column of columns) {
    if (!column.visible) continue;
    if (column.id === target) break;
    if (column.pinned === "left") {
      offset += column.width ?? COLUMN_WIDTHS[column.id];
    } else {
      offset += 0;
    }
  }
  return offset;
}

function flattenProspects(
  groups: Array<{ id: string; title: string; prospects: ProspectRecord[] }>,
): TableVirtualItem[] {
  const items: TableVirtualItem[] = [];
  for (const group of groups) {
    items.push({
      type: "group",
      id: `group-${group.id}`,
      title: group.title,
      count: group.prospects.length,
      height: GROUP_HEADER_HEIGHT,
    });
    for (const prospect of group.prospects) {
      items.push({
        type: "row",
        id: prospect.id,
        prospect,
        height: TABLE_ROW_HEIGHT,
      });
    }
  }
  return items;
}

function computeVirtualWindow(
  items: TableVirtualItem[],
  scrollTop: number,
  viewportHeight: number,
) {
  const startBound = Math.max(scrollTop - VIRTUAL_OVERSCAN_PX, 0);
  const endBound = scrollTop + viewportHeight + VIRTUAL_OVERSCAN_PX;

  let offset = 0;
  let startIndex = 0;
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const nextOffset = offset + item.height;
    if (nextOffset >= startBound) {
      startIndex = index;
      break;
    }
    offset = nextOffset;
  }

  let accumulated = offset;
  let endIndex = startIndex;
  for (let index = startIndex; index < items.length; index += 1) {
    const item = items[index];
    accumulated += item.height;
    endIndex = index;
    if (accumulated >= endBound) {
      break;
    }
  }

  const top = items
    .slice(0, startIndex)
    .reduce((sum, item) => sum + item.height, 0);
  const bottom = items
    .slice(endIndex + 1)
    .reduce((sum, item) => sum + item.height, 0);

  return {
    startIndex,
    endIndex,
    top,
    bottom,
  };
}

function getSentryTraceId(): string | undefined {
  const globalObject = globalThis as unknown as {
    __SENTRY__?: {
      hub?: {
        getScope: () => { getSpan: () => { spanContext: () => { traceId?: string } } | undefined };
      };
    };
  };

  try {
    const scope = globalObject.__SENTRY__?.hub?.getScope?.();
    const span = scope?.getSpan?.();
    const context = span?.spanContext?.();
    return context?.traceId;
  } catch {
    return undefined;
  }
  return undefined;
}

export default function ContactsPage() {
  const telemetry = useTelemetry();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setConfig } = useAppLayout();
  const contactsDictionary = useTranslation("contacts");
  const t = contactsDictionary.t;
  const locale = contactsDictionary.locale;

  const [view, setView] = useState<ViewMode>(() => {
    const param = searchParams?.get("view");
    return param === "kanban" ? "kanban" : "table";
  });
  const [prospects, setProspects] = useState<ProspectRecord[]>(PROSPECTS_SEED);
  const [filters, setFilters] = useState<ProspectFilters>({});
  const [group, setGroup] = useState<GroupKey>(DEFAULT_GROUP_PREFERENCE.key);
  const [sort] = useState<ProspectSortPreference>(DEFAULT_SORT_PREFERENCE);
  const [columns, setColumns] = useState<ProspectColumnPreference[]>(
    buildColumns(DEFAULT_COLUMN_PREFERENCES),
  );
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [modalProspectId, setModalProspectId] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [composer, setComposer] = useState<ActivityComposerState>({ tipo: "nota", conteudo: "" });
  const [toastState, setToastState] = useState<{ open: boolean; title: string }>({
    open: false,
    title: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isColumnsDialogOpen, setColumnsDialogOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(640);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsLoading(false), 480);
    return () => window.clearTimeout(timeout);
  }, []);

  const activeProspect = useMemo(() => {
    if (!modalProspectId) return null;
    return prospects.find((prospect) => prospect.id === modalProspectId) ?? null;
  }, [modalProspectId, prospects]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("view", view);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [view, router, pathname, searchParams]);

  const handleSearch = useCallback(
    (value: string) => {
      setFilters((prev) => ({ ...prev, search: value }));
      telemetry.capture("prospects_filter_changed", {
        module: "contacts",
        org_id: DEMO_ORG_ID,
        view,
        search: value,
      });
    },
    [telemetry, view],
  );

  useEffect(() => {
    const traceId = getSentryTraceId();
    telemetry.capture("prospects_view_opened", {
      module: "contacts",
      org_id: DEMO_ORG_ID,
      view,
      user_id: "member-owner",
      role: "owner",
      locale,
      columns_visible: columns.filter((column) => column.visible).map((column) => column.id),
      group_by: group,
      sorts: [sort],
      filters,
      has_replay: false,
      sentry_trace_id: traceId,
    });
  }, [columns, filters, group, locale, sort, telemetry, view]);

  useEffect(() => {
    setConfig({
      sidebar: {
        activeItemId: "crm",
        sections: [
          { id: "main", label: "CRM", items: [{ id: "crm", label: t("title") }] },
        ],
      },
      workspace: {
        title: t("title"),
        board: t("title"),
        profile: {
          name: "João Martins",
          role: "Owner",
          initials: "JM",
        },
        search: {
          value: filters.search ?? "",
          onChange: (value) => handleSearch(value),
          placeholder: t("toolbar.search"),
        },
        notificationsLabel: t("toolbar.help"),
      },
    });
  }, [filters.search, handleSearch, setConfig, t]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const handle = () => {
      setScrollTop(node.scrollTop);
      setViewportHeight(node.clientHeight);
    };
    handle();
    node.addEventListener("scroll", handle);
    return () => node.removeEventListener("scroll", handle);
  }, []);

  const handleToggleSelection = useCallback((prospectId: string) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(prospectId)) {
        next.delete(prospectId);
      } else {
        next.add(prospectId);
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback((ids: string[]) => {
    setSelection((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const filteredProspects = useMemo(() => {
    const term = filters.search?.trim().toLowerCase() ?? "";
    const filtered = prospects.filter((prospect) => {
      if (filters.archived === false && prospect.archivedAt) {
        return false;
      }
      if (term) {
        const haystack = [
          prospect.nomeCompleto,
          prospect.email,
          prospect.telefone,
          prospect.tags.join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) {
          return false;
        }
      }
      if (filters.status && filters.status.length > 0 && !filters.status.includes(prospect.status)) {
        return false;
      }
      if (
        filters.responsaveis &&
        filters.responsaveis.length > 0 &&
        !filters.responsaveis.includes(prospect.responsavelId)
      ) {
        return false;
      }
      if (
        filters.interesse &&
        filters.interesse.length > 0 &&
        !filters.interesse.includes(prospect.interesse)
      ) {
        return false;
      }
      if (filters.origem && filters.origem.length > 0 && !filters.origem.includes(prospect.origem)) {
        return false;
      }
      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some((tag) => prospect.tags.includes(tag));
        if (!hasTag) {
          return false;
        }
      }
      if (filters.periodo?.from) {
        if (new Date(prospect.proximoFollowUpAt ?? 0) < new Date(filters.periodo.from)) {
          return false;
        }
      }
      if (filters.periodo?.to) {
        if (new Date(prospect.proximoFollowUpAt ?? 0) > new Date(filters.periodo.to)) {
          return false;
        }
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sort.field) {
        case "nome": {
          return sort.direction === "asc"
            ? a.nomeCompleto.localeCompare(b.nomeCompleto)
            : b.nomeCompleto.localeCompare(a.nomeCompleto);
        }
        case "status": {
          const aIndex = PROSPECT_STATUS_ORDER.indexOf(a.status);
          const bIndex = PROSPECT_STATUS_ORDER.indexOf(b.status);
          return sort.direction === "asc" ? aIndex - bIndex : bIndex - aIndex;
        }
        case "proximo_follow_up": {
          const aDate = a.proximoFollowUpAt ?? "";
          const bDate = b.proximoFollowUpAt ?? "";
          return sort.direction === "asc"
            ? aDate.localeCompare(bDate)
            : bDate.localeCompare(aDate);
        }
        case "interesse": {
          const order = PROSPECT_INTEREST_OPTIONS;
          const aIndex = order.indexOf(a.interesse);
          const bIndex = order.indexOf(b.interesse);
          return sort.direction === "asc" ? aIndex - bIndex : bIndex - aIndex;
        }
        case "atualizado_em":
        default: {
          return sort.direction === "asc"
            ? a.updatedAt.localeCompare(b.updatedAt)
            : b.updatedAt.localeCompare(a.updatedAt);
        }
      }
    });
    return sorted;
  }, [filters, prospects, sort]);

  const groups = useMemo(() => {
    if (group === "none") {
      return [
        {
          id: "all",
          title: t("sections.active"),
          prospects: filteredProspects,
        },
      ];
    }

    const map = new Map<string, ProspectRecord[]>();
    const labelFor = (prospect: ProspectRecord) => {
      switch (group) {
        case "status":
          return t(`status.${prospect.status}`);
        case "responsavel":
          return prospect.responsavelNome;
        case "origem":
          return t(`origins.${prospect.origem}`);
        case "tag":
          return prospect.tags[0] ?? t("groupBy.none");
        default:
          return t("groupBy.none");
      }
    };

    filteredProspects.forEach((prospect) => {
      const key = group === "tag" ? prospect.tags[0] ?? "sem-tag" : `${group}-${labelFor(prospect)}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(prospect);
    });

    return Array.from(map.entries()).map(([id, list]) => ({
      id,
      title: group === "status" ? t(`status.${list[0]?.status ?? "novo"}`) : labelFor(list[0]!),
      prospects: list,
    }));
  }, [filteredProspects, group, t]);

  const flattenedItems = useMemo(() => flattenProspects(groups), [groups]);

  const virtualWindow = useMemo(() => {
    return computeVirtualWindow(flattenedItems, scrollTop, viewportHeight);
  }, [flattenedItems, scrollTop, viewportHeight]);

  const gridTemplate = useMemo(() => buildGridTemplate(columns), [columns]);

  const totalSelected = selection.size;

  const handleCreateProspect = useCallback(() => {
    const id = `prospect-${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();
    const newProspect: ProspectRecord = {
      id,
      orgId: DEMO_ORG_ID,
      createdAt: nowIso,
      updatedAt: nowIso,
      nomeCompleto: t("toolbar.new"),
      email: "",
      telefone: "",
      countryCode: "BR",
      status: "novo",
      responsavelId: PROSPECT_RESPONSIBLES[0]?.id ?? "member-owner",
      responsavelNome: PROSPECT_RESPONSIBLES[0]?.nome ?? "João Martins",
      interesse: "interessado",
      origem: "funil",
      proximoFollowUpAt: nowIso,
      tags: [],
      notas: "",
      activitiesCount: 0,
      archivedAt: null,
      activities: [],
    };
    setProspects((prev) => [newProspect, ...prev]);
    setModalProspectId(id);
    setModalOpen(true);
    setToastState({ open: true, title: t("toasts.created") });
    telemetry.capture("prospects_created", {
      module: "contacts",
      org_id: DEMO_ORG_ID,
      view,
      source: "botao",
      count: 1,
      prospect_id: id,
    });
  }, [t, telemetry, view]);

  const handleOpenProspect = useCallback(
    (prospectId: string, entry: "duplo_clique" | "expandir" = "duplo_clique") => {
      setModalProspectId(prospectId);
      setModalOpen(true);
      telemetry.capture("prospects_row_expanded", {
        module: "contacts",
        org_id: DEMO_ORG_ID,
        prospect_id: prospectId,
        view,
        entry,
      });
    },
    [telemetry, view],
  );

  const handleUpdateProspect = useCallback(
    (prospectId: string, patch: Partial<ProspectRecord>) => {
      setProspects((prev) =>
        prev.map((prospect) =>
          prospect.id === prospectId
            ? { ...prospect, ...patch, updatedAt: new Date().toISOString() }
            : prospect,
        ),
      );
      const changed = Object.keys(patch);
      telemetry.capture("prospects_inline_edit", {
        module: "contacts",
        org_id: DEMO_ORG_ID,
        prospect_id: prospectId,
        field: changed[0],
        changed,
      });
    },
    [telemetry],
  );

  const handleChangeStatus = useCallback(
    (prospectId: string, nextStatus: ProspectStatus, via: "kanban" | "tabela") => {
      setProspects((prev) =>
        prev.map((prospect) => {
          if (prospect.id !== prospectId) return prospect;
          if (prospect.status === nextStatus) return prospect;
          return {
            ...prospect,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          };
        }),
      );
      telemetry.capture("prospects_status_changed", {
        module: "contacts",
        org_id: DEMO_ORG_ID,
        prospect_id: prospectId,
        from: prospects.find((p) => p.id === prospectId)?.status,
        to: nextStatus,
        via,
        dnd: via === "kanban",
      });
    },
    [prospects, telemetry],
  );

  const handleBulkAction = useCallback(
    (action: string) => {
      const start = performance.now();
      const selected = Array.from(selection);
      if (selected.length === 0) return;
      const duration = Math.round(performance.now() - start);
      telemetry.capture("prospects_bulk_action", {
        module: "contacts",
        org_id: DEMO_ORG_ID,
        view,
        action,
        selected_count: selected.length,
        succeeded_count: selected.length,
        duration_ms: duration,
      });
      telemetry.capture("prospects_perf_bulk_action_duration", {
        module: "contacts",
        org_id: DEMO_ORG_ID,
        duration_ms: duration,
      });
      setToastState({ open: true, title: t("toasts.bulk.success") });
    },
    [selection, telemetry, t, view],
  );

  const handleComposerSubmit = useCallback(() => {
    if (!modalProspectId || !composer.conteudo.trim()) return;
    const entry: ProspectActivity = {
      id: `activity-${crypto.randomUUID()}`,
      prospectId: modalProspectId,
      tipo: composer.tipo,
      conteudo: composer.conteudo.trim(),
      anexosCount: 0,
      criadoPor: "João Martins",
      createdAt: new Date().toISOString(),
    };
    setProspects((prev) =>
      prev.map((prospect) =>
        prospect.id === modalProspectId
          ? {
              ...prospect,
              activities: [entry, ...(prospect.activities ?? [])],
              activitiesCount: prospect.activitiesCount + 1,
              updatedAt: entry.createdAt,
            }
          : prospect,
      ),
    );
    setComposer({ tipo: composer.tipo, conteudo: "" });
    telemetry.capture("prospects_activity_created", {
      module: "contacts",
      org_id: DEMO_ORG_ID,
      prospect_id: modalProspectId,
      tipo: composer.tipo,
      length: entry.conteudo.length,
      anexos: entry.anexosCount,
    });
  }, [composer, modalProspectId, telemetry]);

  const visibleColumnIds = columns.filter((column) => column.visible).map((column) => column.id);

  const allIds = filteredProspects.map((prospect) => prospect.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selection.has(id));

  const hasSelection = totalSelected > 0;

  const handleCloseModal = useCallback(
    (reason: "cancelar" | "salvar") => {
      setModalOpen(false);
      if (modalProspectId) {
        telemetry.capture("prospects_modal_action", {
          module: "contacts",
          org_id: DEMO_ORG_ID,
          prospect_id: modalProspectId,
          action: reason,
          duration_ms: 0,
        });
      }
    },
    [modalProspectId, telemetry],
  );

  return (
    <main className={styles.root}>
      <section className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>{t("title")}</h1>
            <p className={styles.subtitle}>{t("description")}</p>
          </div>
          <div className={styles.tabs} role="tablist" aria-label={t("title")}>
            <button
              type="button"
              className={styles.tabButton}
              data-active={view === "table"}
              onClick={() => {
                setView("table");
                telemetry.capture("prospects_filter_changed", {
                  module: "contacts",
                  org_id: DEMO_ORG_ID,
                  view: "table",
                });
              }}
              role="tab"
              aria-selected={view === "table"}
            >
              {t("tabs.table")}
            </button>
            <button
              type="button"
              className={styles.tabButton}
              data-active={view === "kanban"}
              onClick={() => {
                setView("kanban");
                telemetry.capture("prospects_filter_changed", {
                  module: "contacts",
                  org_id: DEMO_ORG_ID,
                  view: "kanban",
                });
              }}
              role="tab"
              aria-selected={view === "kanban"}
            >
              {t("tabs.kanban")}
            </button>
            <button type="button" className={styles.tabButton} disabled>
              {t("tabs.new")}
            </button>
          </div>
        </div>
        <div className={styles.actionsRow}>
          <div className={styles.actionsLeft}>
            <DxTooltip content={t("toolbar.newMenu.import")}>
              <DxButton variant="primary" onClick={handleCreateProspect} telemetryId="contacts.new">
                {t("toolbar.new")}
              </DxButton>
            </DxTooltip>
            <DxInput
              className={styles.searchInput}
              value={filters.search ?? ""}
              onChange={handleSearch}
              placeholder={t("toolbar.search")}
              telemetryId="contacts.search"
              data-ph-mask
            />
            <div className={styles.multiSelect}>
              <button
                type="button"
                data-active={group === "responsavel"}
                onClick={() => setGroup((prev) => (prev === "responsavel" ? "none" : "responsavel"))}
              >
                {t("toolbar.owner")}
              </button>
              <button
                type="button"
                data-active={group === "status"}
                onClick={() => setGroup((prev) => (prev === "status" ? "none" : "status"))}
              >
                {t("toolbar.filter")}
              </button>
              <button
                type="button"
                data-active={group === "origem"}
                onClick={() => setGroup((prev) => (prev === "origem" ? "none" : "origem"))}
              >
                {t("toolbar.group")}
              </button>
            </div>
          </div>
          <div className={styles.actionsRight}>
            {isLoading ? <div className={styles.progressStrip} role="progressbar" aria-label={t("toolbar.progress")} /> : null}
            <DxButton variant="ghost" size="sm" telemetryId="contacts.more" onClick={() => setColumnsDialogOpen(true)}>
              {t("toolbar.columnSettings")}
            </DxButton>
            <DxButton variant="ghost" size="sm" telemetryId="contacts.preferences">
              {t("toolbar.viewPreferences")}
            </DxButton>
            <DxButton variant="ghost" size="sm" telemetryId="contacts.help">
              {t("toolbar.help")}
            </DxButton>
          </div>
        </div>
      </section>

      {view === "table" ? (
        <section className={styles.tableCard} role="region" aria-label={t("tabs.table")}>
          {flattenedItems.length === 0 ? (
            <div className={styles.emptyState}>
              <h2 className={styles.emptyTitle}>{t("table.empty.title")}</h2>
              <p className={styles.emptyDescription}>{t("table.empty.description")}</p>
              <div className={styles.actionsLeft}>
                <DxButton variant="primary" onClick={handleCreateProspect} telemetryId="contacts.empty.create">
                  {t("table.empty.primary")}
                </DxButton>
                <DxButton variant="ghost" telemetryId="contacts.empty.import">
                  {t("table.empty.secondary")}
                </DxButton>
              </div>
            </div>
          ) : (
            <div ref={scrollRef} className={styles.tableScrollArea} role="grid" aria-rowcount={flattenedItems.length}>
              <div
                className={styles.tableHeader}
                style={{ gridTemplateColumns: gridTemplate }}
                role="row"
              >
                {visibleColumnIds.map((columnId) => {
                  switch (columnId) {
                    case "select":
                      return (
                        <span key={columnId} role="columnheader">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() => handleToggleAll(allIds)}
                            aria-label={t("table.columns.select")}
                          />
                        </span>
                      );
                    case "nome":
                      return <span key={columnId}>{t("table.columns.name")}</span>;
                    case "email":
                      return <span key={columnId}>{t("table.columns.email")}</span>;
                    case "telefone":
                      return <span key={columnId}>{t("table.columns.phone")}</span>;
                    case "timeline":
                      return <span key={columnId}>{t("table.columns.timeline")}</span>;
                    case "interesse":
                      return <span key={columnId}>{t("table.columns.interest")}</span>;
                    case "origem":
                      return <span key={columnId}>{t("table.columns.origin")}</span>;
                    case "tags":
                      return <span key={columnId}>{t("table.columns.tags")}</span>;
                    case "follow_up":
                      return <span key={columnId}>{t("table.columns.nextFollowUp")}</span>;
                    case "status":
                      return <span key={columnId}>{t("table.columns.status")}</span>;
                    default:
                      return null;
                  }
                })}
              </div>
              <div className={styles.virtualSpacer} style={{ height: virtualWindow.top }} />
              {flattenedItems.slice(virtualWindow.startIndex, virtualWindow.endIndex + 1).map((item) => {
                if (item.type === "group") {
                  return (
                    <div key={item.id} className={styles.groupHeader} role="rowheader">
                      <div className={styles.groupTitle}>
                        <span>{item.title}</span>
                        <span className={styles.badgeChip}>{t("kanban.count", { count: item.count })}</span>
                      </div>
                      <button type="button" className={styles.groupAction} onClick={handleCreateProspect}>
                        {t("table.group.add")}
                      </button>
                    </div>
                  );
                }
                const { prospect } = item;
                return (
                  <div
                    key={prospect.id}
                    className={styles.tableRow}
                    data-selected={selection.has(prospect.id)}
                    style={{ gridTemplateColumns: gridTemplate, height: TABLE_ROW_HEIGHT }}
                    role="row"
                    tabIndex={0}
                    onDoubleClick={() => handleOpenProspect(prospect.id)}
                  >
                    {visibleColumnIds.map((columnId) => {
                      const pinned = columns.find((column) => column.id === columnId)?.pinned;
                      const offset = pinned === "left" ? computePinnedOffset(columns, columnId) : 0;
                      const stickyClass = pinned === "left" ? styles.stickyCell : undefined;
                      const style = pinned === "left" ? { left: offset } : undefined;

                      switch (columnId) {
                        case "select":
                          return (
                            <span key={`${prospect.id}-${columnId}`} className={stickyClass} style={style}>
                              <input
                                type="checkbox"
                                checked={selection.has(prospect.id)}
                                onChange={() => handleToggleSelection(prospect.id)}
                                aria-label={t("table.selection.count", { count: 1 })}
                              />
                            </span>
                          );
                        case "nome":
                          return (
                            <span key={`${prospect.id}-${columnId}`} className={stickyClass} style={style}>
                              <strong>{prospect.nomeCompleto}</strong>
                              <br />
                              <small>{prospect.responsavelNome}</small>
                            </span>
                          );
                        case "email":
                          return <span key={`${prospect.id}-${columnId}`}>{prospect.email || "—"}</span>;
                        case "telefone":
                          return <span key={`${prospect.id}-${columnId}`}>{prospect.telefone || "—"}</span>;
                        case "timeline":
                          return (
                            <span key={`${prospect.id}-${columnId}`} className={styles.badgeChip}>
                              {t("kanban.count", { count: prospect.activitiesCount })}
                            </span>
                          );
                        case "interesse":
                          return (
                            <select
                              key={`${prospect.id}-${columnId}`}
                              className={styles.fieldControl}
                              value={prospect.interesse}
                              onChange={(event) =>
                                handleUpdateProspect(prospect.id, {
                                  interesse: event.target.value as ProspectRecord["interesse"],
                                })
                              }
                            >
                              {PROSPECT_INTEREST_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {t(`interest.${option}`)}
                                </option>
                              ))}
                            </select>
                          );
                        case "origem":
                          return (
                            <select
                              key={`${prospect.id}-${columnId}`}
                              className={styles.fieldControl}
                              value={prospect.origem}
                              onChange={(event) =>
                                handleUpdateProspect(prospect.id, {
                                  origem: event.target.value as ProspectRecord["origem"],
                                })
                              }
                            >
                              {PROSPECT_ORIGINS.map((option) => (
                                <option key={option} value={option}>
                                  {t(`origins.${option}`)}
                                </option>
                              ))}
                            </select>
                          );
                        case "tags":
                          return (
                            <span key={`${prospect.id}-${columnId}`} className={styles.tagList}>
                              {prospect.tags.length === 0
                                ? "—"
                                : prospect.tags.map((tag) => (
                                    <span key={tag} className={styles.tag}>
                                      {tag}
                                    </span>
                                  ))}
                            </span>
                          );
                        case "follow_up":
                          return <span key={`${prospect.id}-${columnId}`}>{formatDate(prospect.proximoFollowUpAt, locale)}</span>;
                        case "status": {
                          const theme = PROSPECT_STATUS_THEME[prospect.status];
                          return (
                            <select
                              key={`${prospect.id}-${columnId}`}
                              className={styles.statusChip}
                              value={prospect.status}
                              style={{ background: theme.tint, color: theme.textOnAccent, border: `1px solid ${theme.chipBorder}` }}
                              onChange={(event) =>
                                handleChangeStatus(prospect.id, event.target.value as ProspectStatus, "tabela")
                              }
                            >
                              {PROSPECT_STATUS_ORDER.map((status) => (
                                <option key={status} value={status}>
                                  {t(`status.${status}`)}
                                </option>
                              ))}
                            </select>
                          );
                        }
                        default:
                          return null;
                      }
                    })}
                  </div>
                );
              })}
              <div className={styles.virtualSpacer} style={{ height: virtualWindow.bottom }} />
            </div>
          )}
        </section>
      ) : (
        <section className={styles.kanbanBoard} aria-label={t("tabs.kanban")}>
          {PROSPECT_STATUS_ORDER.map((status) => {
            const statusProspects = filteredProspects.filter((prospect) => prospect.status === status);
            const theme = PROSPECT_STATUS_THEME[status];
            return (
              <div key={status} className={styles.kanbanColumn} aria-label={t(`status.${status}`)}>
                <header
                  className={styles.kanbanColumnHeader}
                  style={{ background: theme.tint, color: theme.textOnAccent }}
                >
                  <span>{t(`kanban.header.${status}`)}</span>
                  <span className={styles.badgeChip}>{t("kanban.count", { count: statusProspects.length })}</span>
                </header>
                <div className={styles.kanbanList}>
                  {statusProspects.length === 0 ? (
                    <p>{t("kanban.empty")}</p>
                  ) : (
                    statusProspects.map((prospect) => (
                      <article
                        key={prospect.id}
                        className={styles.kanbanCard}
                        role="button"
                        tabIndex={0}
                        onDoubleClick={() => handleOpenProspect(prospect.id, "expandir")}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            handleOpenProspect(prospect.id, "expandir");
                          }
                        }}
                      >
                        <div className={styles.kanbanCardHeader}>
                          <div>
                            <strong>{prospect.nomeCompleto}</strong>
                            <p>{prospect.responsavelNome}</p>
                          </div>
                          <button
                            type="button"
                            className={styles.groupAction}
                            onClick={() => handleChangeStatus(prospect.id, "cadastrado", "kanban")}
                            aria-label={t("kanban.tooltip")}
                          >
                            {t("kanban.tooltip")}
                          </button>
                        </div>
                        <div className={styles.kanbanTags}>
                          <span className={styles.badgeChip}>{t(`interest.${prospect.interesse}`)}</span>
                          <span className={styles.badgeChip}>{t(`origins.${prospect.origem}`)}</span>
                        </div>
                        <div className={styles.tagList}>
                          {prospect.tags.map((tag) => (
                            <span key={tag} className={styles.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </article>
                    ))
                  )}
                </div>
                <button type="button" className={styles.addCardButton} onClick={handleCreateProspect}>
                  {t("kanban.add")}
                </button>
              </div>
            );
          })}
        </section>
      )}

      {hasSelection ? (
        <div className={styles.bottomBar} role="status">
          <span>{t("table.selection.count", { count: totalSelected })}</span>
          <div className={styles.bottomActions}>
            <DxButton size="sm" variant="ghost" onClick={() => handleBulkAction("exportar")}>
              {t("bulk.export")}
            </DxButton>
            <DxButton size="sm" variant="ghost" onClick={() => handleBulkAction("duplicar")}>
              {t("bulk.duplicate")}
            </DxButton>
            <DxButton size="sm" variant="ghost" onClick={() => handleBulkAction("converter")}>
              {t("bulk.convert")}
            </DxButton>
            <DxButton size="sm" variant="ghost" onClick={() => setSelection(new Set<string>())}>
              {t("bulk.clear")}
            </DxButton>
          </div>
        </div>
      ) : null}

      <DxDialog
        show={isModalOpen}
        onClose={() => handleCloseModal("cancelar")}
        title={t("modal.title")}
      >
        {activeProspect ? (
          <div className={styles.modalContent}>
            <div className={styles.detailsStack}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="modal-name">
                  {t("modal.name")}
                </label>
                <input
                  id="modal-name"
                  className={styles.fieldControl}
                  value={activeProspect.nomeCompleto}
                  data-ph-mask
                  onChange={(event) =>
                    handleUpdateProspect(activeProspect.id, { nomeCompleto: event.target.value })
                  }
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="modal-email">
                  {t("modal.email")}
                </label>
                <input
                  id="modal-email"
                  className={styles.fieldControl}
                  type="email"
                  value={activeProspect.email ?? ""}
                  data-ph-mask
                  onChange={(event) => handleUpdateProspect(activeProspect.id, { email: event.target.value })}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="modal-phone">
                  {t("modal.phone")}
                </label>
                <input
                  id="modal-phone"
                  className={styles.fieldControl}
                  value={activeProspect.telefone ?? ""}
                  data-ph-mask
                  onChange={(event) => handleUpdateProspect(activeProspect.id, { telefone: event.target.value })}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="modal-status">
                  {t("modal.status")}
                </label>
                <select
                  id="modal-status"
                  className={styles.fieldControl}
                  value={activeProspect.status}
                  onChange={(event) =>
                    handleChangeStatus(activeProspect.id, event.target.value as ProspectStatus, "tabela")
                  }
                >
                  {PROSPECT_STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {t(`status.${status}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="modal-notes">
                  {t("modal.notes")}
                </label>
                <textarea
                  id="modal-notes"
                  className={styles.fieldTextarea}
                  value={activeProspect.notas ?? ""}
                  onChange={(event) => handleUpdateProspect(activeProspect.id, { notas: event.target.value })}
                />
              </div>
            </div>
            <div className={styles.timelineSection}>
              <div className={styles.activityComposer}>
                <div className={styles.activityTabs}>
                  {ACTIVITY_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      data-active={composer.tipo === type}
                      onClick={() => setComposer((prev) => ({ ...prev, tipo: type }))}
                    >
                      {t(`modal.activitiesTypes.${type}`)}
                    </button>
                  ))}
                </div>
                <textarea
                  className={styles.fieldTextarea}
                  placeholder={t("modal.activitiesPlaceholder")}
                  value={composer.conteudo}
                  onChange={(event) => setComposer((prev) => ({ ...prev, conteudo: event.target.value }))}
                />
                <DxButton variant="primary" size="sm" onClick={handleComposerSubmit}>
                  {t("modal.save")}
                </DxButton>
              </div>
              <div className={styles.timelineList}>
                {(activeProspect.activities ?? []).length === 0 ? (
                  <p>{t("modal.timelineEmpty")}</p>
                ) : (
                  (activeProspect.activities ?? []).map((activity) => (
                    <div key={activity.id} className={styles.timelineItem}>
                      <span className={styles.timelineMarker} aria-hidden />
                      <div className={styles.timelineBody}>
                        <span className={styles.timelineTitle}>{t(`modal.activitiesTypes.${activity.tipo}`)}</span>
                        <span className={styles.timelineMeta}>{activity.conteudo}</span>
                        <time className={styles.timelineMeta} dateTime={activity.createdAt}>
                          {formatDate(activity.createdAt, locale)}
                        </time>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className={styles.bottomActions}>
                <DxButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCloseModal("cancelar")}
                >
                  {t("modal.cancel")}
                </DxButton>
                <DxButton variant="primary" size="sm" onClick={() => handleCloseModal("salvar")}>
                  {t("modal.save")}
                </DxButton>
              </div>
            </div>
          </div>
        ) : null}
      </DxDialog>

      <DxDialog
        show={isColumnsDialogOpen}
        onClose={() => setColumnsDialogOpen(false)}
        title={t("columnSettings.title")}
        description={t("columnSettings.description")}
      >
        <div className={styles.detailsStack}>
          {columns.map((column) => (
            <label key={column.id} className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t(`table.columns.${column.id === "follow_up" ? "nextFollowUp" : column.id}`)}</span>
              <div className={styles.multiSelect}>
                <input
                  type="checkbox"
                  checked={column.visible}
                  onChange={(event) =>
                    setColumns((prev) =>
                      prev.map((item) =>
                        item.id === column.id ? { ...item, visible: event.target.checked } : item,
                      ),
                    )
                  }
                />
                <span>{column.visible ? "Visível" : "Oculto"}</span>
              </div>
            </label>
          ))}
          <DxButton
            variant="ghost"
            onClick={() => setColumns(buildColumns(DEFAULT_COLUMN_PREFERENCES))}
          >
            {t("columnSettings.reset")}
          </DxButton>
        </div>
      </DxDialog>

      <DxToast open={toastState.open} onOpenChange={(open) => setToastState((prev) => ({ ...prev, open }))} title={toastState.title} />
    </main>
  );
}
