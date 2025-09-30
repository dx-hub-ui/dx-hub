export const dxDashboardTokens = {
  grid: {
    columns: 12,
    columnGap: "var(--dx-layout-content-gap)",
    rowGap: "var(--dx-layout-content-gap)",
    sectionSpacing: "var(--dx-space-8)",
    maxWidth: "var(--dx-layout-max-width)",
  },
  filters: {
    background: "var(--dx-color-surface)",
    borderColor: "var(--dx-color-border)",
    radius: "var(--dx-radius-lg)",
    paddingBlock: "var(--dx-space-4)",
    paddingInline: "var(--dx-space-5)",
    gap: "var(--dx-space-4)",
    labelColor: "var(--dx-color-text-secondary)",
  },
  cards: {
    radius: "var(--dx-radius-lg)",
    padding: "var(--dx-space-5)",
    headerGap: "var(--dx-space-2)",
    bodyGap: "var(--dx-space-3)",
  },
  attentionBox: {
    stackGap: "var(--dx-space-4)",
    pinnedBorder: "var(--color-basic_blue)",
    radius: "var(--dx-radius-md)",
  },
  typography: {
    headline: "var(--dx-typography-lg)",
    body: "var(--dx-typography-md)",
    caption: "var(--dx-typography-xs)",
    weightRegular: "var(--dx-font-weight-regular)",
    weightMedium: "var(--dx-font-weight-medium)",
    weightSemibold: "var(--dx-font-weight-semibold)",
  },
} as const;

export type DxDashboardTokens = typeof dxDashboardTokens;
