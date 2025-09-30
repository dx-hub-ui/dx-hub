import { Label, type LabelColor } from "@vibe/core";

import type { ContactStage } from "./types";

export type ContactStageTheme = {
  /** Color token used by Vibe Label component */
  labelColor: LabelColor;
  /** Primary accent color for the column */
  accentColor: string;
  /** Soft background tint applied to the column */
  backgroundColor: string;
  /** Border color around the column */
  borderColor: string;
  /** Text color used on the colored column header */
  headerTextColor: string;
};

export const CONTACT_STAGE_THEME: Record<ContactStage, ContactStageTheme> = {
  prospecting: {
    labelColor: Label.colors.BRIGHT_BLUE,
    accentColor: "var(--color-bright-blue)",
    backgroundColor: "color-mix(in srgb, var(--color-bright-blue) 16%, white)",
    borderColor: "color-mix(in srgb, var(--color-bright-blue) 32%, transparent)",
    headerTextColor: "var(--text-color-on-primary)",
  },
  discovery: {
    labelColor: Label.colors.EGG_YOLK,
    accentColor: "var(--color-egg_yolk)",
    backgroundColor: "color-mix(in srgb, var(--color-egg_yolk) 20%, white)",
    borderColor: "color-mix(in srgb, var(--color-egg_yolk) 36%, transparent)",
    headerTextColor: "var(--primary-text-color)",
  },
  negotiation: {
    labelColor: Label.colors.DARK_ORANGE,
    accentColor: "var(--color-dark-orange)",
    backgroundColor: "color-mix(in srgb, var(--color-dark-orange) 20%, white)",
    borderColor: "color-mix(in srgb, var(--color-dark-orange) 36%, transparent)",
    headerTextColor: "var(--text-color-on-primary)",
  },
  blocked: {
    labelColor: Label.colors.STUCK_RED,
    accentColor: "var(--color-stuck-red)",
    backgroundColor: "color-mix(in srgb, var(--color-stuck-red) 18%, white)",
    borderColor: "color-mix(in srgb, var(--color-stuck-red) 34%, transparent)",
    headerTextColor: "var(--text-color-on-primary)",
  },
  won: {
    labelColor: Label.colors.DONE_GREEN,
    accentColor: "var(--color-done-green)",
    backgroundColor: "color-mix(in srgb, var(--color-done-green) 18%, white)",
    borderColor: "color-mix(in srgb, var(--color-done-green) 34%, transparent)",
    headerTextColor: "var(--text-color-on-primary)",
  },
  lost: {
    labelColor: Label.colors.DARK_RED,
    accentColor: "var(--color-dark-red)",
    backgroundColor: "color-mix(in srgb, var(--color-dark-red) 18%, white)",
    borderColor: "color-mix(in srgb, var(--color-dark-red) 34%, transparent)",
    headerTextColor: "var(--text-color-on-primary)",
  },
};
