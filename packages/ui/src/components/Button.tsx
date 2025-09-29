"use client";

import { forwardRef, type ComponentProps, type ElementType } from "react";
import { Button } from "@vibe/core";
import { useInteractionEvents } from "../telemetry/events";
import type { DxComponentBaseProps } from "./types";

export interface DxButtonProps
  extends Omit<ComponentProps<typeof Button>, "kind" | "size" | "color">,
    DxComponentBaseProps {
  as?: ElementType;
}

const sizeMap = {
  sm: Button.sizes.SMALL,
  md: Button.sizes.MEDIUM,
} as const;

const kindMap = {
  primary: Button.kinds.PRIMARY,
  secondary: Button.kinds.SECONDARY,
  ghost: Button.kinds.TERTIARY,
  danger: Button.kinds.PRIMARY,
} as const;

const colorMap = {
  primary: Button.colors.PRIMARY,
  secondary: Button.colors.PRIMARY,
  ghost: Button.colors.PRIMARY,
  danger: Button.colors.NEGATIVE,
} as const;

export const DxButton = forwardRef<HTMLElement, DxButtonProps>(function DxButton(
  { size = "md", variant = "primary", density = "compact", telemetryId, onClick, ...rest },
  ref,
) {
  const { trackClick } = useInteractionEvents();

  return (
    <Button
      ref={ref}
      kind={kindMap[variant]}
      size={sizeMap[size]}
      color={colorMap[variant]}
      data-density={density}
      onClick={(event) => {
        trackClick("button", { component: "button", density, variant, size, telemetryId });
        onClick?.(event);
      }}
      {...rest}
    />
  );
});
