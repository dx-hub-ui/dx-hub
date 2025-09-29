"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DxBadge,
  DxButton,
  DxCard,
  DxDialog,
  DxInput,
  DxSkeleton,
  DxTable,
  DxToast,
  DxTooltip,
  useTelemetry,
} from "@dx/ui";
import { Label } from "@vibe/core";
import { useAppLayout } from "@/components/app-shell/AppShell";
import { useTranslation } from "@/i18n/I18nProvider";
import { CRM_CONTACTS_SEED } from "@/crm/mock-data";
import {
  CONTACT_STAGE_ORDER,
  DEMO_ORG_ID,
  type ContactRecord,
  type ContactStage,
} from "@/crm/types";
import { CONTACT_STAGE_THEME } from "@/crm/stage-theme";

const PAGE_SIZE = 5;
const CURRENT_MEMBER = {
  id: "member-owner",
  name: "João Martins",
  role: "owner",
};

type StageFilter = ContactStage | "all";

type ContactFormState = {
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: ContactStage;
};

type ContactFormErrors = Partial<Record<keyof ContactFormState, string>>;

function formatDateTime(value: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function defaultFormState(): ContactFormState {
  return {
    name: "",
    company: "",
    email: "",
    phone: "",
    stage: CONTACT_STAGE_ORDER[0],
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export default function HomePage() {
  const { t: tCommon } = useTranslation("common");
  const contactsDictionary = useTranslation("contacts");
  const { t: tErrors } = useTranslation("errors");
  const { t: tAuth } = useTranslation("auth");
  const tContacts = contactsDictionary.t;
  const locale = contactsDictionary.locale;
  const telemetry = useTelemetry();
  const pathname = usePathname();
  const { setConfig } = useAppLayout();

  const [contacts, setContacts] = useState<ContactRecord[]>(CRM_CONTACTS_SEED);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    CRM_CONTACTS_SEED[0]?.id ?? null,
  );
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<ContactFormState>(defaultFormState);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [announcement, setAnnouncement] = useState("");
  const [draggedContactId, setDraggedContactId] = useState<string | null>(null);
  const [workspaceSearchTerm, setWorkspaceSearchTerm] = useState("");

  useEffect(() => {
    telemetry.capture("page_view", { pathname, view, entity: "crm_contacts" });
  }, [pathname, telemetry, view]);

  const stageLabels = useMemo(() => {
    return CONTACT_STAGE_ORDER.reduce<Record<ContactStage, string>>((acc, stage) => {
      acc[stage] = tContacts(`stages.${stage}`);
      return acc;
    }, {} as Record<ContactStage, string>);
  }, [tContacts]);

  const stageTotals = useMemo(() => {
    return CONTACT_STAGE_ORDER.reduce<Record<ContactStage, number>>((acc, stage) => {
      acc[stage] = contacts.filter((contact) => contact.stage === stage).length;
      return acc;
    }, {} as Record<ContactStage, number>);
  }, [contacts]);

  const navigationItems = useMemo(
    () => [
      { id: "overview", label: tContacts("navigation.overview") },
      { id: "crm", label: tContacts("navigation.crm") },
      { id: "automations", label: tContacts("navigation.automations") },
    ],
    [tContacts],
  );

  const workspaceShortcuts = useMemo(
    () => [
      { id: "dashboards", label: tContacts("navigation.dashboards") },
      { id: "marketing", label: tContacts("navigation.marketing") },
    ],
    [tContacts],
  );

  const memberInitials = useMemo(() => getInitials(CURRENT_MEMBER.name), []);

  const roleLabel = useMemo(() => {
    const key = `header.role.${CURRENT_MEMBER.role}` as Parameters<typeof tContacts>[0];
    const label = tContacts(key);
    return label === key ? CURRENT_MEMBER.role : label;
  }, [tContacts]);

  const totalContacts = contacts.length;
  const activeNavigationId = "crm";

  useEffect(() => {
    setConfig({
      sidebar: {
        activeItemId: activeNavigationId,
        sections: [
          { id: "main", label: tContacts("navigation.main"), items: navigationItems },
          { id: "workspace", label: tContacts("navigation.workspace"), items: workspaceShortcuts },
        ],
        footer: {
          title: tContacts("workspace.title"),
          description: tContacts("workspace.members", { values: { count: totalContacts } }),
        },
      },
      workspace: {
        title: tContacts("workspace.title"),
        board: tContacts("workspace.board"),
        search: {
          value: workspaceSearchTerm,
          placeholder: tContacts("header.searchPlaceholder"),
          telemetryId: "workspace.search",
          onChange: setWorkspaceSearchTerm,
        },
        inviteLabel: tContacts("header.invite"),
        notificationsLabel: tContacts("header.notifications"),
        notificationsIcon: tContacts("header.notificationsIcon"),
        profile: {
          name: CURRENT_MEMBER.name,
          role: roleLabel,
          label: tContacts("header.profile", { values: { name: CURRENT_MEMBER.name } }),
          initials: memberInitials,
        },
      },
    });
  }, [
    activeNavigationId,
    memberInitials,
    navigationItems,
    roleLabel,
    setConfig,
    setWorkspaceSearchTerm,
    tContacts,
    totalContacts,
    workspaceSearchTerm,
    workspaceShortcuts,
  ]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesStage = stageFilter === "all" || contact.stage === stageFilter;
      const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
      if (!normalizedSearch) {
        return matchesStage;
      }
      const matchesSearch = [contact.name, contact.company, contact.email]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase().includes(normalizedSearch));
      return matchesStage && matchesSearch;
    });
  }, [contacts, searchTerm, stageFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedContacts = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredContacts.slice(start, start + PAGE_SIZE);
  }, [filteredContacts, safePage]);

  const contactMap = useMemo(() => {
    return new Map<string, ContactRecord>(contacts.map((contact) => [contact.id, contact]));
  }, [contacts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, stageFilter]);

  useEffect(() => {
    if (!selectedContactId && filteredContacts.length > 0) {
      setSelectedContactId(filteredContacts[0].id);
      return;
    }

    if (selectedContactId && !filteredContacts.some((contact) => contact.id === selectedContactId)) {
      setSelectedContactId(filteredContacts[0]?.id ?? null);
    }
  }, [filteredContacts, selectedContactId]);

  const validationErrors = useMemo<ContactFormErrors>(() => {
    if (!formSubmitted) {
      return {};
    }

    const errors: ContactFormErrors = {};
    if (!formState.name.trim()) {
      errors.name = tContacts("form.validation.nameRequired");
    }
    if (!formState.company.trim()) {
      errors.company = tContacts("form.validation.companyRequired");
    }
    if (!formState.email.trim()) {
      errors.email = tContacts("form.validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      errors.email = tContacts("form.validation.emailInvalid");
    }
    if (!formState.phone.trim()) {
      errors.phone = tContacts("form.validation.phoneRequired");
    }

    return errors;
  }, [formState, formSubmitted, tContacts]);

  const tableColumns = useMemo(() => {
    return [
      {
        id: "name",
        accessor: "name",
        title: tContacts("table.headers.name"),
        render: (row: { id: string }) => {
          const contact = contactMap.get(row.id);
          if (!contact) {
            return null;
          }
          const isSelected = contact.id === selectedContactId;
          return (
            <button
              type="button"
              onClick={() => setSelectedContactId(contact.id)}
              className={`flex flex-col items-start gap-1 text-left ${
                isSelected
                  ? "text-[var(--dx-color-text-primary)]"
                  : "text-[var(--dx-color-text-secondary)]"
              }`}
              aria-pressed={isSelected}
            >
              <span className="text-sm font-semibold">{contact.name}</span>
              <span className="text-xs text-[var(--dx-color-text-tertiary)]">{contact.company}</span>
            </button>
          );
        },
      },
      {
        id: "stage",
        accessor: "stage",
        title: tContacts("table.headers.stage"),
        render: (row: { id: string }) => {
          const contact = contactMap.get(row.id);
          if (!contact) {
            return null;
          }
          const theme = CONTACT_STAGE_THEME[contact.stage];
          return (
            <Label
              color={theme.labelColor}
              kind="fill"
              size="small"
              text={stageLabels[contact.stage]}
              data-telemetry-id={`table-stage-${contact.stage}`}
            />
          );
        },
      },
      {
        id: "owner",
        accessor: "owner",
        title: tContacts("table.headers.owner"),
        render: (row: { id: string }) => {
          const contact = contactMap.get(row.id);
          if (!contact) {
            return null;
          }
          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[var(--dx-color-text-primary)]">{contact.assignedTo}</span>
              <span className="text-xs text-[var(--dx-color-text-tertiary)]">{tContacts("table.labels.owner")}</span>
            </div>
          );
        },
      },
    ];
  }, [contactMap, selectedContactId, stageLabels, tContacts]);

  const tableRows = useMemo(() => {
    return paginatedContacts.map((contact) => ({
      id: contact.id,
      highlighted: contact.id === selectedContactId,
      cells: {
        name: contact.name,
        stage: stageLabels[contact.stage],
        owner: contact.assignedTo,
      },
    }));
  }, [paginatedContacts, selectedContactId, stageLabels]);

  const emptyState = useMemo(
    () => (
      <div role="status" className="px-4 py-6 text-sm text-[var(--dx-color-text-secondary)]">
        {tContacts("table.empty")}
      </div>
    ),
    [tContacts],
  );

  const errorState = useMemo(
    () => (
      <div role="alert" className="px-4 py-6 text-sm text-[var(--color-error)]">
        {tContacts("table.error")}
      </div>
    ),
    [tContacts],
  );

  const selectedContact = selectedContactId ? contactMap.get(selectedContactId) ?? null : null;

  const orderedActivities = useMemo(() => {
    if (!selectedContact) {
      return [];
    }
    return [...selectedContact.activities].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [selectedContact]);

  const resetForm = useCallback(() => {
    setFormState(defaultFormState());
    setFormSubmitted(false);
  }, []);

  const handleStageChange = useCallback(
    (contactId: string, nextStage: ContactStage) => {
      setContacts((previous) => {
        return previous.map((contact) => {
          if (contact.id !== contactId) {
            return contact;
          }
          if (contact.stage === nextStage) {
            return contact;
          }

          const updatedActivities = [
            ...contact.activities,
            {
              id: `activity-${contactId}-${crypto.randomUUID()}`,
              type: "stage" as const,
              actor: CURRENT_MEMBER.name,
              timestamp: new Date().toISOString(),
              summaryKey: "timeline.events.stageChanged",
              summaryValues: {
                actor: CURRENT_MEMBER.name,
                stage: nextStage,
                from: contact.stage,
              },
            },
          ];

          telemetry.capture("crm_contact_stage_changed", {
            contact_id: contact.id,
            org_id: contact.orgId,
            entity: "contact",
            from_stage: contact.stage,
            to_stage: nextStage,
          });

          setAnnouncement(
            tContacts("kanban.announcement.stageChanged", {
              values: {
                name: contact.name,
                stage: stageLabels[nextStage],
              },
            }),
          );

          return {
            ...contact,
            stage: nextStage,
            lastInteraction: new Date().toISOString(),
            activities: updatedActivities,
          };
        });
      });
    },
    [stageLabels, tContacts, telemetry],
  );

  const handleSubmit = useCallback(() => {
    setFormSubmitted(true);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const newContact: ContactRecord = {
      id: `contact-${crypto.randomUUID()}`,
      name: formState.name.trim(),
      company: formState.company.trim(),
      email: formState.email.trim(),
      phone: formState.phone.trim(),
      stage: formState.stage,
      owner: CURRENT_MEMBER.name,
      assignedTo: CURRENT_MEMBER.name,
      orgId: DEMO_ORG_ID,
      lastInteraction: new Date().toISOString(),
      activities: [
        {
          id: `activity-created-${crypto.randomUUID()}`,
          type: "created",
          actor: CURRENT_MEMBER.name,
          timestamp: new Date().toISOString(),
          summaryKey: "timeline.events.created",
          summaryValues: { actor: CURRENT_MEMBER.name },
        },
      ],
    };

    setContacts((prev) => [newContact, ...prev]);
    setSelectedContactId(newContact.id);
    setStageFilter("all");
    setSearchTerm("");
    setCurrentPage(1);
    resetForm();
    setDialogOpen(false);

    telemetry.capture("crm_contact_created", {
      contact_id: newContact.id,
      stage: newContact.stage,
      org_id: newContact.orgId,
      entity: "contact",
    });

    setToastMessage(
      tContacts("toast.created", {
        values: { name: newContact.name },
      }),
    );
    setToastOpen(true);
  }, [formState, resetForm, tContacts, telemetry, validationErrors]);

  const renderActivityMessage = useCallback(
    (summaryKey: string, actor: string, values?: Record<string, string>) => {
      const resolvedValues: Record<string, string> = {
        actor,
        ...values,
      };
      if (values?.stage && stageLabels[values.stage as ContactStage]) {
        resolvedValues.stage = stageLabels[values.stage as ContactStage];
      }
      if (values?.from && stageLabels[values.from as ContactStage]) {
        resolvedValues.from = stageLabels[values.from as ContactStage];
      }
      return tContacts(summaryKey, { values: resolvedValues });
    },
    [stageLabels, tContacts],
  );

  const handleTableReorder = useCallback(
    (from: number, to: number, rows: { id: string }[]) => {
      const pageIds = rows.map((row) => row.id);
      setContacts((previous) => {
        const updated = [...previous];
        const sourceId = pageIds[from];
        const targetId = pageIds[to];
        if (!sourceId || !targetId) {
          return previous;
        }
        const fromIndex = updated.findIndex((contact) => contact.id === sourceId);
        const toIndex = updated.findIndex((contact) => contact.id === targetId);
        if (fromIndex === -1 || toIndex === -1) {
          return previous;
        }
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        return updated;
      });
    },
    [],
  );

  return (
    <>
      <p aria-live="assertive" className="sr-only">
        {announcement}
      </p>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
            <header className="flex flex-col gap-3">
              <DxBadge density="compact" type="indicator" variant="primary">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--dx-color-text-primary)]">
                  {tCommon("badges.crmSprint")}
                </span>
              </DxBadge>
              <div className="flex flex-col gap-3">
                <h1 className="text-3xl font-semibold text-[var(--dx-color-text-primary)]">
                  {tContacts("hero.title")}
                </h1>
                <p className="max-w-3xl text-base text-[var(--dx-color-text-secondary)]">
                  {tContacts("hero.subtitle")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <DxTooltip content={tContacts("actions.newContactTooltip")}
                  telemetryId="tooltip.new_contact"
                >
                  <DxButton
                    variant="primary"
                    size="md"
                    onClick={() => {
                      resetForm();
                      setDialogOpen(true);
                      telemetry.capture("ui_open_overlay", {
                        overlay: "new_contact_dialog",
                        state: "open",
                        entity: "crm_contacts",
                      });
                    }}
                    telemetryId="action.new_contact"
                    aria-haspopup="dialog"
                  >
                    {tContacts("actions.newContact")}
                  </DxButton>
                </DxTooltip>
                <DxButton
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    const nextView = view === "table" ? "kanban" : "table";
                    setView(nextView);
                    telemetry.capture("ui_toggle_view", {
                      from: view,
                      to: nextView,
                      entity: "crm_contacts",
                    });
                  }}
                  telemetryId="action.toggle_view"
                >
                  {view === "table"
                    ? tContacts("actions.viewKanban")
                    : tContacts("actions.viewTable")}
                </DxButton>
              </div>
            </header>

            <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
              <DxCard className="flex flex-col gap-6 bg-[var(--dx-color-surface)] p-6" aria-live="polite">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      <DxBadge density="compact" variant="primary" telemetryId="summary.total_contacts">
                        {tContacts("summary.total", { values: { count: contacts.length } })}
                      </DxBadge>
                      {CONTACT_STAGE_ORDER.map((stage) => {
                        const theme = CONTACT_STAGE_THEME[stage];
                        return (
                          <Label
                            key={stage}
                            color={theme.labelColor}
                            kind="line"
                            size="small"
                            text={tContacts("summary.stageChip", {
                              values: { stage: stageLabels[stage], count: stageTotals[stage] ?? 0 },
                            })}
                            data-telemetry-id={`summary.stage_${stage}`}
                          />
                        );
                      })}
                    </div>
                    <DxTooltip content={tContacts("table.filters.searchPlaceholder")}
                      telemetryId="tooltip.search_contacts"
                    >
                      <div className="flex items-center gap-2">
                        <DxInput
                          name="search"
                          value={searchTerm}
                          onChange={(value) => setSearchTerm(value)}
                          placeholder={tContacts("table.filters.searchPlaceholder")}
                          telemetryId="table.search"
                        />
                        <DxButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchTerm("");
                            setStageFilter("all");
                            telemetry.capture("ui_clear_filters", { entity: "crm_contacts" });
                          }}
                          telemetryId="table.clear_filters"
                        >
                          {tContacts("filters.stageGroupLabel")}
                        </DxButton>
                      </div>
                    </DxTooltip>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-[var(--dx-color-text-primary)]">
                      {tContacts("filters.stageGroupLabel")}
                    </span>
                    <div className="flex flex-wrap gap-2" role="group" aria-label={tContacts("filters.stageGroupLabel")}>
                      <DxButton
                        size="sm"
                        variant={stageFilter === "all" ? "secondary" : "ghost"}
                        onClick={() => {
                          setStageFilter("all");
                          telemetry.capture("ui_filter_stage", { stage: "all", entity: "crm_contacts" });
                        }}
                        telemetryId="filter.stage.all"
                        aria-pressed={stageFilter === "all"}
                      >
                        {tContacts("filters.stages.all")}
                      </DxButton>
                      {CONTACT_STAGE_ORDER.map((stage) => (
                        <DxButton
                          key={stage}
                          size="sm"
                          variant={stageFilter === stage ? "secondary" : "ghost"}
                          onClick={() => {
                            setStageFilter(stage);
                            telemetry.capture("ui_filter_stage", { stage, entity: "crm_contacts" });
                          }}
                          telemetryId={`filter.stage.${stage}`}
                          aria-pressed={stageFilter === stage}
                        >
                          {stageLabels[stage]}
                        </DxButton>
                      ))}
                    </div>
                  </div>
                </div>

                {view === "table" ? (
                  <div className="flex flex-col gap-4">
                    <DxTable
                      columns={tableColumns}
                      rows={tableRows}
                      onReorder={handleTableReorder}
                      emptyState={emptyState}
                      errorState={errorState}
                      density="comfortable"
                      telemetryId="contacts.table"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--dx-color-border)] pt-4 text-sm text-[var(--dx-color-text-secondary)]">
                      <span>
                        {tContacts("table.pagination.summary", {
                          values: {
                            start: paginatedContacts.length > 0 ? (safePage - 1) * PAGE_SIZE + 1 : 0,
                            end: (safePage - 1) * PAGE_SIZE + paginatedContacts.length,
                            total: filteredContacts.length,
                          },
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        <DxButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                          disabled={safePage === 1}
                          telemetryId="table.page_previous"
                        >
                          {tContacts("table.pagination.previous")}
                        </DxButton>
                        <span className="text-xs text-[var(--dx-color-text-tertiary)]">
                          {tContacts("table.pagination.current", { values: { page: safePage, total: totalPages } })}
                        </span>
                        <DxButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                          disabled={safePage === totalPages}
                          telemetryId="table.page_next"
                        >
                          {tContacts("table.pagination.next")}
                        </DxButton>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {CONTACT_STAGE_ORDER.map((stage) => {
                      const stageContacts = filteredContacts.filter((contact) => contact.stage === stage);
                      const theme = CONTACT_STAGE_THEME[stage];
                      const countStyles =
                        theme.headerTextColor.toLowerCase() === "#ffffff"
                          ? { backgroundColor: "rgba(255, 255, 255, 0.18)", color: "#ffffff" }
                          : { backgroundColor: "rgba(255, 255, 255, 0.7)", color: theme.headerTextColor };
                      return (
                        <section
                          key={stage}
                          aria-label={tContacts("kanban.columnLabel", {
                            values: { stage: stageLabels[stage], count: stageContacts.length },
                          })}
                          className="flex min-h-[360px] flex-col overflow-hidden rounded-2xl border shadow-sm"
                          style={{ backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }}
                        >
                          <header
                            className="flex items-start justify-between gap-3 px-4 py-3 shadow-[inset_0_-1px_0_rgba(15,23,42,0.1)]"
                            style={{ backgroundColor: theme.accentColor, color: theme.headerTextColor }}
                          >
                            <div className="flex flex-col">
                              <h2 className="text-sm font-semibold">{stageLabels[stage]}</h2>
                              <span className="text-xs opacity-80">
                                {tContacts("kanban.listLabel", {
                                  values: { stage: stageLabels[stage] },
                                })}
                              </span>
                            </div>
                            <span
                              className="rounded-full px-3 py-1 text-xs font-semibold"
                              style={countStyles}
                            >
                              {stageTotals[stage] ?? 0}
                            </span>
                          </header>
                          <div
                            role="list"
                            aria-label={tContacts("kanban.listLabel", {
                              values: { stage: stageLabels[stage] },
                            })}
                            className="flex flex-1 flex-col gap-3 p-4"
                          >
                            {stageContacts.length === 0 ? (
                              <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/60 bg-white/60 p-6 text-center text-xs font-medium text-[var(--dx-color-text-tertiary)]">
                                {tContacts("kanban.empty")}
                              </div>
                            ) : (
                              stageContacts.map((contact) => {
                                const nextStageIndex = CONTACT_STAGE_ORDER.indexOf(contact.stage) + 1;
                                const nextStage = CONTACT_STAGE_ORDER[nextStageIndex];
                                const cardTheme = CONTACT_STAGE_THEME[contact.stage];
                                return (
                                  <article
                                    key={contact.id}
                                    role="listitem"
                                    className="group flex flex-col gap-3 rounded-2xl border border-transparent bg-white p-4 shadow-[0_6px_14px_rgba(15,23,42,0.12)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(15,23,42,0.16)]"
                                    style={{ borderLeft: `6px solid ${cardTheme.accentColor}` }}
                                    draggable
                                    onDragStart={(event) => {
                                      event.dataTransfer.setData("text/plain", contact.id);
                                      setDraggedContactId(contact.id);
                                    }}
                                    onDragEnd={() => setDraggedContactId(null)}
                                    aria-grabbed={draggedContactId === contact.id}
                                    aria-describedby={`contact-${contact.id}-meta`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedContactId(contact.id)}
                                        className="text-left"
                                      >
                                        <h3 className="text-sm font-semibold text-[var(--dx-color-text-primary)]">
                                          {contact.name}
                                        </h3>
                                        <p className="text-xs text-[var(--dx-color-text-tertiary)]">{contact.company}</p>
                                      </button>
                                      <Label
                                        color={cardTheme.labelColor}
                                        kind="fill"
                                        size="small"
                                        text={stageLabels[contact.stage]}
                                      />
                                    </div>
                                    <div
                                      id={`contact-${contact.id}-meta`}
                                      className="flex flex-wrap items-center gap-2 text-xs text-[var(--dx-color-text-secondary)]"
                                    >
                                      <span>
                                        {tContacts("kanban.lastInteraction", {
                                          values: { timestamp: formatDateTime(contact.lastInteraction, locale) },
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs font-medium text-[var(--dx-color-text-secondary)]">
                                      <span className="rounded-full bg-[rgba(15,23,42,0.06)] px-2 py-1">
                                        {contact.assignedTo}
                                      </span>
                                      <span className="rounded-full bg-[rgba(15,23,42,0.06)] px-2 py-1">
                                        {contact.email}
                                      </span>
                                    </div>
                                    {nextStage ? (
                                      <DxButton
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleStageChange(contact.id, nextStage)}
                                        telemetryId={`kanban.advance_${contact.id}`}
                                        className="self-start"
                                      >
                                        {tContacts("kanban.actions.advance", {
                                          values: { stage: stageLabels[nextStage] },
                                        })}
                                      </DxButton>
                                    ) : (
                                      <Label
                                        color={Label.colors.DONE_GREEN}
                                        kind="fill"
                                        size="small"
                                        text={tContacts("kanban.actions.completed")}
                                      />
                                    )}
                                  </article>
                                );
                              })
                            )}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}
              </DxCard>

              <DxCard className="flex h-full flex-col gap-4 bg-[var(--dx-color-surface)] p-6" aria-live="polite">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--dx-color-text-primary)]">
                    {tContacts("details.title")}
                  </h2>
                  <DxBadge density="compact" variant="ghost">
                    {view === "table" ? tContacts("details.mode.table") : tContacts("details.mode.kanban")}
                  </DxBadge>
                </div>
                {selectedContact ? (
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xl font-semibold text-[var(--dx-color-text-primary)]">{selectedContact.name}</h3>
                      <span className="text-sm text-[var(--dx-color-text-secondary)]">{selectedContact.company}</span>
                    </div>
                    <div className="grid gap-3 text-sm text-[var(--dx-color-text-primary)]">
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wide text-[var(--dx-color-text-tertiary)]">
                          {tContacts("details.stage")}
                        </span>
                        <Label
                          color={CONTACT_STAGE_THEME[selectedContact.stage].labelColor}
                          kind="fill"
                          size="small"
                          text={stageLabels[selectedContact.stage]}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wide text-[var(--dx-color-text-tertiary)]">
                          {tContacts("details.email")}
                        </span>
                        <span>{selectedContact.email}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wide text-[var(--dx-color-text-tertiary)]">
                          {tContacts("details.phone")}
                        </span>
                        <span>{selectedContact.phone}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wide text-[var(--dx-color-text-tertiary)]">
                          {tContacts("details.assigned")}
                        </span>
                        <span>{selectedContact.assignedTo}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wide text-[var(--dx-color-text-tertiary)]">
                          {tContacts("details.lastInteraction")}
                        </span>
                        <span>{formatDateTime(selectedContact.lastInteraction, locale)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <h3 className="text-sm font-semibold text-[var(--dx-color-text-primary)]">
                        {tContacts("timeline.title")}
                      </h3>
                      {orderedActivities.length === 0 ? (
                        <p className="text-xs text-[var(--dx-color-text-tertiary)]">{tContacts("timeline.empty")}</p>
                      ) : (
                        <ol className="flex flex-col gap-3">
                          {orderedActivities.map((activity) => (
                            <li
                              key={activity.id}
                              className="rounded-md border border-[var(--dx-color-border)] bg-[var(--dx-color-page-background)] p-3"
                            >
                              <div className="flex items-center justify-between">
                                <DxBadge density="compact" variant="ghost">
                                  {tContacts(`timeline.types.${activity.type}`)}
                                </DxBadge>
                                <span className="text-xs text-[var(--dx-color-text-tertiary)]">
                                  {formatDateTime(activity.timestamp, locale)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-[var(--dx-color-text-primary)]">
                                {renderActivityMessage(activity.summaryKey, activity.actor, activity.summaryValues)}
                              </p>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 text-sm text-[var(--dx-color-text-tertiary)]">
                    <DxSkeleton height={24} density="compact" />
                    <p>{tContacts("details.empty")}</p>
                  </div>
                )}
              </DxCard>
            </div>

            <footer className="flex flex-col gap-3 pb-10">
              <span className="text-sm text-[var(--dx-color-text-tertiary)]">{tContacts("footer.title")}</span>
              <Link
                href="https://monday.com/vibe"
                className="text-sm font-medium text-[var(--dx-color-accent)] hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {tCommon("footer.docs")}
              </Link>
            </footer>
          </section>
        <DxDialog
          id="new-contact-dialog"
          show={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            telemetry.capture("ui_open_overlay", {
              overlay: "new_contact_dialog",
              state: "close",
              entity: "crm_contacts",
            });
          }}
          size="md"
          title={tContacts("form.title")}
          aria-labelledby="new-contact-title"
        >
          <div className="flex flex-col gap-4 p-6" id="new-contact-title">
            <h2 className="text-xl font-semibold text-[var(--dx-color-text-primary)]">{tContacts("form.title")}</h2>
            <p className="text-sm text-[var(--dx-color-text-secondary)]">{tContacts("form.subtitle")}</p>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
              }}
            >
              <div className="grid gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--dx-color-text-tertiary)]">
                    {tContacts("form.fields.name")}
                  </span>
                  <DxInput
                    name="contact-name"
                    value={formState.name}
                    onChange={(value) => setFormState((prev) => ({ ...prev, name: value }))}
                    telemetryId="form.contact_name"
                    validationStatus={validationErrors.name ? "error" : undefined}
                  />
                  {validationErrors.name ? (
                    <span className="text-xs text-[var(--color-error)]" role="alert">
                      {validationErrors.name}
                    </span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--dx-color-text-tertiary)]">
                    {tContacts("form.fields.company")}
                  </span>
                  <DxInput
                    name="contact-company"
                    value={formState.company}
                    onChange={(value) => setFormState((prev) => ({ ...prev, company: value }))}
                    telemetryId="form.contact_company"
                    validationStatus={validationErrors.company ? "error" : undefined}
                  />
                  {validationErrors.company ? (
                    <span className="text-xs text-[var(--color-error)]" role="alert">
                      {validationErrors.company}
                    </span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--dx-color-text-tertiary)]">
                    {tContacts("form.fields.email")}
                  </span>
                  <DxInput
                    name="contact-email"
                    value={formState.email}
                    onChange={(value) => setFormState((prev) => ({ ...prev, email: value }))}
                    telemetryId="form.contact_email"
                    validationStatus={validationErrors.email ? "error" : undefined}
                  />
                  {validationErrors.email ? (
                    <span className="text-xs text-[var(--color-error)]" role="alert">
                      {validationErrors.email}
                    </span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--dx-color-text-tertiary)]">
                    {tContacts("form.fields.phone")}
                  </span>
                  <DxInput
                    name="contact-phone"
                    value={formState.phone}
                    onChange={(value) => setFormState((prev) => ({ ...prev, phone: value }))}
                    telemetryId="form.contact_phone"
                    validationStatus={validationErrors.phone ? "error" : undefined}
                  />
                  {validationErrors.phone ? (
                    <span className="text-xs text-[var(--color-error)]" role="alert">
                      {validationErrors.phone}
                    </span>
                  ) : null}
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-[var(--dx-color-text-tertiary)]">
                  {tContacts("form.fields.stage")}
                </span>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={tContacts("form.fields.stage")}> 
                  {CONTACT_STAGE_ORDER.map((stage) => (
                    <DxButton
                      key={stage}
                      size="sm"
                      variant={formState.stage === stage ? "secondary" : "ghost"}
                      onClick={(event) => {
                        event.preventDefault();
                        setFormState((prev) => ({ ...prev, stage }));
                      }}
                      telemetryId={`form.stage_${stage}`}
                      aria-pressed={formState.stage === stage}
                    >
                      {stageLabels[stage]}
                    </DxButton>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <DxButton type="submit" variant="primary" telemetryId="form.submit_contact">
                    {tContacts("form.actions.submit")}
                  </DxButton>
                  <DxButton
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      resetForm();
                      setDialogOpen(false);
                      telemetry.capture("ui_open_overlay", {
                        overlay: "new_contact_dialog",
                        state: "close",
                        entity: "crm_contacts",
                      });
                    }}
                    telemetryId="form.cancel_contact"
                  >
                    {tContacts("form.actions.cancel")}
                  </DxButton>
                </div>
                {Object.keys(validationErrors).length > 0 ? (
                  <span className="text-xs text-[var(--color-error)]" role="alert">
                    {tErrors("validation")}
                  </span>
                ) : null}
              </div>
            </form>
          </div>
        </DxDialog>

        <DxToast
          open={toastOpen}
          variant="success"
          onClose={() => setToastOpen(false)}
          telemetryId="toast.crm_contact"
        >
          {toastMessage || tAuth("login.success")}
        </DxToast>
  </>
  );
}