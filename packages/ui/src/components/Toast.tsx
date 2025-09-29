"use client";

import { useEffect } from "react";
import { Toast } from "@vibe/core";
import type { ComponentProps } from "react";
import { useInteractionEvents } from "../telemetry/events";
import type { DxComponentBaseProps } from "./types";

export interface DxToastProps
  extends Omit<ComponentProps<typeof Toast>, "type">,
    Omit<DxComponentBaseProps, "variant"> {
  variant?: DxComponentBaseProps["variant"] | "success" | "info";
}

const typeMap = {
  primary: Toast.types.NORMAL,
  secondary: Toast.types.NORMAL,
  ghost: Toast.types.NORMAL,
  danger: Toast.types.NEGATIVE,
  success: Toast.types.POSITIVE,
  info: Toast.types.NORMAL,
} as const;

export function DxToast({
  variant = "primary",
  density = "compact",
  telemetryId,
  open,
  onClose,
  autoHideDuration = 4000,
  children,
  ...rest
}: DxToastProps) {
  const { trackOverlay } = useInteractionEvents();
  const trackingVariant: DxComponentBaseProps["variant"] =
    variant === "danger" || variant === "secondary" || variant === "ghost"
      ? variant
      : "primary";

  useEffect(() => {
    if (typeof open === "boolean") {
      trackOverlay("toast", {
        component: "toast",
        state: open ? "open" : "close",
        density,
        variant: trackingVariant,
        telemetryId,
      });
    }
  }, [density, open, telemetryId, trackOverlay, trackingVariant]);

  return (
    <Toast
      open={open}
      autoHideDuration={autoHideDuration}
      type={typeMap[variant as keyof typeof typeMap] ?? Toast.types.NORMAL}
      data-density={density}
      onClose={() => {
        trackOverlay("toast", {
          component: "toast",
          state: "close",
          density,
          variant: trackingVariant,
          telemetryId,
        });
        onClose?.();
      }}
      {...rest}
    >
      {children}
    </Toast>
  );
}
