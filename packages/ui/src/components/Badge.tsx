"use client";

import { Badge, type BadgeProps } from "@vibe/core";
import type { ReactNode } from "react";
import type { DxComponentBaseProps, DxVariant } from "./types";

export interface DxBadgeProps
  extends Omit<BadgeProps, "type" | "children" | "color">,
    DxComponentBaseProps {
  children: ReactNode;
  value?: number;
  type?: "indicator" | "counter";
}

type CounterBadgeColor = "primary" | "dark" | "negative" | "light";
type IndicatorBadgeColor = "primary" | "notification";

const counterColorMap: Record<DxVariant, CounterBadgeColor> = {
  primary: "primary",
  secondary: "dark",
  ghost: "light",
  danger: "negative",
};

const indicatorColorMap: Record<DxVariant, IndicatorBadgeColor> = {
  primary: "primary",
  secondary: "primary",
  ghost: "primary",
  danger: "notification",
};

export function DxBadge({
  variant = "primary",
  density = "compact",
  size = "md",
  value,
  type = "indicator",
  telemetryId: _telemetryId,
  children,
  ...rest
}: DxBadgeProps) {
  if (type === "counter") {
    return (
      <Badge
        type="counter"
        color={counterColorMap[variant]}
        count={value}
        data-density={density}
        {...rest}
      >
        {children}
      </Badge>
    );
  }

  return (
    <Badge
      type="indicator"
      color={indicatorColorMap[variant]}
      data-density={density}
      {...rest}
    >
      {children}
    </Badge>
  );
}
