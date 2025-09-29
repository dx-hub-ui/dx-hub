"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

const tableColumns = [
  { id: "name", accessor: "name" },
  { id: "stage", accessor: "stage" },
  { id: "owner", accessor: "owner" },
] as const;

type TableColumn = (typeof tableColumns)[number];

type DemoRow = {
  id: string;
  cells: Record<TableColumn["accessor"], string>;
};

const demoRows: DemoRow[] = [
  { id: "1", cells: { name: "Ana Souza", stage: "Descoberta", owner: "João" } },
  { id: "2", cells: { name: "Marcelo Lima", stage: "Negociação", owner: "Ana" } },
  { id: "3", cells: { name: "Camila Freitas", stage: "Fechado", owner: "Paula" } },
];

export default function HomePage() {
  const { t: tCommon } = useTranslation("common");
  const { t: tContacts } = useTranslation("contacts");
  const { t: tErrors } = useTranslation("errors");
  const { t: tAuth } = useTranslation("auth");
  const telemetry = useTelemetry();
  const pathname = usePathname();

  const [inputValue, setInputValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [view, setView] = useState<"table" | "kanban">("table");

  useEffect(() => {
    telemetry.capture("page_view", { pathname, view });
  }, [pathname, telemetry, view]);

  const columns = useMemo(
    () =>
      tableColumns.map((column) => ({
        ...column,
        title: tContacts(`table.headers.${column.accessor}`),
      })),
    [tContacts],
  );

  const rows = useMemo(() => demoRows.map((row) => ({ ...row, cells: row.cells })), []);

  const errorState = useMemo(
    () => (
      <div role="alert" className="px-4 py-6 text-sm text-red-700">
        {tErrors("generic")}
      </div>
    ),
    [tErrors],
  );

  const emptyState = useMemo(
    () => (
      <div role="status" className="px-4 py-6 text-sm text-gray-600">
        {tContacts("table.empty")}
      </div>
    ),
    [tContacts],
  );

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#1f2933]">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-4">
          <DxBadge type="indicator" density="compact" variant="primary" value={0}>
            <span className="font-semibold uppercase tracking-wide text-xs text-[#4b5563]">
              {tCommon("appName")}
            </span>
          </DxBadge>
          <DxCard className="flex flex-col gap-4 bg-white" aria-labelledby="hero-title">
            <div className="flex flex-col gap-2">
              <h1 id="hero-title" className="text-3xl font-semibold text-[#111827]">
                {tCommon("welcome.title")}
              </h1>
              <p className="text-base text-[#4b5563]">{tCommon("welcome.subtitle")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <DxTooltip content={tCommon("actions.openStorybook")}>
                <DxButton
                  variant="primary"
                  size="md"
                  onClick={() => setDialogOpen(true)}
                  telemetryId="cta.open_dialog"
                  aria-haspopup="dialog"
                >
                  {tCommon("actions.start")}
                </DxButton>
              </DxTooltip>
              <DxButton
                variant="ghost"
                size="md"
                onClick={() => {
                  const nextView = view === "table" ? "kanban" : "table";
                  setView(nextView);
                  telemetry.capture("ui_toggle_view", { from: view, to: nextView, entity: "demo" });
                }}
                telemetryId="cta.toggle_view"
              >
                {view === "table" ? tCommon("actions.toggleKanban") : tCommon("actions.toggleTable")}
              </DxButton>
              <DxButton
                variant="secondary"
                size="md"
                onClick={() => {
                  telemetry.capture("auth_login_success", { method: "demo" });
                  setToastOpen(true);
                }}
                telemetryId="cta.login_success"
              >
                {tCommon("actions.simulateLogin")}
              </DxButton>
            </div>
          </DxCard>
        </header>

        <DxCard className="flex flex-col gap-6 bg-white" aria-live="polite">
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-[#111827]">{tContacts("table.title")}</h2>
            <DxInput
              name="search"
              placeholder={tContacts("table.filters.searchPlaceholder")}
              value={inputValue}
              onChange={setInputValue}
              telemetryId="input.search_contacts"
            />
          </div>
          <DxTable
            columns={columns}
            rows={rows}
            emptyState={emptyState}
            errorState={errorState}
            dataState={{ isLoading: false, isError: false }}
            telemetryId="table.contacts"
          />
        </DxCard>

        <DxCard className="grid gap-4 bg-white" aria-live="polite">
          <h2 className="text-lg font-semibold text-[#111827]">{tCommon("preview.title")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <DxSkeleton height={48} density="compact" />
            <DxSkeleton height={48} density="compact" />
          </div>
        </DxCard>

        <footer className="flex flex-col gap-3 pb-10">
          <span className="text-sm text-[#6b7280]">{tCommon("actions.openStorybook")}</span>
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
        id="governance-dialog"
        show={dialogOpen}
        onClose={() => setDialogOpen(false)}
        size="md"
        aria-labelledby="dialog-title"
      >
        <div className="flex flex-col gap-4 p-6" id="dialog-title">
          <h2 className="text-xl font-semibold text-[#111827]">{tCommon("dialog.title")}</h2>
          <p className="text-sm text-[#4b5563]">
            {tCommon("welcome.subtitle")}
          </p>
          <DxButton variant="primary" onClick={() => setDialogOpen(false)} telemetryId="dialog.close">
            {tCommon("dialog.close")}
          </DxButton>
        </div>
      </DxDialog>

      <DxToast
        open={toastOpen}
        variant="success"
        onClose={() => setToastOpen(false)}
        telemetryId="toast.login"
      >
        {tAuth("login.success")}
      </DxToast>
    </main>
  );
}
