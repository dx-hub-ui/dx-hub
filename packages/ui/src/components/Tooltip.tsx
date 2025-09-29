"use client";

import { Tooltip, type TooltipProps } from "@vibe/core";
import { useInteractionEvents } from "../telemetry/events";
import type { DxComponentBaseProps } from "./types";

export interface DxTooltipProps
  extends Omit<TooltipProps, "theme" | "onTooltipShow" | "onTooltipHide">,
    DxComponentBaseProps {
  onTooltipShow?: TooltipProps["onTooltipShow"];
  onTooltipHide?: TooltipProps["onTooltipHide"];
}

export function DxTooltip({
  variant = "primary",
  density = "compact",
  telemetryId,
  onTooltipShow,
  onTooltipHide,
  ...rest
}: DxTooltipProps) {
  const { trackOverlay } = useInteractionEvents();

  return (
    <Tooltip
      data-density={density}
      theme={variant === "ghost" ? Tooltip.themes.Primary : Tooltip.themes.Dark}
      onTooltipShow={() => {
        trackOverlay("tooltip", {
          component: "tooltip",
          state: "open",
          density,
          variant,
          telemetryId,
        });
        onTooltipShow?.();
      }}
      onTooltipHide={() => {
        trackOverlay("tooltip", {
          component: "tooltip",
          state: "close",
          density,
          variant,
          telemetryId,
        });
        onTooltipHide?.();
      }}
      {...(rest as TooltipProps)}
    />
  );
}
