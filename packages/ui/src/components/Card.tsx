"use client";

import { Box } from "@vibe/core";
import type { ComponentProps } from "react";
import type { DxComponentBaseProps } from "./types";

export interface DxCardProps
  extends Omit<ComponentProps<typeof Box>, "shadow" | "rounded" | "padding" | "border">,
    DxComponentBaseProps {
  padding?: ComponentProps<typeof Box>["padding"];
}

export function DxCard({
  variant = "primary",
  density = "compact",
  size = "md",
  padding = Box.paddings.MEDIUM,
  telemetryId: _telemetryId,
  ...rest
}: DxCardProps) {
  const shadow = variant === "ghost" ? Box.shadows.XS : Box.shadows.SMALL;
  const rounded = size === "sm" ? Box.roundeds.SMALL : Box.roundeds.MEDIUM;

  return (
    <Box
      border
      data-density={density}
      shadow={shadow}
      rounded={rounded}
      padding={padding}
      {...rest}
    />
  );
}
