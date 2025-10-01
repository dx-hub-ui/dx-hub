import type { ProspectStatus } from "./types";

type StatusTheme = {
  accent: string;
  tint: string;
  textOnAccent: string;
  chipBorder: string;
};

const softTint = (color: string, weight = 14) => `color-mix(in srgb, ${color} ${weight}%, white)`;

export const PROSPECT_STATUS_THEME: Record<ProspectStatus, StatusTheme> = {
  novo: {
    accent: "var(--color-wolf_gray)",
    tint: softTint("var(--color-wolf_gray)", 12),
    textOnAccent: "var(--primary-text-color)",
    chipBorder: "color-mix(in srgb, var(--color-wolf_gray) 60%, transparent)",
  },
  em_andamento: {
    accent: "var(--color-egg_yolk)",
    tint: softTint("var(--color-egg_yolk)", 18),
    textOnAccent: "var(--primary-text-color)",
    chipBorder: "color-mix(in srgb, var(--color-egg_yolk) 48%, transparent)",
  },
  cadastrado: {
    accent: "var(--color-done-green)",
    tint: softTint("var(--color-done-green)", 20),
    textOnAccent: "var(--text-color-on-primary)",
    chipBorder: "color-mix(in srgb, var(--color-done-green) 42%, transparent)",
  },
  rejeitado: {
    accent: "var(--color-stuck-red)",
    tint: softTint("var(--color-stuck-red)", 16),
    textOnAccent: "var(--text-color-on-primary)",
    chipBorder: "color-mix(in srgb, var(--color-stuck-red) 46%, transparent)",
  },
};
