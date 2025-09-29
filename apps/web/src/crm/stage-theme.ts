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
    accentColor: "#579BFC",
    backgroundColor: "rgba(87, 155, 252, 0.12)",
    borderColor: "rgba(87, 155, 252, 0.3)",
    headerTextColor: "#ffffff",
  },
  discovery: {
    labelColor: Label.colors.PURPLE,
    accentColor: "#A25DDC",
    backgroundColor: "rgba(162, 93, 220, 0.14)",
    borderColor: "rgba(162, 93, 220, 0.35)",
    headerTextColor: "#ffffff",
  },
  negotiation: {
    labelColor: Label.colors.WORKING_ORANGE,
    accentColor: "#FDAB3D",
    backgroundColor: "rgba(253, 171, 61, 0.18)",
    borderColor: "rgba(253, 171, 61, 0.4)",
    headerTextColor: "#3f2d05",
  },
  won: {
    labelColor: Label.colors.DONE_GREEN,
    accentColor: "#00C875",
    backgroundColor: "rgba(0, 200, 117, 0.18)",
    borderColor: "rgba(0, 200, 117, 0.4)",
    headerTextColor: "#0a2e1f",
  },
  lost: {
    labelColor: Label.colors.STUCK_RED,
    accentColor: "#E2445C",
    backgroundColor: "rgba(226, 68, 92, 0.16)",
    borderColor: "rgba(226, 68, 92, 0.4)",
    headerTextColor: "#3d0711",
  },
};
