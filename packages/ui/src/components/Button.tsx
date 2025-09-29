"use client";

import { forwardRef, type ComponentProps, type ElementType } from "react";
import { Button } from "@vibe/core";
import { useInteractionEvents } from "../telemetry/events";
import type { DxComponentBaseProps, DxSize, DxVariant } from "./types";

export interface DxButtonProps
  extends Omit<ComponentProps<typeof Button>, "kind" | "size" | "color">,
    DxComponentBaseProps {
  as?: ElementType;
}

type ButtonSize = ComponentProps<typeof Button>["size"];
type ButtonKind = ComponentProps<typeof Button>["kind"];
type ButtonColor = ComponentProps<typeof Button>["color"];

const sizeMap: Record<DxSize, ButtonSize> = {
  sm: Button.sizes.SMALL,
  md: Button.sizes.MEDIUM,
};

const kindMap: Record<DxVariant, ButtonKind> = {
  primary: Button.kinds.PRIMARY,
  secondary: Button.kinds.SECONDARY,
  ghost: Button.kinds.TERTIARY,
  danger: Button.kinds.PRIMARY,
};

const colorMap: Record<DxVariant, ButtonColor> = {
  primary: Button.colors.PRIMARY,
  secondary: Button.colors.PRIMARY,
  ghost: Button.colors.PRIMARY,
  danger: Button.colors.NEGATIVE,
};

type ButtonClickEvent = Parameters<
  NonNullable<ComponentProps<typeof Button>["onClick"]>
>[0];

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
      onClick={(event: ButtonClickEvent) => {
        trackClick("button", { component: "button", density, variant, size, telemetryId });
        onClick?.(event);
      }}
      {...rest}
    />
  );
});
