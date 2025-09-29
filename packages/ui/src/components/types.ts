export type DxSize = "sm" | "md";
export type DxVariant = "primary" | "secondary" | "ghost" | "danger";
export type DxDensity = "compact" | "comfortable";

export interface DxComponentBaseProps {
  /**
   * Size preset that maps to Vibe component sizing.
   */
  size?: DxSize;
  /**
   * Visual variant aligned with Vibe semantics.
   */
  variant?: DxVariant;
  /**
   * Density preset applied through data attributes. Defaults to compact.
   */
  density?: DxDensity;
  /**
   * Identifier forwarded to telemetry for richer analytics.
   */
  telemetryId?: string;
}
