"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ComponentProps } from "react";
import {
  DxBadge,
  DxButton,
  DxDialog,
  DxInput,
  DxToast,
  DxTooltip,
  useTelemetry,
} from "@dx/ui";
import { useAppLayout } from "@/components/app-shell/AppShell";
import { useTranslation } from "@/i18n/I18nProvider";
import { CRM_CONTACTS_SEED } from "@/crm/mock-data";
import {
  CONTACT_STAGE_ORDER,
  DEMO_ORG_ID,
  type ContactRecord,
  type ContactStage,
} from "@/crm/types";

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

const STAGE_ACCENT_COLORS: Record<ContactStage, string> = {
  prospecting: "#cfd7ff",
  discovery: "#ffcb00",
  negotiation: "#f65f7c",
  won: "#00c875",
  lost: "#8f73ff",
};

const STAGE_HEADER_TEXT: Record<ContactStage, string> = {
  prospecting: "#1f2430",
  discovery: "#1f2430",
  negotiation: "#ffffff",
  won: "#ffffff",
  lost: "#ffffff",
};

type BadgeVariant = ComponentProps<typeof DxBadge>["variant"];

const STAGE_BADGE_VARIANTS: Record<ContactStage, BadgeVariant> = {
  prospecting: "secondary",
  discovery: "primary",
  negotiation: "primary",
  won: "secondary",
  lost: "danger",
};

const VIEW_MODES = ["table", "kanban"] as const;

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
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

  const contactMap = useMemo(() => {
    return new Map<string, ContactRecord>(contacts.map((contact) => [contact.id, contact]));
  }, [contacts]);

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

  const handleSelectContact = useCallback(
    (contactId: string) => {
      setSelectedContactId(contactId);
      setDetailsOpen(true);
      telemetry.capture("ui_open_overlay", {
        overlay: "contact_details_panel",
        state: "open",
        entity: "crm_contacts",
      });
    },
    [telemetry],
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

  const groupedContacts = useMemo(() => {
    const active = filteredContacts.filter((contact) => contact.stage !== "lost");
    const inactive = filteredContacts.filter((contact) => contact.stage === "lost");
    return [
      {
        id: "active",
        title: tContacts("table.groups.active"),
        contacts: active,
      },
      {
        id: "inactive",
        title: tContacts("table.groups.inactive"),
        contacts: inactive,
      },
    ];
  }, [filteredContacts, tContacts]);

  const handleViewChange = useCallback(
    (nextView: "table" | "kanban") => {
      if (nextView === view) {
        return;
      }
      setView(nextView);
      telemetry.capture("ui_toggle_view", {
        from: view,
        to: nextView,
        entity: "crm_contacts",
      });
    },
    [telemetry, view],
  );

  const handleToolbarAction = useCallback(
    (action: string) => {
      telemetry.capture("crm_toolbar_click", {
        action,
        entity: "crm_contacts",
      });
    },
    [telemetry],
  );

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setStageFilter("all");
    telemetry.capture("ui_clear_filters", { entity: "crm_contacts" });
  }, [telemetry]);

  const resetForm = useCallback(() => {
    setFormState(defaultFormState());
    setFormSubmitted(false);
  }, []);

  const openNewContact = useCallback(() => {
    resetForm();
    setDialogOpen(true);
    telemetry.capture("ui_open_overlay", {
      overlay: "new_contact_dialog",
      state: "open",
      entity: "crm_contacts",
    });
  }, [resetForm, telemetry]);

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
    setDetailsOpen(true);
    setStageFilter("all");
    setSearchTerm("");
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
    telemetry.capture("ui_open_overlay", {
      overlay: "contact_details_panel",
      state: "open",
      entity: "crm_contacts",
    });
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

  return (
    <>
      <p aria-live="assertive" className="sr-only">
        {announcement}
      </p>
      <section className="flex flex-col gap-8 pb-12">
        <div className="border-b border-[#d4d9e6] bg-white px-6 pb-10 pt-12 sm:px-10 lg:px-16">
          <div className="flex flex-col gap-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex max-w-3xl flex-col gap-3">
                <h1 className="text-3xl font-semibold text-[#1f2430]">
                  {tContacts("hero.title")}
                </h1>
                <p className="text-base text-[#6b7185]">
                  {tContacts("hero.subtitle")}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-1 rounded-full border border-[#d4d9e6] bg-[#f6f7fb] p-1">
                  {VIEW_MODES.map((mode) => {
                    const isActive = view === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleViewChange(mode)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0073ea] ${
                          isActive ? "bg-white text-[#1f2430]" : "text-[#6b7185] hover:text-[#1f2430]"
                        }`}
                        aria-pressed={isActive}
                      >
                        {mode === "table"
                          ? tContacts("views.table")
                          : tContacts("views.kanban")}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedContact ? (
                    <DxButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectContact(selectedContact.id)}
                      telemetryId="action.open_contact_details"
                    >
                      {tContacts("actions.openDetails")}
                    </DxButton>
                  ) : null}
                  <DxTooltip
                    content={tContacts("actions.newContactTooltip")}
                    telemetryId="tooltip.new_contact"
                  >
                    <DxButton
                      variant="primary"
                      size="sm"
                      onClick={openNewContact}
                      telemetryId="action.new_contact"
                      aria-haspopup="dialog"
                    >
                      {tContacts("actions.newContact")}
                    </DxButton>
                  </DxTooltip>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#6b7185]">
              <span>{tContacts("summary.total", { values: { count: contacts.length } })}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {CONTACT_STAGE_ORDER.map((stage) => (
                <div
                  key={stage}
                  className="flex items-center justify-between rounded-xl border border-[#d4d9e6] bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: STAGE_ACCENT_COLORS[stage] }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#1f2430]">
                        {stageLabels[stage]}
                      </span>
                      <span className="text-xs text-[#6b7185]">
                        {tContacts("summary.stageChip", {
                          values: { stage: stageLabels[stage], count: stageTotals[stage] ?? 0 },
                        })}
                      </span>
                    </div>
                  </div>
                  <span className="text-2xl font-semibold text-[#1f2430]">
                    {stageTotals[stage] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-6 sm:px-10 lg:px-16">
          <div className="flex flex-col gap-4 rounded-2xl border border-[#e2e6f2] bg-white px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <DxInput
                  name="search"
                  value={searchTerm}
                  onChange={(value) => setSearchTerm(value)}
                  placeholder={tContacts("table.filters.searchPlaceholder")}
                  telemetryId="table.search"
                  className="w-full sm:w-64"
                />
                <DxButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToolbarAction("person")}
                  telemetryId="toolbar.person"
                >
                  {tContacts("toolbar.person")}
                </DxButton>
                <DxButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToolbarAction("team")}
                  telemetryId="toolbar.team"
                >
                  {tContacts("toolbar.team")}
                </DxButton>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <DxButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToolbarAction("filter")}
                  telemetryId="toolbar.filter"
                >
                  {tContacts("toolbar.filter")}
                </DxButton>
                <DxButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToolbarAction("sort")}
                  telemetryId="toolbar.sort"
                >
                  {tContacts("toolbar.sort")}
                </DxButton>
                <DxButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToolbarAction("group")}
                  telemetryId="toolbar.group"
                >
                  {tContacts("toolbar.group")}
                </DxButton>
                <DxButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToolbarAction("hide")}
                  telemetryId="toolbar.hide"
                >
                  {tContacts("toolbar.hide")}
                </DxButton>
                <DxButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToolbarAction("more")}
                  telemetryId="toolbar.more"
                >
                  {tContacts("toolbar.more")}
                </DxButton>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#9aa0b9]">
                {tContacts("filters.stageGroupLabel")}
              </span>
              <div
                className="flex flex-wrap items-center gap-1"
                role="group"
                aria-label={tContacts("filters.stageGroupLabel")}
              >
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
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: STAGE_ACCENT_COLORS[stage] }}
                      />
                      {stageLabels[stage]}
                    </span>
                  </DxButton>
                ))}
              </div>
              <DxButton
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                telemetryId="filter.clear"
              >
                {tContacts("filters.reset")}
              </DxButton>
            </div>
          </div>

          {view === "table" ? (
            <div className="flex flex-col gap-6">
              {groupedContacts.map((group) => {
                const accentColor = group.id === "inactive" ? "#9aa0b9" : "#00c875";
                return (
                  <section
                    key={group.id}
                    className="overflow-hidden rounded-2xl border border-[#d4d9e6] bg-white"
                  >
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e6f2] bg-[#f6f7fb] px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: accentColor }}
                        />
                        <div className="flex flex-col">
                          <h2 className="text-sm font-semibold text-[#1f2430]">{group.title}</h2>
                          <span className="text-xs text-[#6b7185]">
                            {tContacts("table.groups.count", { values: { count: group.contacts.length } })}
                          </span>
                        </div>
                      </div>
                      <DxButton
                        variant="ghost"
                        size="sm"
                        onClick={openNewContact}
                        telemetryId={`toolbar.add_contact.${group.id}`}
                      >
                        {tContacts("table.groups.addContact")}
                      </DxButton>
                    </header>
                    {group.contacts.length === 0 ? (
                      <div className="px-6 py-10 text-sm text-[#6b7185]">
                        {tContacts("table.empty")}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#e2e6f2] text-left">
                          <thead className="bg-[#f6f7fb] text-xs font-semibold uppercase tracking-wide text-[#6b7185]">
                            <tr>
                              <th scope="col" className="px-6 py-3 font-semibold">
                                {tContacts("table.headers.contact")}
                              </th>
                              <th scope="col" className="px-6 py-3 font-semibold">
                                {tContacts("table.headers.email")}
                              </th>
                              <th scope="col" className="px-6 py-3 font-semibold">
                                {tContacts("table.headers.timeline")}
                              </th>
                              <th scope="col" className="px-6 py-3 font-semibold">
                                {tContacts("table.headers.accounts")}
                              </th>
                              <th scope="col" className="px-6 py-3 font-semibold">
                                {tContacts("table.headers.deals")}
                              </th>
                              <th scope="col" className="px-6 py-3 font-semibold">
                                {tContacts("table.headers.phone")}
                              </th>
                              <th scope="col" className="px-6 py-3 font-semibold">
                                {tContacts("table.headers.owner")}
                              </th>
                              <th scope="col" className="px-6 py-3 text-right font-semibold">
                                {tContacts("table.headers.actions")}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#f0f2f9]">
                            {group.contacts.map((contact) => {
                              const isSelected = contact.id === selectedContactId;
                              const timelineCount = contact.activities.length;
                              const stageColor = STAGE_ACCENT_COLORS[contact.stage];
                              const stageTextColor = STAGE_HEADER_TEXT[contact.stage];
                              return (
                                <tr
                                  key={contact.id}
                                  className={`cursor-pointer transition-colors ${
                                    isSelected ? "bg-[#eaf3ff]" : "hover:bg-[#f6faff]"
                                  }`}
                                  onClick={() => handleSelectContact(contact.id)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault();
                                      handleSelectContact(contact.id);
                                    }
                                  }}
                                  tabIndex={0}
                                  aria-selected={isSelected}
                                >
                                  <td className="px-6 py-4 align-middle">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-sm font-semibold text-[#0073ea]">
                                        {contact.name}
                                      </span>
                                      <span className="text-xs text-[#6b7185]">{contact.company}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 align-middle text-sm text-[#1f2430]">
                                    {contact.email}
                                  </td>
                                  <td className="px-6 py-4 align-middle">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-[#d4d9e6] bg-white px-3 py-1 text-xs font-medium text-[#1f2430]">
                                      <span className="h-2 w-2 rounded-full bg-[#0073ea]" aria-hidden="true" />
                                      {tContacts("timeline.count", { values: { count: timelineCount } })}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 align-middle">
                                    <span className="inline-flex items-center rounded-full bg-[#f6faff] px-3 py-1 text-xs font-medium text-[#1f2430]">
                                      {contact.company}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 align-middle">
                                    <span
                                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                                      style={{ backgroundColor: `${stageColor}1a`, color: stageTextColor, border: `1px solid ${stageColor}` }}
                                    >
                                      {stageLabels[contact.stage]}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 align-middle text-sm text-[#1f2430]">
                                    {contact.phone}
                                  </td>
                                  <td className="px-6 py-4 align-middle text-sm text-[#1f2430]">
                                    {contact.assignedTo}
                                  </td>
                                  <td className="px-6 py-4 align-middle text-right">
                                    <DxButton
                                      variant="ghost"
                                      size="sm"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleToolbarAction("row.more");
                                      }}
                                      telemetryId={`table.row.more.${contact.id}`}
                                    >
                                      {tContacts("table.actions.more")}
                                    </DxButton>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {CONTACT_STAGE_ORDER.map((stage) => {
                const stageContacts = filteredContacts.filter((contact) => contact.stage === stage);
                const headerColor = STAGE_ACCENT_COLORS[stage];
                const headerText = STAGE_HEADER_TEXT[stage];
                return (
                  <section
                    key={stage}
                    aria-label={tContacts("kanban.columnLabel", {
                      values: { stage: stageLabels[stage], count: stageContacts.length },
                    })}
                    className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-[#d4d9e6] bg-white"
                  >
                    <header
                      className="flex items-center justify-between px-4 py-3"
                      style={{ backgroundColor: headerColor, color: headerText }}
                    >
                      <div className="flex flex-col">
                        <h2 className="text-sm font-semibold">{stageLabels[stage]}</h2>
                        <span className="text-xs opacity-80">
                          {tContacts("kanban.listLabel", { values: { stage: stageLabels[stage] } })}
                        </span>
                      </div>
                      <span className="text-sm font-semibold">
                        {stageTotals[stage] ?? 0}
                      </span>
                    </header>
                    <div
                      role="list"
                      aria-label={tContacts("kanban.listLabel", {
                        values: { stage: stageLabels[stage] },
                      })}
                      className="flex flex-1 flex-col gap-3 px-4 py-4"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const contactId = event.dataTransfer.getData("text/plain");
                        if (contactId) {
                          handleStageChange(contactId, stage);
                        }
                      }}
                    >
                      {stageContacts.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-[#d4d9e6] bg-[#f6f7fb] px-4 py-6 text-xs text-[#6b7185]">
                          {tContacts("kanban.empty")}
                        </p>
                      ) : (
                        stageContacts.map((contact) => {
                          const nextStageIndex = CONTACT_STAGE_ORDER.indexOf(contact.stage) + 1;
                          const nextStage = CONTACT_STAGE_ORDER[nextStageIndex];
                          return (
                            <article
                              key={contact.id}
                              role="listitem"
                              className={`flex flex-col gap-3 rounded-xl border border-[#e2e6f2] bg-white p-4 transition-colors ${
                                draggedContactId === contact.id ? "border-[#0073ea]" : "hover:border-[#c7ccda]"
                              }`}
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
                                  onClick={() => handleSelectContact(contact.id)}
                                  className="text-left"
                                >
                                  <h3 className="text-sm font-semibold text-[#1f2430]">{contact.name}</h3>
                                  <p className="text-xs text-[#6b7185]">{contact.company}</p>
                                </button>
                                <span
                                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                                  style={{ backgroundColor: `${headerColor}1a`, color: headerText }}
                                >
                                  {stageLabels[contact.stage]}
                                </span>
                              </div>
                              <p id={`contact-${contact.id}-meta`} className="text-xs text-[#6b7185]">
                                {tContacts("kanban.lastInteraction", {
                                  values: { timestamp: formatDateTime(contact.lastInteraction, locale) },
                                })}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center rounded-full bg-[#f6f7fb] px-3 py-1 text-xs font-medium text-[#1f2430]">
                                  {contact.assignedTo}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-[#f6f7fb] px-3 py-1 text-xs font-medium text-[#1f2430]">
                                  {contact.email}
                                </span>
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
                                <span className="text-xs font-semibold text-[#00c875]">
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
        </div>

        <footer className="flex flex-col gap-3 px-6 pb-4 text-sm text-[#6b7185] sm:px-10 lg:px-16">
          <span>{tContacts("footer.title")}</span>
          <Link
            href="https://monday.com/vibe"
            className="w-fit text-sm font-medium text-[#0073ea] hover:underline"
          >
            {tContacts("footer.link")}
          </Link>
        </footer>
      </section>
        {detailsOpen && selectedContact && (
          <DxDialog
            id="contact-details-dialog"
            show={detailsOpen}
            onClose={() => {
              setDetailsOpen(false);
              telemetry.capture("ui_open_overlay", {
                overlay: "contact_details_panel",
                state: "close",
                entity: "crm_contacts",
              });
            }}
            size="sm"
            classNames={{
              modal:
                "fixed inset-y-0 right-0 h-full w-[420px] max-w-[420px] rounded-none border-l border-[#d4d9e6] shadow-none !bg-white !p-0",
            }}
            aria-labelledby="contact-details-title"
          >
            <div className="flex h-full flex-col bg-white" id="contact-details-title">
              <header className="flex flex-col gap-3 border-b border-[#d4d9e6] bg-[#f6f7fb] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#9aa0b9]">
                      {tContacts("details.title")}
                    </span>
                    <h2 className="text-2xl font-semibold text-[#1f2430]">{selectedContact.name}</h2>
                    <span className="text-sm text-[#6b7185]">{selectedContact.company}</span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <DxBadge density="compact" variant={STAGE_BADGE_VARIANTS[selectedContact.stage]}>
                      {stageLabels[selectedContact.stage]}
                    </DxBadge>
                    <DxBadge density="compact" variant="ghost">
                      {view === "table"
                        ? tContacts("details.mode.table")
                        : tContacts("details.mode.kanban")}
                    </DxBadge>
                  </div>
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-6 overflow-y-auto bg-white px-6 py-6">
                <div className="grid gap-3">
                  <div className="flex flex-col gap-2 rounded-xl border border-[#e2e6f2] bg-[#f9faff] px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#9aa0b9]">
                      {tContacts("details.stage")}
                    </span>
                    <DxBadge density="compact" variant={STAGE_BADGE_VARIANTS[selectedContact.stage]}>
                      {stageLabels[selectedContact.stage]}
                    </DxBadge>
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl border border-[#e2e6f2] bg-[#f9faff] px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#9aa0b9]">
                      {tContacts("details.email")}
                    </span>
                    <span className="text-sm font-medium text-[#1f2430]">{selectedContact.email}</span>
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl border border-[#e2e6f2] bg-[#f9faff] px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#9aa0b9]">
                      {tContacts("details.phone")}
                    </span>
                    <span className="text-sm font-medium text-[#1f2430]">{selectedContact.phone}</span>
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl border border-[#e2e6f2] bg-[#f9faff] px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#9aa0b9]">
                      {tContacts("details.assigned")}
                    </span>
                    <span className="text-sm font-medium text-[#1f2430]">{selectedContact.assignedTo}</span>
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl border border-[#e2e6f2] bg-[#f9faff] px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#9aa0b9]">
                      {tContacts("details.lastInteraction")}
                    </span>
                    <span className="text-sm font-medium text-[#1f2430]">
                      {formatDateTime(selectedContact.lastInteraction, locale)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#1f2430]">
                      {tContacts("timeline.title")}
                    </h3>
                    <DxBadge density="compact" variant="ghost">
                      {tContacts("timeline.count", { values: { count: orderedActivities.length } })}
                    </DxBadge>
                  </div>
                  {orderedActivities.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[#d4d9e6] bg-[#f9faff] px-4 py-6 text-xs text-[#9aa0b9]">
                      {tContacts("timeline.empty")}
                    </p>
                  ) : (
                    <ol className="flex flex-col gap-3">
                      {orderedActivities.map((activity) => (
                        <li
                          key={activity.id}
                          className="rounded-xl border border-[#e2e6f2] bg-[#f6f7fb] px-4 py-3"
                        >
                          <div className="flex items-center justify-between">
                            <DxBadge density="compact" variant="ghost">
                              {tContacts(`timeline.types.${activity.type}`)}
                            </DxBadge>
                            <span className="text-xs text-[#9aa0b9]">
                              {formatDateTime(activity.timestamp, locale)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[#1f2430]">
                            {renderActivityMessage(activity.summaryKey, activity.actor, activity.summaryValues)}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </div>
          </DxDialog>
        )}
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
            <h2 className="text-xl font-semibold text-[#1f2430]">{tContacts("form.title")}</h2>
            <p className="text-sm text-[#6b7185]">{tContacts("form.subtitle")}</p>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
              }}
            >
              <div className="grid gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-[#9aa0b9]">
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
                    <span className="text-xs text-[#e2445c]" role="alert">
                      {validationErrors.name}
                    </span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-[#9aa0b9]">
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
                    <span className="text-xs text-[#e2445c]" role="alert">
                      {validationErrors.company}
                    </span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-[#9aa0b9]">
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
                    <span className="text-xs text-[#e2445c]" role="alert">
                      {validationErrors.email}
                    </span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-[#9aa0b9]">
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
                    <span className="text-xs text-[#e2445c]" role="alert">
                      {validationErrors.phone}
                    </span>
                  ) : null}
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-[#9aa0b9]">
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
                  <span className="text-xs text-[#e2445c]" role="alert">
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