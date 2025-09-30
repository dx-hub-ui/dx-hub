import type { Meta, StoryObj } from "@storybook/react";
import { useMemo } from "react";
import { DxBadge, DxButton, DxCard, DxInput, DxTable, DxTooltip } from "@dx/ui";
import { Label } from "@vibe/core";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  CONTACT_STAGE_ORDER,
  type ContactStage,
} from "@/crm/types";
import { BOARD_COLUMN_ORDER, CRM_CONTACTS_SEED } from "@/crm/mock-data";
import { CONTACT_STAGE_THEME } from "@/crm/stage-theme";

const meta = {
  title: "CRM/Scenarios",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "📚 [Vibe Docs — Table](https://monday.com/vibe/components/table)",
          "📚 [Vibe Docs — Card](https://monday.com/vibe/components/card)",
          "📚 [Vibe Docs — Label](https://monday.com/vibe/components/label)"
        ].join("\n"),
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function useStageLabels() {
  const { t } = useTranslation("contacts");
  return useMemo(() => {
    return CONTACT_STAGE_ORDER.reduce<Record<ContactStage, string>>((acc, stage) => {
      acc[stage] = t(`stages.${stage}`);
      return acc;
    }, {} as Record<ContactStage, string>);
  }, [t]);
}

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
function TableScenario() {
  const { t, locale } = useTranslation("contacts");
  const stageLabels = useStageLabels();
  const rows = CRM_CONTACTS_SEED.slice(0, 3).map((contact) => ({
    id: contact.id,
    highlighted: false,
    cells: {
      name: contact.name,
      stage: stageLabels[contact.stage],
      owner: contact.assignedTo,
    },
  }));

  const columns = [
    {
      id: "name",
      accessor: "name",
      title: t("table.headers.name"),
      render: (row: { id: string }) => {
        const contact = CRM_CONTACTS_SEED.find((item) => item.id === row.id);
        if (!contact) {
          return null;
        }
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[#0f172a]">{contact.name}</span>
            <span className="text-xs text-[#64748b]">{contact.company}</span>
          </div>
        );
      },
    },
    {
      id: "stage",
      accessor: "stage",
      title: t("table.headers.stage"),
      render: (row: { id: string }) => {
        const contact = CRM_CONTACTS_SEED.find((item) => item.id === row.id);
        if (!contact) {
          return null;
        }
        const theme = CONTACT_STAGE_THEME[contact.stage];
        return <Label color={theme.labelColor} kind="fill" size="small" text={stageLabels[contact.stage]} />;
      },
    },
    {
      id: "owner",
      accessor: "owner",
      title: t("table.headers.owner"),
    },
  ];

  return (
    <DxCard className="flex flex-col gap-4 bg-white p-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-[#0f172a]">{t("table.title")}</h3>
        <DxInput
          name="search"
          placeholder={t("table.filters.searchPlaceholder")}
          value=""
          onChange={() => undefined}
        />
      </div>
      <DxTable
        columns={columns}
        rows={rows}
        dataState={{ isLoading: false, isError: false }}
        emptyState={<div className="px-4 py-6 text-sm text-[#64748b]">{t("table.empty")}</div>}
        errorState={
          <div role="alert" className="px-4 py-6 text-sm text-[#b91c1c]">
            {t("table.error")}
          </div>
        }
        telemetryId="story.crm.table"
      />
      <div className="text-xs text-[#64748b]">
        {t("kanban.lastInteraction", {
          values: { timestamp: formatDateTime(CRM_CONTACTS_SEED[0].lastInteraction, locale) },
        })}
      </div>
    </DxCard>
  );
}

function BoardScenario() {
  const { t, locale } = useTranslation("contacts");
  const stageLabels = useStageLabels();
  return (
    <div className="flex gap-4 bg-[#f5f6f8] p-6">
      {BOARD_COLUMN_ORDER.map((stage) => {
        const items = CRM_CONTACTS_SEED.filter((contact) => contact.stage === stage);
        const theme = CONTACT_STAGE_THEME[stage];
        const usesOnPrimary =
          theme.headerTextColor.toLowerCase() === "#ffffff" || theme.headerTextColor === "var(--text-color-on-primary)";
        const countStyles = usesOnPrimary
          ? { backgroundColor: "rgba(255, 255, 255, 0.18)", color: "var(--text-color-on-primary)" }
          : { backgroundColor: "rgba(255, 255, 255, 0.7)", color: theme.headerTextColor };
        return (
          <div
            key={stage}
            className="flex min-h-[280px] w-64 flex-col overflow-hidden rounded-2xl border shadow-sm"
            style={{ backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }}
            data-stage={stage}
          >
            <header
              className="flex items-start justify-between gap-3 px-4 py-3 shadow-[inset_0_-1px_0_rgba(15,23,42,0.08)]"
              style={{ backgroundColor: theme.accentColor, color: theme.headerTextColor }}
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{stageLabels[stage]}</span>
                <span className="text-xs opacity-80">{t("kanban.listLabel", { values: { stage: stageLabels[stage] } })}</span>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={countStyles}>
                {items.length}
              </span>
            </header>
            <div className="flex flex-1 flex-col gap-3 p-4">
              {items.map((contact) => (
                <article
                  key={contact.id}
                  className="flex flex-col gap-3 rounded-2xl border border-transparent bg-white p-4 shadow-[0_6px_14px_rgba(15,23,42,0.12)]"
                  style={{ borderLeft: `6px solid ${theme.accentColor}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#0f172a]">{contact.name}</p>
                      <p className="text-xs text-[#64748b]">{contact.company}</p>
                    </div>
                    <Label color={theme.labelColor} kind="fill" size="small" text={stageLabels[contact.stage]} />
                  </div>
                  <p className="text-xs text-[#475569]">
                    {t("kanban.lastInteraction", {
                      values: { timestamp: formatDateTime(contact.lastInteraction, locale) },
                    })}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-[#475569]">
                    <span className="rounded-full bg-[#e2e8f0] px-2 py-1">{contact.assignedTo}</span>
                    <span className="rounded-full bg-[#e2e8f0] px-2 py-1">{contact.email}</span>
                  </div>
                  <DxTooltip content={t("kanban.actions.advance", { values: { stage: stageLabels[stage] } })}>
                    <DxButton size="sm" variant="ghost" telemetryId="story.crm.board.cta">
                      {t("kanban.actions.advance", { values: { stage: stageLabels[stage] } })}
                    </DxButton>
                  </DxTooltip>
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailsScenario() {
  const { t, locale } = useTranslation("contacts");
  const stageLabels = useStageLabels();
  const contact = CRM_CONTACTS_SEED[0];
  const activities = [...contact.activities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map((activity) => {
      const values = { ...activity.summaryValues };
      if (values?.stage && stageLabels[values.stage as ContactStage]) {
        values.stage = stageLabels[values.stage as ContactStage];
      }
      if (values?.from && stageLabels[values.from as ContactStage]) {
        values.from = stageLabels[values.from as ContactStage];
      }
      return {
        ...activity,
        summaryValues: values,
      };
    });

  return (
    <DxCard className="max-w-md bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#0f172a]">{t("details.title")}</h3>
        <Label color={CONTACT_STAGE_THEME[contact.stage].labelColor} kind="fill" size="small" text={stageLabels[contact.stage]} />
      </div>
      <div className="mt-4 flex flex-col gap-2 text-sm text-[#1f2937]">
        <span className="text-base font-semibold text-[#0f172a]">{contact.name}</span>
        <span>{contact.company}</span>
        <span>{contact.email}</span>
        <span>{contact.phone}</span>
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-[#94a3b8]">
            {t("details.lastInteraction")}
          </span>
          <span>{formatDateTime(contact.lastInteraction, locale)}</span>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        <h4 className="text-sm font-semibold text-[#0f172a]">{t("timeline.title")}</h4>
        <ul className="flex flex-col gap-2">
          {activities.map((activity) => (
            <li key={activity.id} className="rounded-md border border-[#e2e8f0] p-3">
              <div className="flex items-center justify-between">
                <DxBadge density="compact" variant="ghost">
                  {t(`timeline.types.${activity.type}`)}
                </DxBadge>
                <span className="text-xs text-[#94a3b8]">
                  {formatDateTime(activity.timestamp, locale)}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#1f2937]">
                {t(activity.summaryKey, { values: activity.summaryValues })}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </DxCard>
  );
}

export const TableView: Story = {
  render: () => <TableScenario />,
};

export const BoardView: Story = {
  render: () => <BoardScenario />,
};

export const DetailsPanel: Story = {
  render: () => <DetailsScenario />,
};
