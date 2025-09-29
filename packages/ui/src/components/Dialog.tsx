"use client";

import { useEffect } from "react";
import { Modal, type ModalProps } from "@vibe/core";
import { useInteractionEvents } from "../telemetry/events";
import type { DxComponentBaseProps, DxSize } from "./types";

export interface DxDialogProps
  extends Omit<ModalProps, "size">,
    DxComponentBaseProps {
  show: boolean;
}

const sizeMap: Record<DxSize, ModalProps["size"]> = {
  sm: "small",
  md: "medium",
};

export function DxDialog({
  size = "md",
  variant = "primary",
  density = "compact",
  telemetryId,
  show,
  onClose,
  alertModal,
  ...rest
}: DxDialogProps) {
  const { trackOverlay } = useInteractionEvents();

  useEffect(() => {
    if (typeof show === "boolean") {
      trackOverlay("dialog", {
        component: "dialog",
        state: show ? "open" : "close",
        density,
        variant,
        size,
        telemetryId,
      });
    }
  }, [density, show, size, telemetryId, trackOverlay, variant]);

  return (
    <Modal
      show={show}
      size={sizeMap[size]}
      data-density={density}
      closeButtonTheme={variant === "ghost" ? "white" : "dark"}
      alertModal={variant === "danger" || alertModal}
      onClose={(event) => {
        trackOverlay("dialog", {
          component: "dialog",
          state: "close",
          density,
          variant,
          size,
          telemetryId,
        });
        onClose?.(event);
      }}
      {...rest}
    />
  );
}
