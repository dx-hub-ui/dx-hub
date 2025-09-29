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
import { useTranslation } from "@/i18n/I18nProvider";
import {
  BOARD_COLUMN_ORDER,
  CONTACT_STAGE_VARIANTS,
  CRM_CONTACTS_SEED,
} from "@/crm/mock-data";
import {
  CONTACT_STAGE_ORDER,
  DEMO_ORG_ID,
  type ContactRecord,
  type ContactStage,
} from "@/crm/types";

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

export default function HomePage() {
  const { t: tCommon } = useTranslation("common");
  const contactsDictionary = useTranslation("contacts");
  const { t: tErrors } = useTranslation("errors");
  const { t: tAuth } = useTranslation("auth");
  const tContacts = contactsDictionary.t;
  const locale = contactsDictionary.locale;
  const telemetry = useTelemetry();
  const pathname = usePathname();

  const [contacts, setContacts] = useState<ContactRecord[]>(CRM_CONTACTS_SEED);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    CRM_CONTACTS_SEED[0]?.id ?? null,
  );
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<ContactFormState>(defaultFormState);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [announcement, setAnnouncement] = useState("");
  const [draggedContactId, setDraggedContactId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => window.clearTimeout(timeout);
  }, []);

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
                isSelected ? "text-[#111827]" : "text-[#1f2937]"
              }`}
              aria-pressed={isSelected}
            >
              <span className="text-sm font-semibold">{contact.name}</span>
              <span className="text-xs text-[#6b7280]">{contact.company}</span>
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
          const variant = CONTACT_STAGE_VARIANTS[contact.stage] ?? "secondary";
          return (
            <DxBadge
              density="compact"
              variant={variant}
              telemetryId={`table-stage-${contact.stage}`}
              type="indicator"
            >
              {stageLabels[contact.stage]}
            </DxBadge>
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
              <span className="text-sm font-medium text-[#1f2937]">{contact.assignedTo}</span>
              <span className="text-xs text-[#6b7280]">{tContacts("table.labels.owner")}</span>
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
      <div role="status" className="px-4 py-6 text-sm text-[#4b5563]">
        {tContacts("table.empty")}
      </div>
    ),
    [tContacts],
  );

  const errorState = useMemo(
    () => (
      <div role="alert" className="px-4 py-6 text-sm text-[#b91c1c]">
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
    <main className="min-h-screen bg-[#f5f6f8] text-[#111827]">
      <p aria-live="assertive" className="sr-only">
        {announcement}
      </p>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-3">
          <DxBadge density="compact" type="indicator" variant="primary">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#1f2937]">
              {tCommon("badges.crmSprint")}
            </span>
          </DxBadge>
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold text-[#0f172a]">
              {tContacts("hero.title")}
            </h1>
            <p className="max-w-3xl text-base text-[#334155]">
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
            <DxButton
              as={Link}
              href="/microsites"
              variant="secondary"
              size="md"
              telemetryId="action.open_microsites"
            >
              {tContacts("actions.viewMicrosites")}
            </DxButton>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <DxCard className="flex flex-col gap-6 bg-white p-6" aria-live="polite">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-3">
                  {CONTACT_STAGE_ORDER.map((stage) => (
                    <DxBadge
                      key={stage}
                      density="compact"
                      variant={stage === stageFilter ? "primary" : "secondary"}
                    >
                      {tContacts("summary.stageChip", {
                        values: {
                          stage: stageLabels[stage],
                          count: String(stageTotals[stage] ?? 0),
                        },
                      })}
                    </DxBadge>
                  ))}
                </div>
                <span className="text-sm text-[#64748b]">
                  {tContacts("summary.total", { values: { count: String(contacts.length) } })}
                </span>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <DxInput
                  name="search"
                  placeholder={tContacts("table.filters.searchPlaceholder")}
                  value={searchTerm}
                  onChange={setSearchTerm}
                  telemetryId="input.search_contacts"
                />
                <div className="flex flex-wrap gap-2" role="group" aria-label={tContacts("filters.stageGroupLabel")}>
                  <DxButton
                    variant={stageFilter === "all" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setStageFilter("all")}
                    telemetryId="filter.stage_all"
                  >
                    {tContacts("filters.stages.all")}
                  </DxButton>
                  {CONTACT_STAGE_ORDER.map((stage) => (
                    <DxButton
                      key={stage}
                      variant={stageFilter === stage ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setStageFilter(stage)}
                      telemetryId={`filter.stage_${stage}`}
                    >
                      {stageLabels[stage]}
                    </DxButton>
                  ))}
                </div>
              </div>
            </div>

            {view === "table" ? (
              <>
                <DxTable
                  columns={tableColumns}
                  rows={tableRows}
                  emptyState={emptyState}
                  errorState={errorState}
                  dataState={{ isLoading, isError: false }}
                  telemetryId="table.contacts"
                  onReorder={handleTableReorder}
                />
                {isLoading ? (
                  <div className="grid gap-3" aria-hidden>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <DxSkeleton key={index} height={48} density="compact" />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4 pt-2 text-sm text-[#475569]">
                    <span>
                      {tContacts("table.pagination.summary", {
                        values: {
                          start: String((safePage - 1) * PAGE_SIZE + 1),
                          end: String(Math.min(safePage * PAGE_SIZE, filteredContacts.length)),
                          total: String(filteredContacts.length),
                        },
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <DxButton
                        size="sm"
                        variant="ghost"
                        disabled={safePage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        telemetryId="pagination.previous"
                      >
                        {tContacts("table.pagination.previous")}
                      </DxButton>
                      <span className="text-xs text-[#64748b]">
                        {tContacts("table.pagination.current", {
                          values: {
                            page: String(safePage),
                            total: String(totalPages),
                          },
                        })}
                      </span>
                      <DxButton
                        size="sm"
                        variant="ghost"
                        disabled={safePage === totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        telemetryId="pagination.next"
                      >
                        {tContacts("table.pagination.next")}
                      </DxButton>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {BOARD_COLUMN_ORDER.map((stage) => {
                  const stageContacts = contacts.filter((contact) => contact.stage === stage);
                  return (
                    <section
                      key={stage}
                      className="min-w-[260px] flex-1 rounded-lg bg-[#f8fafc] p-4 shadow-sm"
                      aria-label={tContacts("kanban.columnLabel", {
                        values: { stage: stageLabels[stage], count: String(stageContacts.length) },
                      })}
                      onDragOver={(event) => {
                        event.preventDefault();
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const contactId = event.dataTransfer.getData("text/plain");
                        if (contactId) {
                          handleStageChange(contactId, stage);
                        }
                        setDraggedContactId(null);
                      }}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#0f172a]">
                          {stageLabels[stage]}
                        </span>
                        <DxBadge density="compact" variant="ghost">
                          {stageContacts.length}
                        </DxBadge>
                      </div>
                      <div
                        className="flex flex-col gap-3"
                        role="list"
                        aria-label={tContacts("kanban.listLabel", { values: { stage: stageLabels[stage] } })}
                        data-drop-target={draggedContactId ? "true" : undefined}
                      >
                        {stageContacts.length === 0 ? (
                          <div className="rounded-md border border-dashed border-[#cbd5f5] bg-white p-4 text-center text-xs text-[#64748b]">
                            {tContacts("kanban.empty")}
                          </div>
                        ) : (
                          stageContacts.map((contact) => {
                            const nextStageIndex = CONTACT_STAGE_ORDER.indexOf(contact.stage) + 1;
                            const nextStage = CONTACT_STAGE_ORDER[nextStageIndex];
                            return (
                              <article
                                key={contact.id}
                                role="listitem"
                                className="flex flex-col gap-3 rounded-md bg-white p-4 shadow-sm"
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
                                    <h3 className="text-sm font-semibold text-[#0f172a]">
                                      {contact.name}
                                    </h3>
                                    <p className="text-xs text-[#64748b]">{contact.company}</p>
                                  </button>
                                  <DxBadge density="compact" variant={CONTACT_STAGE_VARIANTS[contact.stage]}>
                                    {stageLabels[contact.stage]}
                                  </DxBadge>
                                </div>
                                <p id={`contact-${contact.id}-meta`} className="text-xs text-[#475569]">
                                  {tContacts("kanban.lastInteraction", {
                                    values: { timestamp: formatDateTime(contact.lastInteraction, locale) },
                                  })}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <DxBadge density="compact" variant="ghost">
                                    {contact.assignedTo}
                                  </DxBadge>
                                  <DxBadge density="compact" variant="ghost">
                                    {contact.email}
                                  </DxBadge>
                                </div>
                                {nextStage ? (
                                  <DxButton
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleStageChange(contact.id, nextStage)}
                                    telemetryId={`kanban.advance_${contact.id}`}
                                  >
                                    {tContacts("kanban.actions.advance", {
                                      values: { stage: stageLabels[nextStage] },
                                    })}
                                  </DxButton>
                                ) : (
                                  <span className="text-xs text-[#16a34a]">
                                    {tContacts("kanban.actions.completed")}
                                  </span>
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

          <DxCard className="flex h-full flex-col gap-4 bg-white p-6" aria-live="polite">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#0f172a]">
                {tContacts("details.title")}
              </h2>
              <DxBadge density="compact" variant="ghost">
                {view === "table" ? tContacts("details.mode.table") : tContacts("details.mode.kanban")}
              </DxBadge>
            </div>
            {selectedContact ? (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-semibold text-[#0f172a]">{selectedContact.name}</h3>
                  <span className="text-sm text-[#475569]">{selectedContact.company}</span>
                </div>
                <div className="grid gap-3 text-sm text-[#1f2937]">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wide text-[#94a3b8]">
                      {tContacts("details.stage")}
                    </span>
                    <DxBadge density="compact" variant={CONTACT_STAGE_VARIANTS[selectedContact.stage]}>
                      {stageLabels[selectedContact.stage]}
                    </DxBadge>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wide text-[#94a3b8]">
                      {tContacts("details.email")}
                    </span>
                    <span>{selectedContact.email}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wide text-[#94a3b8]">
                      {tContacts("details.phone")}
                    </span>
                    <span>{selectedContact.phone}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wide text-[#94a3b8]">
                      {tContacts("details.assigned")}
                    </span>
                    <span>{selectedContact.assignedTo}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wide text-[#94a3b8]">
                      {tContacts("details.lastInteraction")}
                    </span>
                    <span>{formatDateTime(selectedContact.lastInteraction, locale)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold text-[#0f172a]">
                    {tContacts("timeline.title")}
                  </h3>
                  {orderedActivities.length === 0 ? (
                    <p className="text-xs text-[#64748b]">{tContacts("timeline.empty")}</p>
                  ) : (
                    <ol className="flex flex-col gap-3">
                      {orderedActivities.map((activity) => (
                        <li
                          key={activity.id}
                          className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3"
                        >
                          <div className="flex items-center justify-between">
                            <DxBadge density="compact" variant="ghost">
                              {tContacts(`timeline.types.${activity.type}`)}
                            </DxBadge>
                            <span className="text-xs text-[#94a3b8]">
                              {formatDateTime(activity.timestamp, locale)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[#1f2937]">
                            {renderActivityMessage(activity.summaryKey, activity.actor, activity.summaryValues)}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-sm text-[#64748b]">
                <DxSkeleton height={24} density="compact" />
                <p>{tContacts("details.empty")}</p>
              </div>
            )}
          </DxCard>
        </div>

        <footer className="flex flex-col gap-3 pb-10">
          <span className="text-sm text-[#64748b]">{tCommon("footer.docsLabel")}</span>
          <Link
            href="https://monday.com/vibe"
            className="text-sm font-medium text-[#2563eb] hover:underline"
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
          <h2 className="text-xl font-semibold text-[#0f172a]">{tContacts("form.title")}</h2>
          <p className="text-sm text-[#475569]">{tContacts("form.subtitle")}</p>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <div className="grid gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-[#94a3b8]">
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
                  <span className="text-xs text-[#b91c1c]" role="alert">
                    {validationErrors.name}
                  </span>
                ) : null}
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-[#94a3b8]">
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
                  <span className="text-xs text-[#b91c1c]" role="alert">
                    {validationErrors.company}
                  </span>
                ) : null}
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-[#94a3b8]">
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
                  <span className="text-xs text-[#b91c1c]" role="alert">
                    {validationErrors.email}
                  </span>
                ) : null}
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-[#94a3b8]">
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
                  <span className="text-xs text-[#b91c1c]" role="alert">
                    {validationErrors.phone}
                  </span>
                ) : null}
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-[#94a3b8]">
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
                <span className="text-xs text-[#b91c1c]" role="alert">
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
    </main>
  );
}