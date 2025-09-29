"use client";

import Badge from "@vibe/core/dist/components/Badge/Badge";
import type { BadgeProps } from "@vibe/core/dist/components/Badge/Badge";
import type { ReactNode } from "react";
import type { DxComponentBaseProps } from "./types";

export interface DxBadgeProps
  extends Omit<BadgeProps, "type" | "children">,
    DxComponentBaseProps {
  children: ReactNode;
  value?: number;
  type?: "indicator" | "counter";
}

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
        count={value}
        children={children}
        data-density={density}
        {...rest}
      />
    );
  }

  const indicatorColor = variant === "danger" ? "notification" : "primary";

  return (
    <Badge
      type="indicator"
      color={indicatorColor}
      data-density={density}
      children={children}
      {...rest}
    />
  );
}
