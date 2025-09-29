import type { Meta, StoryObj } from "@storybook/react";
import { useMemo } from "react";
import {
  DxBadge,
  DxButton,
  DxCard,
  DxInput,
  DxTable,
  DxTooltip,
} from "@dx/ui";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  CONTACT_STAGE_ORDER,
  type ContactStage,
} from "@/crm/types";
import {
  BOARD_COLUMN_ORDER,
  CONTACT_STAGE_VARIANTS,
  CRM_CONTACTS_SEED,
} from "@/crm/mock-data";

const meta = {
  title: "CRM/Scenarios",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "📚 [Vibe Docs — Table](https://monday.com/vibe/components/table)",
          "📚 [Vibe Docs — Card](https://monday.com/vibe/components/card)",
          "📚 [Vibe Docs — Badge](https://monday.com/vibe/components/badge)"
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
        return (
          <DxBadge density="compact" variant={CONTACT_STAGE_VARIANTS[contact.stage]}>
            {stageLabels[contact.stage]}
          </DxBadge>
        );
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
        return (
          <DxCard key={stage} className="min-w-[240px] flex-1 bg-white p-4" data-stage={stage}>
            <header className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#0f172a]">{stageLabels[stage]}</span>
              <DxBadge density="compact" variant="ghost">
                {items.length}
              </DxBadge>
            </header>
            <div className="flex flex-col gap-3">
              {items.map((contact) => (
                <article key={contact.id} className="rounded-md border border-[#e2e8f0] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#0f172a]">{contact.name}</p>
                      <p className="text-xs text-[#64748b]">{contact.company}</p>
                    </div>
                    <DxBadge density="compact" variant={CONTACT_STAGE_VARIANTS[contact.stage]}>
                      {stageLabels[contact.stage]}
                    </DxBadge>
                  </div>
                  <p className="mt-3 text-xs text-[#475569]">
                    {t("kanban.lastInteraction", {
                      values: { timestamp: formatDateTime(contact.lastInteraction, locale) },
                    })}
                  </p>
                  <DxTooltip content={t("kanban.actions.advance", { values: { stage: stageLabels[stage] } })}>
                    <DxButton size="sm" variant="secondary" telemetryId="story.crm.board.cta">
                      {t("kanban.actions.advance", { values: { stage: stageLabels[stage] } })}
                    </DxButton>
                  </DxTooltip>
                </article>
              ))}
            </div>
          </DxCard>
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
        <DxBadge density="compact" variant={CONTACT_STAGE_VARIANTS[contact.stage]}>
          {stageLabels[contact.stage]}
        </DxBadge>
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
