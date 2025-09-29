"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import QRCode from "qrcode";
import {
  DxBadge,
  DxButton,
  DxCard,
  DxDialog,
  DxInput,
  DxTable,
  DxToast,
  DxTooltip,
  useTelemetry,
  type DxTableColumn,
  type DxTableRow,
} from "@dx/ui";
import {
  MICROSITE_ACTIVITIES,
  MICROSITE_DOWNLINES,
  MICROSITE_LEADS,
  MICROSITE_MEMBERS,
  MICROSITES_SEED,
  canEditMicrosite,
  createMicrositeId,
  DEMO_ORG_ID,
} from "@/microsites/mock-data";
import { MICROSITE_LEADS_STORAGE_KEY } from "@/microsites/storage";
import type {
  MicrositeActivity,
  MicrositeLead,
  MicrositeMember,
  MicrositeRecord,
  MicrositeRole,
} from "@/microsites/types";
import { useTranslation } from "@/i18n/I18nProvider";

const DEFAULT_MEMBER_ID = "member-owner";

type DialogMode = "create" | "edit";

type MicrositeFormState = {
  title: string;
  slug: string;
  headline: string;
  description: string;
  showContactPhone: boolean;
  enableCaptcha: boolean;
  theme: "light" | "dark";
};

type FormErrors = Partial<Record<keyof MicrositeFormState, string>>;

type NotificationLog = {
  id: string;
  micrositeId: string;
  createdAt: string;
  channel: "email" | "in-app";
  summary: string;
};

function defaultMicrositeForm(): MicrositeFormState {
  return {
    title: "",
    slug: "",
    headline: "",
    description: "",
    showContactPhone: true,
    enableCaptcha: false,
    theme: "light",
  };
}

function slugify(input: string) {
  return input
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatDateTime(value: string | null, locale: string) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function getMicrositeUrl(record: MicrositeRecord) {
  return `/m/${record.orgId}/${record.slug}`;
}

function resolveRoleLabel(role: MicrositeRole, t: (key: string) => string) {
  switch (role) {
    case "owner":
      return t("roles.owner");
    case "leader":
      return t("roles.leader");
    case "rep":
    default:
      return t("roles.rep");
  }
}

function getMemberDownline(member: MicrositeMember) {
  if (member.role === "owner") {
    return MICROSITE_MEMBERS.filter((item) => item.id !== member.id).map((item) => item.id);
  }

  return MICROSITE_DOWNLINES[member.id] ?? [];
}

export default function MicrositesPage() {
  const telemetry = useTelemetry();
  const { t: tCommon } = useTranslation("common");
  const micrositesDictionary = useTranslation("microsites");
  const tMicrosites = micrositesDictionary.t;
  const locale = micrositesDictionary.locale;

  const [activeMemberId, setActiveMemberId] = useState(DEFAULT_MEMBER_ID);
  const [microsites, setMicrosites] = useState<MicrositeRecord[]>(MICROSITES_SEED);
  const [leads, setLeads] = useState<MicrositeLead[]>(MICROSITE_LEADS);
  const [activities, setActivities] = useState<MicrositeActivity[]>(MICROSITE_ACTIVITIES);
  const [selectedMicrositeId, setSelectedMicrositeId] = useState<string | null>(MICROSITES_SEED[0]?.id ?? null);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<MicrositeFormState>(defaultMicrositeForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastOpen, setToastOpen] = useState(false);
  const [notificationLog, setNotificationLog] = useState<NotificationLog[]>([]);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const activeMember = useMemo(
    () => MICROSITE_MEMBERS.find((member) => member.id === activeMemberId) ?? MICROSITE_MEMBERS[0],
    [activeMemberId],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(MICROSITE_LEADS_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as MicrositeLead[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return;
      }

      setLeads((current) => {
        const existingIds = new Set(current.map((lead) => lead.id));
        const merged = [...current];
        parsed.forEach((lead) => {
          if (!existingIds.has(lead.id)) {
            merged.push(lead);
            const actorName =
              MICROSITE_MEMBERS.find((member) => member.id === lead.assignedMemberId)?.name ?? "Equipe";
            const summary = tMicrosites("activity.leadViaMicrosite", { values: { name: lead.name } });

            setActivities((activityState) => [
              {
                id: `activity-${lead.id}`,
                micrositeId: lead.micrositeId,
                type: "lead",
                createdAt: lead.createdAt,
                actorId: lead.assignedMemberId,
                actorName,
                summary,
              },
              ...activityState,
            ]);

            setMicrosites((records) =>
              records.map((record) =>
                record.id === lead.micrositeId
                  ? {
                      ...record,
                      totalLeads: record.totalLeads + 1,
                      lastLeadAt: lead.createdAt,
                    }
                  : record,
              ),
            );

            setNotificationLog((log) => [
              {
                id: `${lead.id}-email`,
                micrositeId: lead.micrositeId,
                createdAt: lead.createdAt,
                channel: "email",
                summary: tMicrosites("notifications.newLeadEmail", {
                  values: { name: lead.name },
                }),
              },
              {
                id: `${lead.id}-inapp`,
                micrositeId: lead.micrositeId,
                createdAt: lead.createdAt,
                channel: "in-app",
                summary: tMicrosites("notifications.newLeadInApp", {
                  values: { name: lead.name },
                }),
              },
              ...log,
            ]);
          }
        });
        return merged;
      });

      window.localStorage.removeItem(MICROSITE_LEADS_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to hydrate microsite leads", error);
    }
  }, [tMicrosites]);

  useEffect(() => {
    telemetry.capture("page_view", { pathname: "/microsites", entity: "microsites" });
  }, [telemetry]);

  useEffect(() => {
    if (selectedMicrositeId) {
      return;
    }

    if (microsites.length > 0) {
      setSelectedMicrositeId(microsites[0].id);
    }
  }, [microsites, selectedMicrositeId]);

  const filteredMicrosites = useMemo(() => {
    if (activeMember.role === "owner") {
      return microsites;
    }

    if (activeMember.role === "leader") {
      const downline = getMemberDownline(activeMember);
      return microsites.filter((record) => record.ownerId === activeMember.id || downline.includes(record.ownerId));
    }

    return microsites.filter((record) => record.ownerId === activeMember.id);
  }, [activeMember, microsites]);

  const selectedMicrosite = filteredMicrosites.find((record) => record.id === selectedMicrositeId) ?? filteredMicrosites[0] ?? null;

  const columns = useMemo<DxTableColumn[]>(
    () => [
      {
        id: "title",
        title: tMicrosites("table.columns.title"),
        accessor: "title",
        render: (row: DxTableRow) => row.cells.title as ReactNode,
      },
      {
        id: "owner",
        title: tMicrosites("table.columns.owner"),
        accessor: "owner",
        render: (row: DxTableRow) => row.cells.owner as ReactNode,
      },
      {
        id: "status",
        title: tMicrosites("table.columns.status"),
        accessor: "status",
        render: (row: DxTableRow) => row.cells.status as ReactNode,
      },
      {
        id: "leads",
        title: tMicrosites("table.columns.leads"),
        accessor: "leads",
      },
      {
        id: "updated",
        title: tMicrosites("table.columns.updated"),
        accessor: "updated",
      },
      {
        id: "actions",
        title: tMicrosites("table.columns.actions"),
        accessor: "actions",
        render: (row: DxTableRow) => row.cells.actions as ReactNode,
      },
    ],
    [tMicrosites],
  );

  const openToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastOpen(true);
  }, []);

  function handleCreateMicrosite() {
    setDialogMode("create");
    setDialogOpen(true);
    setFormErrors({});
    setFormState({
      ...defaultMicrositeForm(),
      showContactPhone: true,
      enableCaptcha: true,
    });
  }

  const handleEditMicrosite = useCallback((record: MicrositeRecord) => {
    setDialogMode("edit");
    setDialogOpen(true);
    setFormErrors({});
    setFormState({
      title: record.title,
      slug: record.slug,
      headline: record.headline,
      description: record.description,
      showContactPhone: record.showContactPhone,
      enableCaptcha: record.enableCaptcha,
      theme: record.theme,
    });
    setSelectedMicrositeId(record.id);
  }, []);

  function validateForm(nextState: MicrositeFormState, currentId?: string): boolean {
    const errors: FormErrors = {};

    if (!nextState.title.trim()) {
      errors.title = tMicrosites("form.errors.required");
    }

    if (!nextState.slug.trim()) {
      errors.slug = tMicrosites("form.errors.required");
    } else if (!/^([a-z0-9]+(-[a-z0-9]+)*)$/.test(nextState.slug)) {
      errors.slug = tMicrosites("form.errors.slugFormat");
    } else if (microsites.some((record) => record.slug === nextState.slug && record.id !== currentId)) {
      errors.slug = tMicrosites("form.errors.slugUnique");
    }

    if (!nextState.headline.trim()) {
      errors.headline = tMicrosites("form.errors.required");
    }

    if (!nextState.description.trim()) {
      errors.description = tMicrosites("form.errors.required");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSaveMicrosite() {
    const currentRecord = dialogMode === "edit" ? microsites.find((record) => record.id === selectedMicrositeId) : null;
    const currentId = currentRecord?.id;
    const nextState = { ...formState, slug: slugify(formState.slug || formState.title) };

    if (!validateForm(nextState, currentId)) {
      return;
    }

    if (dialogMode === "create") {
      const id = createMicrositeId();
      const createdAt = new Date().toISOString();
      const record: MicrositeRecord = {
        id,
        orgId: DEMO_ORG_ID,
        ownerId: activeMember.id,
        ownerName: activeMember.name,
        ownerRole: activeMember.role,
        slug: nextState.slug,
        title: nextState.title,
        headline: nextState.headline,
        description: nextState.description,
        status: "draft",
        theme: nextState.theme,
        lastPublishedAt: null,
        totalLeads: 0,
        lastLeadAt: null,
        showContactPhone: nextState.showContactPhone,
        enableCaptcha: nextState.enableCaptcha,
      };

      setMicrosites((current) => [record, ...current]);
      setActivities((current) => [
        {
          id: `activity-${id}`,
          micrositeId: id,
          type: "updated",
          createdAt,
          actorId: activeMember.id,
          actorName: activeMember.name,
          summary: tMicrosites("activity.created", { values: { title: record.title } }),
        },
        ...current,
      ]);
      setSelectedMicrositeId(id);
      telemetry.capture("microsite_created", {
        org_id: DEMO_ORG_ID,
        member_id: activeMember.id,
        role: activeMember.role,
        slug: record.slug,
      });
      openToast(tMicrosites("toast.created"));
    } else if (currentRecord) {
      setMicrosites((current) =>
        current.map((record) =>
          record.id === currentRecord.id
            ? {
                ...record,
                title: nextState.title,
                slug: nextState.slug,
                headline: nextState.headline,
                description: nextState.description,
                showContactPhone: nextState.showContactPhone,
                enableCaptcha: nextState.enableCaptcha,
                theme: nextState.theme,
              }
            : record,
        ),
      );
      setActivities((current) => [
        {
          id: `activity-update-${currentRecord.id}-${Date.now()}`,
          micrositeId: currentRecord.id,
          type: "updated",
          createdAt: new Date().toISOString(),
          actorId: activeMember.id,
          actorName: activeMember.name,
          summary: tMicrosites("activity.updated", { values: { title: nextState.title } }),
        },
        ...current,
      ]);
      openToast(tMicrosites("toast.updated"));
    }

    setDialogOpen(false);
  }

  const handlePublishMicrosite = useCallback(
    (record: MicrositeRecord) => {
      if (!canEditMicrosite(activeMember.id, record)) {
        return;
      }

      const publishedAt = new Date().toISOString();
    setMicrosites((current) =>
      current.map((item) =>
        item.id === record.id
          ? {
              ...item,
              status: "published",
              lastPublishedAt: publishedAt,
            }
          : item,
      ),
    );

    setActivities((current) => [
      {
        id: `activity-publish-${record.id}-${publishedAt}`,
        micrositeId: record.id,
        type: "published",
        createdAt: publishedAt,
        actorId: activeMember.id,
        actorName: activeMember.name,
        summary: tMicrosites("activity.published", { values: { title: record.title } }),
      },
      ...current,
    ]);

      telemetry.capture("microsite_published", {
        org_id: record.orgId,
        microsite_id: record.id,
        slug: record.slug,
        member_id: activeMember.id,
        role: activeMember.role,
      });

      openToast(tMicrosites("toast.published"));
    },
    [activeMember, openToast, tMicrosites, telemetry],
  );

  const rows = useMemo<DxTableRow[]>(
    () =>
      filteredMicrosites.map((record): DxTableRow => ({
        id: record.id,
        highlighted: selectedMicrosite?.id === record.id,
        cells: {
          title: (
            <button
              type="button"
              className="flex w-full flex-col items-start gap-1 text-left"
              onClick={() => setSelectedMicrositeId(record.id)}
              aria-label={tMicrosites("actions.openDetails", { values: { title: record.title } })}
            >
              <span className="text-sm font-medium text-[#0f172a]">{record.title}</span>
              <span className="text-xs text-[#475569]">{getMicrositeUrl(record)}</span>
            </button>
          ),
          owner: (
            <div className="flex flex-col gap-1">
              <span className="text-sm text-[#0f172a]">{record.ownerName}</span>
              <span className="text-xs text-[#475569]">{resolveRoleLabel(record.ownerRole, tMicrosites)}</span>
            </div>
          ),
          status: (
            <DxBadge
              size="sm"
              variant={record.status === "published" ? "primary" : record.status === "draft" ? "secondary" : "ghost"}
            >
              {tMicrosites(`status.${record.status}`)}
            </DxBadge>
          ),
          leads: (
            <span className="text-sm text-[#0f172a]">
              {record.totalLeads}
              <span className="ml-1 text-xs text-[#475569]">
                {tMicrosites("table.lastLead", {
                  values: { value: formatDateTime(record.lastLeadAt, locale) },
                })}
              </span>
            </span>
          ),
          updated: <span className="text-sm text-[#0f172a]">{formatDateTime(record.lastPublishedAt, locale)}</span>,
          actions: (
            <div className="flex flex-wrap items-center gap-2">
              <DxButton
                size="sm"
                variant="ghost"
                onClick={() => handleEditMicrosite(record)}
                disabled={!canEditMicrosite(activeMember.id, record)}
              >
                {tMicrosites("actions.edit")}
              </DxButton>
              <DxButton
                size="sm"
                variant="secondary"
                onClick={() => handlePublishMicrosite(record)}
                disabled={!canEditMicrosite(activeMember.id, record)}
              >
                {record.status === "published" ? tMicrosites("actions.republish") : tMicrosites("actions.publish")}
              </DxButton>
              <DxTooltip content={tMicrosites("actions.openPublic")}>
                <Link href={getMicrositeUrl(record)} target="_blank" rel="noreferrer" className="text-sm text-[#2563eb]">
                  {tMicrosites("actions.view")}
                </Link>
              </DxTooltip>
            </div>
          ),
        },
      })),
    [
      activeMember.id,
      filteredMicrosites,
      handleEditMicrosite,
      handlePublishMicrosite,
      locale,
      selectedMicrosite?.id,
      tMicrosites,
    ],
  );

  async function handleDownloadQr(record: MicrositeRecord, format: "png" | "svg") {
    if (typeof window === "undefined") {
      return;
    }

    setIsGeneratingQr(true);
    try {
      const url = `${window.location.origin}${getMicrositeUrl(record)}`;
      const fileName = `${record.slug}.${format}`;

      if (format === "png") {
        const dataUrl = await QRCode.toDataURL(url, { width: 512, margin: 2 });
        const element = document.createElement("a");
        element.href = dataUrl;
        element.download = fileName;
        element.click();
      } else {
        const svgMarkup = await QRCode.toString(url, { type: "svg", margin: 2 });
        const blob = new Blob([svgMarkup], { type: "image/svg+xml" });
        const element = document.createElement("a");
        element.href = URL.createObjectURL(blob);
        element.download = fileName;
        element.click();
      }

      telemetry.capture("microsite_qr_downloaded", {
        microsite_id: record.id,
        format,
        slug: record.slug,
      });
      openToast(tMicrosites("toast.qrGenerated"));
    } catch (error) {
      console.error("Failed to generate QR", error);
      openToast(tMicrosites("toast.qrError"));
    } finally {
      setIsGeneratingQr(false);
    }
  }

  function renderRoleSwitcher() {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {MICROSITE_MEMBERS.map((member) => (
          <DxButton
            key={member.id}
            size="sm"
            variant={member.id === activeMember.id ? "primary" : "ghost"}
            onClick={() => {
              setActiveMemberId(member.id);
              telemetry.capture("ui_toggle_view", {
                entity: "microsites_member",
                view: member.id,
              });
            }}
          >
            {member.name}
          </DxButton>
        ))}
      </div>
    );
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[#0f172a]">{tMicrosites("page.title")}</h1>
          <p className="text-sm text-[#475569]">{tMicrosites("page.subtitle")}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569]">
            <span>{tMicrosites("page.activeMember", { values: { name: activeMember.name } })}</span>
            <DxBadge size="sm" variant="secondary">
              {resolveRoleLabel(activeMember.role, tMicrosites)}
            </DxBadge>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <DxButton size="md" onClick={handleCreateMicrosite}>
            {tMicrosites("actions.newMicrosite")}
          </DxButton>
          <DxTooltip content={tMicrosites("actions.previewStorybook")}>
            <Link className="text-sm text-[#2563eb]" href="/storybook/index.html" target="_blank" rel="noreferrer">
              {tMicrosites("actions.openStorybook")}
            </Link>
          </DxTooltip>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-medium text-[#0f172a]">{tMicrosites("page.roleSwitcher")}</h2>
          {renderRoleSwitcher()}
        </div>
        <DxCard className="flex flex-col gap-4 bg-white">
          <DxTable
            columns={columns}
            rows={rows}
            telemetryId="microsites-table"
            dataState={{ isLoading: false, isError: false }}
            emptyState={
              <div className="px-4 py-6 text-sm text-[#64748b]">
                {tMicrosites("empty.noMicrosites")}
              </div>
            }
            errorState={
              <div role="alert" className="px-4 py-6 text-sm text-[#b91c1c]">
                {tMicrosites("errors.table")}
              </div>
            }
          />
        </DxCard>
      </section>

      {selectedMicrosite ? (
        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <DxCard className="flex flex-col gap-5 bg-white" padding="large">
            <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold text-[#0f172a]">{selectedMicrosite.title}</h3>
                <p className="text-sm text-[#475569]">{selectedMicrosite.headline}</p>
                <span className="text-xs text-[#475569]">{selectedMicrosite.description}</span>
              </div>
              <div className="flex flex-col items-start gap-2">
                <DxButton
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDownloadQr(selectedMicrosite, "png")}
                  disabled={isGeneratingQr}
                >
                  {tMicrosites("actions.downloadPng")}
                </DxButton>
                <DxButton
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownloadQr(selectedMicrosite, "svg")}
                  disabled={isGeneratingQr}
                >
                  {tMicrosites("actions.downloadSvg")}
                </DxButton>
              </div>
            </header>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#475569]">{tMicrosites("details.status")}</span>
                <DxBadge size="sm" variant={selectedMicrosite.status === "published" ? "primary" : "secondary"}>
                  {tMicrosites(`status.${selectedMicrosite.status}`)}
                </DxBadge>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#475569]">{tMicrosites("details.lastPublished")}</span>
                <span className="text-sm text-[#0f172a]">{formatDateTime(selectedMicrosite.lastPublishedAt, locale)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#475569]">{tMicrosites("details.leads")}</span>
                <span className="text-sm text-[#0f172a]">{selectedMicrosite.totalLeads}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#475569]">{tMicrosites("details.lastLead")}</span>
                <span className="text-sm text-[#0f172a]">{formatDateTime(selectedMicrosite.lastLeadAt, locale)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-[#0f172a]">{tMicrosites("details.share")}</span>
              <div className="flex flex-wrap items-center gap-3">
                <code className="rounded border border-[#cbd5f5] bg-[#f8fafc] px-3 py-1 text-xs text-[#0f172a]">
                  {getMicrositeUrl(selectedMicrosite)}
                </code>
                <Link className="text-sm text-[#2563eb]" href={getMicrositeUrl(selectedMicrosite)} target="_blank" rel="noreferrer">
                  {tMicrosites("actions.openPublic")}
                </Link>
              </div>
            </div>
          </DxCard>
          <DxCard className="flex flex-col gap-4 bg-white" padding="large">
            <h3 className="text-base font-semibold text-[#0f172a]">{tMicrosites("activity.title")}</h3>
            <div className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">
              {activities
                .filter((activity) => activity.micrositeId === selectedMicrosite.id)
                .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
                .map((activity) => (
                  <article key={activity.id} className="flex flex-col gap-1 rounded-md border border-[#e2e8f0] p-3">
                    <div className="flex items-center justify-between text-xs text-[#475569]">
                      <span>{formatDateTime(activity.createdAt, locale)}</span>
                      <span>{activity.actorName}</span>
                    </div>
                    <p className="text-sm text-[#0f172a]">{activity.summary}</p>
                  </article>
                ))}
            </div>
          </DxCard>
        </section>
      ) : (
        <DxCard className="bg-white p-6 text-sm text-[#475569]">{tMicrosites("empty.noMicrosites")}</DxCard>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <DxCard className="flex flex-col gap-4 bg-white" padding="large">
          <h3 className="text-base font-semibold text-[#0f172a]">{tMicrosites("leads.title")}</h3>
          <div className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-2">
            {leads
              .filter((lead) => !selectedMicrosite || lead.micrositeId === selectedMicrosite.id)
              .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
              .map((lead) => {
                const microsite = microsites.find((record) => record.id === lead.micrositeId);
                return (
                  <article key={lead.id} className="flex flex-col gap-2 rounded-md border border-[#cbd5f5] p-4">
                    <div className="flex flex-col gap-1 text-sm text-[#0f172a]">
                      <span className="font-medium">{lead.name}</span>
                      <span>{lead.email}</span>
                      {lead.phone ? <span>{lead.phone}</span> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569]">
                      <span>{formatDateTime(lead.createdAt, locale)}</span>
                      {microsite ? <span>{microsite.title}</span> : null}
                    </div>
                    {lead.message ? <p className="text-sm text-[#475569]">{lead.message}</p> : null}
                  </article>
                );
              })}
          </div>
        </DxCard>
        <DxCard className="flex flex-col gap-4 bg-white" padding="large">
          <h3 className="text-base font-semibold text-[#0f172a]">{tMicrosites("notifications.title")}</h3>
          <div className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-2">
            {notificationLog.length === 0 ? (
              <p className="text-sm text-[#475569]">{tMicrosites("notifications.empty")}</p>
            ) : (
              notificationLog.map((notification) => (
                <article key={notification.id} className="flex flex-col gap-1 rounded-md border border-[#e2e8f0] p-3">
                  <div className="flex items-center justify-between text-xs text-[#475569]">
                    <span>{formatDateTime(notification.createdAt, locale)}</span>
                    <DxBadge size="sm" variant={notification.channel === "email" ? "primary" : "secondary"}>
                      {notification.channel === "email"
                        ? tMicrosites("notifications.email")
                        : tMicrosites("notifications.inApp")}
                    </DxBadge>
                  </div>
                  <p className="text-sm text-[#0f172a]">{notification.summary}</p>
                </article>
              ))
            )}
          </div>
        </DxCard>
      </section>

      <DxDialog
        show={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={dialogMode === "create" ? tMicrosites("form.createTitle") : tMicrosites("form.editTitle")}
      >
        <div className="flex flex-col gap-4">
          <DxInput
            label={tMicrosites("form.title")}
            name="title"
            value={formState.title}
            onChange={(value) => {
              setFormState((current) => ({ ...current, title: value }));
              setFormErrors((current) => ({ ...current, title: undefined }));
            }}
            placeholder={tMicrosites("form.titlePlaceholder")}
            validationStatus={formErrors.title ? "error" : undefined}
            helperText={formErrors.title}
          />
          <DxInput
            label={tMicrosites("form.slug")}
            name="slug"
            value={formState.slug}
            onChange={(value) => {
              setFormState((current) => ({ ...current, slug: value }));
              setFormErrors((current) => ({ ...current, slug: undefined }));
            }}
            placeholder="meu-microsite"
            validationStatus={formErrors.slug ? "error" : undefined}
            helperText={formErrors.slug}
          />
          <DxInput
            label={tMicrosites("form.headline")}
            name="headline"
            value={formState.headline}
            onChange={(value) => {
              setFormState((current) => ({ ...current, headline: value }));
              setFormErrors((current) => ({ ...current, headline: undefined }));
            }}
            placeholder={tMicrosites("form.headlinePlaceholder")}
            validationStatus={formErrors.headline ? "error" : undefined}
            helperText={formErrors.headline}
          />
          <DxInput
            label={tMicrosites("form.description")}
            name="description"
            value={formState.description}
            onChange={(value) => {
              setFormState((current) => ({ ...current, description: value }));
              setFormErrors((current) => ({ ...current, description: undefined }));
            }}
            placeholder={tMicrosites("form.descriptionPlaceholder")}
            validationStatus={formErrors.description ? "error" : undefined}
            helperText={formErrors.description}
            multiline
            rows={3}
          />
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#0f172a]">{tMicrosites("form.preferences")}</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-[#0f172a]">
                <input
                  type="checkbox"
                  checked={formState.showContactPhone}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, showContactPhone: event.target.checked }))
                  }
                />
                {tMicrosites("form.showPhone")}
              </label>
              <label className="flex items-center gap-2 text-sm text-[#0f172a]">
                <input
                  type="checkbox"
                  checked={formState.enableCaptcha}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, enableCaptcha: event.target.checked }))
                  }
                />
                {tMicrosites("form.enableCaptcha")}
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <DxButton variant="ghost" onClick={() => setDialogOpen(false)}>
              {tCommon("actions.cancel")}
            </DxButton>
            <DxButton onClick={handleSaveMicrosite}>
              {dialogMode === "create" ? tMicrosites("form.create") : tMicrosites("form.save")}
            </DxButton>
          </div>
        </div>
      </DxDialog>

      <DxToast open={toastOpen} onClose={() => setToastOpen(false)}>
        {toastMessage}
      </DxToast>
    </main>
  );
}
