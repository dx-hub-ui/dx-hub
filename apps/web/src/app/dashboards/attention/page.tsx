"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DxBadge,
  DxButton,
  DxCard,
  DxDialog,
  DxInput,
  DxTable,
  type DxTableColumn,
  type DxTableRow,
} from "@dx/ui";
import { useAppLayout } from "@/components/app-shell/AppShell";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  filterAttentionBoxes,
  useAttentionBoxStore,
  type AttentionBoxFilters,
} from "@/dashboards/attention-store";
import { markdownToHtml, markdownToPlainText } from "@/dashboards/markdown";
import { CURRENT_OWNER_ID, DASHBOARD_MEMBERS } from "@/dashboards/mock-data";
import type { AttentionBoxRecord } from "@/dashboards/types";
import { formatDateTimeLocalInput, toIsoStringFromLocalInput } from "@/dashboards/utils";
import styles from "./AttentionPage.module.css";

type FormState = {
  title: string;
  bodyMd: string;
  variant: AttentionBoxRecord["variant"];
  audience: AttentionBoxRecord["audience"];
  startAt: string;
  endAt: string;
  pinned: boolean;
  audienceMemberIds: string[];
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type DialogMode = "create" | "edit";

function getBoxStatus(box: AttentionBoxRecord, now: Date) {
  const start = new Date(box.startAt).getTime();
  const end = new Date(box.endAt).getTime();
  const current = now.getTime();
  if (current < start) {
    return "future" as const;
  }
  if (current > end) {
    return "expired" as const;
  }
  return "active" as const;
}

function defaultFormState(now: Date): FormState {
  const start = new Date(now);
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  return {
    title: "",
    bodyMd: "",
    variant: "info",
    audience: "org",
    startAt: formatDateTimeLocalInput(start),
    endAt: formatDateTimeLocalInput(end),
    pinned: false,
    audienceMemberIds: [],
  };
}

export default function AttentionManagementPage() {
  const { setConfig } = useAppLayout();
  const attentionDictionary = useTranslation("attention");
  const tAttention = attentionDictionary.t;
  const locale = attentionDictionary.locale;
  const { t: tDashboard } = useTranslation("dashboard");
  const now = useMemo(() => new Date(), []);

  const store = useAttentionBoxStore(CURRENT_OWNER_ID);

  const [filters, setFilters] = useState<AttentionBoxFilters>({ status: "active", variant: "all", audience: "all" });
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(() => defaultFormState(now));
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    setConfig({
      sidebar: {
        activeItemId: "attention",
        sections: [
          {
            id: "insights",
            label: tDashboard("navigation.section"),
            items: [
              { id: "dashboards", label: tDashboard("navigation.items.dashboards") },
              { id: "attention", label: tDashboard("navigation.items.attention") },
            ],
          },
        ],
      },
      workspace: {
        title: tAttention("manage.workspace.title"),
        board: tAttention("manage.workspace.board"),
      },
    });
  }, [setConfig, tAttention, tDashboard]);

  const filteredBoxes = useMemo(
    () => filterAttentionBoxes(store.boxes, filters, now),
    [filters, now, store.boxes],
  );

  useEffect(() => {
    if (filteredBoxes.length > 0) {
      if (!selectedBoxId || !filteredBoxes.some((box) => box.id === selectedBoxId)) {
        setSelectedBoxId(filteredBoxes[0]?.id ?? null);
      }
    } else {
      setSelectedBoxId(null);
    }
  }, [filteredBoxes, selectedBoxId]);

  const selectedBox = filteredBoxes.find((box) => box.id === selectedBoxId) ?? filteredBoxes[0] ?? null;

  const statusBadgeVariant = (status: ReturnType<typeof getBoxStatus>) => {
    switch (status) {
      case "future":
        return "secondary" as const;
      case "expired":
        return "danger" as const;
      case "active":
      default:
        return "primary" as const;
    }
  };

  const columns: DxTableColumn[] = [
    { id: "title", title: tAttention("manage.table.title"), accessor: "title" },
    { id: "status", title: tAttention("manage.table.status"), accessor: "status" },
    { id: "variant", title: tAttention("manage.table.variant"), accessor: "variant" },
    { id: "audience", title: tAttention("manage.table.audience"), accessor: "audience" },
    { id: "period", title: tAttention("manage.table.period"), accessor: "period" },
    { id: "actions", title: tAttention("manage.table.actions"), accessor: "actions" },
  ];

  const tableRows: DxTableRow[] = filteredBoxes.map((box) => {
    const status = getBoxStatus(box, now);
    const startLabel = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(box.startAt));
    const endLabel = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(box.endAt));
    const periodLabel = `${startLabel} – ${endLabel}`;
    return {
      id: box.id,
      highlighted: selectedBoxId === box.id,
      cells: {
        title: box.title,
        status: (
          <DxBadge variant={statusBadgeVariant(status)} size="sm">
            {tAttention(`manage.status.${status}` as const)}
          </DxBadge>
        ),
        variant: tAttention(`variant.${box.variant}` as const),
        audience: tAttention(`audiences.${box.audience}` as const),
        period: periodLabel,
        actions: (
          <div className={styles.tableActions}>
            <DxButton density="compact" size="sm" variant="secondary" onClick={() => setSelectedBoxId(box.id)}>
              {tAttention("manage.actions.preview")}
            </DxButton>
            <DxButton density="compact" size="sm" variant="secondary" onClick={() => handleEdit(box)}>
              {tAttention("manage.actions.edit")}
            </DxButton>
            <DxButton density="compact" size="sm" variant="ghost" onClick={() => handleDuplicate(box)}>
              {tAttention("manage.actions.duplicate")}
            </DxButton>
            <DxButton density="compact" size="sm" variant="ghost" onClick={() => handleDelete(box.id)}>
              {tAttention("manage.actions.delete")}
            </DxButton>
          </div>
        ),
      },
    };
  });

  const memberOptions = useMemo(
    () =>
      DASHBOARD_MEMBERS.filter((member) => member.id !== CURRENT_OWNER_ID).map((member) => ({
        id: member.id,
        label: member.name,
      })),
    [],
  );

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingId(null);
    setFormState(defaultFormState(now));
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleEdit = (box: AttentionBoxRecord) => {
    setDialogMode("edit");
    setEditingId(box.id);
    setFormState({
      title: box.title,
      bodyMd: box.bodyMd,
      variant: box.variant,
      audience: box.audience,
      startAt: formatDateTimeLocalInput(new Date(box.startAt)),
      endAt: formatDateTimeLocalInput(new Date(box.endAt)),
      pinned: box.pinned,
      audienceMemberIds: box.audienceMemberIds ?? [],
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleDuplicate = (box: AttentionBoxRecord) => {
    const nowIso = new Date().toISOString();
    store.createBox({
      title: `${box.title} ${tAttention("manage.cloneSuffix")}`,
      bodyMd: box.bodyMd,
      variant: box.variant,
      audience: box.audience,
      audienceMemberIds: box.audienceMemberIds,
      startAt: nowIso,
      endAt: box.endAt,
      pinned: box.pinned,
    });
  };

  const handleDelete = (boxId: string) => {
    const confirmation = window.confirm(tAttention("manage.confirmDelete"));
    if (!confirmation) {
      return;
    }
    store.deleteBox(boxId);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setFormErrors({});
  };

  const handleFormChange = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setFormState((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!formState.title.trim()) {
      errors.title = tAttention("manage.validation.title");
    }
    if (!formState.bodyMd.trim()) {
      errors.bodyMd = tAttention("manage.validation.body");
    }
    const start = new Date(formState.startAt);
    const end = new Date(formState.endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      errors.endAt = tAttention("manage.validation.period");
    }
    if (formState.audience === "custom" && formState.audienceMemberIds.length === 0) {
      errors.audienceMemberIds = tAttention("manage.validation.audience");
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    const payload = {
      title: formState.title,
      bodyMd: formState.bodyMd,
      variant: formState.variant,
      audience: formState.audience,
      audienceMemberIds: formState.audience === "custom" ? formState.audienceMemberIds : undefined,
      startAt: toIsoStringFromLocalInput(formState.startAt),
      endAt: toIsoStringFromLocalInput(formState.endAt),
      pinned: formState.pinned,
    } satisfies Omit<AttentionBoxRecord, "id" | "createdAt" | "updatedAt" | "createdByMemberId" | "orgId">;

    if (dialogMode === "create") {
      store.createBox(payload);
    } else if (editingId) {
      store.updateBox(editingId, payload);
    }
    setDialogOpen(false);
  };

  const previewSource = formState.bodyMd.trim()
    ? formState.bodyMd
    : tAttention("manage.previewPlaceholder");
  const previewHtml = markdownToHtml(previewSource);

  const selectedHtml = selectedBox ? markdownToHtml(selectedBox.bodyMd) : "";
  const selectedSummary = selectedBox ? markdownToPlainText(selectedBox.bodyMd) : "";
  const selectedStatus = selectedBox ? getBoxStatus(selectedBox, now) : null;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <section className={styles.hero}>
          <h1 className={styles.title}>{tAttention("manage.title")}</h1>
          <p className={styles.description}>{tAttention("manage.description")}</p>
          <div className={styles.actions}>
            <div className={styles.filters}>
              <div className={styles.selectField}>
                <label className={styles.label} htmlFor="attention-status">
                  {tAttention("manage.filters.status")}
                </label>
                <select
                  id="attention-status"
                  className={styles.select}
                  value={filters.status ?? "all"}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, status: event.target.value === "all" ? undefined : (event.target.value as AttentionBoxFilters["status"]) }))
                  }
                >
                  <option value="all">{tAttention("manage.filters.all")}</option>
                  <option value="active">{tAttention("manage.status.active")}</option>
                  <option value="future">{tAttention("manage.status.future")}</option>
                  <option value="expired">{tAttention("manage.status.expired")}</option>
                </select>
              </div>
              <div className={styles.selectField}>
                <label className={styles.label} htmlFor="attention-variant">
                  {tAttention("manage.filters.variant")}
                </label>
                <select
                  id="attention-variant"
                  className={styles.select}
                  value={filters.variant ?? "all"}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, variant: event.target.value as AttentionBoxFilters["variant"] }))
                  }
                >
                  <option value="all">{tAttention("manage.filters.all")}</option>
                  <option value="info">{tAttention("variant.info")}</option>
                  <option value="success">{tAttention("variant.success")}</option>
                  <option value="warning">{tAttention("variant.warning")}</option>
                  <option value="danger">{tAttention("variant.danger")}</option>
                </select>
              </div>
              <div className={styles.selectField}>
                <label className={styles.label} htmlFor="attention-audience">
                  {tAttention("manage.filters.audience")}
                </label>
                <select
                  id="attention-audience"
                  className={styles.select}
                  value={filters.audience ?? "all"}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, audience: event.target.value as AttentionBoxFilters["audience"] }))
                  }
                >
                  <option value="all">{tAttention("manage.filters.all")}</option>
                  <option value="org">{tAttention("audiences.org")}</option>
                  <option value="leaders">{tAttention("audiences.leaders")}</option>
                  <option value="reps">{tAttention("audiences.reps")}</option>
                  <option value="custom">{tAttention("audiences.custom")}</option>
                </select>
              </div>
            </div>
            <DxButton variant="primary" onClick={openCreateDialog}>
              {tAttention("manage.actions.new")}
            </DxButton>
          </div>
        </section>

        <DxCard className={styles.tableCard}>
          <h2 className={styles.title}>{tAttention("manage.table.heading")}</h2>
          <DxTable
            columns={columns}
            rows={tableRows}
            density="compact"
            size="sm"
            dataState={{ isLoading: false, isError: false }}
            emptyState={<p className={styles.tableMessage}>{tAttention("manage.table.empty")}</p>}
            errorState={
              <p role="alert" className={`${styles.tableMessage} ${styles.tableMessageError}`}>
                {tAttention("manage.table.error")}
              </p>
            }
          />
        </DxCard>

        {selectedBox ? (
          <DxCard className={styles.previewCard}>
            <div className={styles.badgeGroup}>
              {selectedStatus ? (
                <DxBadge size="sm" variant={statusBadgeVariant(selectedStatus)}>
                  {tAttention(`manage.status.${selectedStatus}` as const)}
                </DxBadge>
              ) : null}
              {selectedBox.pinned ? (
                <DxBadge size="sm" variant="primary">
                  {tAttention("preview.pinned")}
                </DxBadge>
              ) : null}
            </div>
            <h3 className={styles.title}>{selectedBox.title}</h3>
            <p className={styles.description}>
              {selectedSummary || tAttention("manage.previewPlaceholder")}
            </p>
            <div className={styles.previewBody} dangerouslySetInnerHTML={{ __html: selectedHtml }} />
          </DxCard>
        ) : null}
      </div>

      <DxDialog
        show={dialogOpen}
        onClose={handleDialogClose}
        title={dialogMode === "create" ? tAttention("manage.dialog.createTitle") : tAttention("manage.dialog.editTitle")}
      >
        <div className={styles.formGrid}>
          <div className={styles.formFull}>
            <DxInput
              label={tAttention("manage.form.title")}
              name="title"
              value={formState.title}
              onChange={(value) => handleFormChange("title", value)}
              validationStatus={formErrors.title ? "error" : undefined}
              helperText={formErrors.title}
            />
          </div>
          <div>
            <DxInput
              label={tAttention("manage.form.start")}
              name="start"
              type="datetime-local"
              value={formState.startAt}
              onChange={(value) => handleFormChange("startAt", value)}
              validationStatus={formErrors.endAt ? "error" : undefined}
            />
          </div>
          <div>
            <DxInput
              label={tAttention("manage.form.end")}
              name="end"
              type="datetime-local"
              value={formState.endAt}
              onChange={(value) => handleFormChange("endAt", value)}
              validationStatus={formErrors.endAt ? "error" : undefined}
              helperText={formErrors.endAt}
            />
          </div>
          <div>
            <label className={styles.label} htmlFor="manage-variant">
              {tAttention("manage.form.variant")}
            </label>
            <select
              id="manage-variant"
              className={styles.select}
              value={formState.variant}
              onChange={(event) => handleFormChange("variant", event.target.value as FormState["variant"])}
            >
              <option value="info">{tAttention("variant.info")}</option>
              <option value="success">{tAttention("variant.success")}</option>
              <option value="warning">{tAttention("variant.warning")}</option>
              <option value="danger">{tAttention("variant.danger")}</option>
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="manage-audience">
              {tAttention("manage.form.audience")}
            </label>
            <select
              id="manage-audience"
              className={styles.select}
              value={formState.audience}
              onChange={(event) => handleFormChange("audience", event.target.value as FormState["audience"])}
            >
              <option value="org">{tAttention("audiences.org")}</option>
              <option value="leaders">{tAttention("audiences.leaders")}</option>
              <option value="reps">{tAttention("audiences.reps")}</option>
              <option value="custom">{tAttention("audiences.custom")}</option>
            </select>
          </div>
          <div className={styles.formFull}>
            <DxInput
              label={tAttention("manage.form.body")}
              name="body"
              value={formState.bodyMd}
              onChange={(value) => handleFormChange("bodyMd", value)}
              multiline
              rows={6}
              validationStatus={formErrors.bodyMd ? "error" : undefined}
              helperText={formErrors.bodyMd}
            />
          </div>
          {formState.audience === "custom" ? (
            <div className={styles.formFull}>
              <span className={styles.label}>{tAttention("manage.form.customAudience")}</span>
              <div className={styles.checkboxGroup}>
                {memberOptions.map((member) => (
                  <label key={member.id}>
                    <input
                      type="checkbox"
                      checked={formState.audienceMemberIds.includes(member.id)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setFormState((current) => {
                          const currentIds = new Set(current.audienceMemberIds);
                          if (checked) {
                            currentIds.add(member.id);
                          } else {
                            currentIds.delete(member.id);
                          }
                          return { ...current, audienceMemberIds: Array.from(currentIds) };
                        });
                      }}
                    />
                    {member.label}
                  </label>
                ))}
                {formErrors.audienceMemberIds ? (
                  <span className={styles.description}>{formErrors.audienceMemberIds}</span>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className={styles.formFull}>
            <label className={styles.label}>
              <input
                type="checkbox"
                checked={formState.pinned}
                onChange={(event) => handleFormChange("pinned", event.target.checked)}
              />
              {tAttention("manage.form.pinned")}
            </label>
          </div>
          <div className={styles.formFull}>
            <span className={styles.label}>{tAttention("manage.preview.title")}</span>
            <div className={styles.previewBody} dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
          <div className={`${styles.formFooter} ${styles.formFull}`}>
            <DxButton variant="ghost" onClick={handleDialogClose}>
              {tAttention("manage.actions.cancel")}
            </DxButton>
            <DxButton variant="primary" onClick={handleSubmit}>
              {dialogMode === "create" ? tAttention("manage.actions.create") : tAttention("manage.actions.save")}
            </DxButton>
          </div>
        </div>
      </DxDialog>
    </div>
  );
}
