"use client";

import { useEffect } from "react";
import { Modal, type ModalProps } from "@vibe/core";
import { useInteractionEvents } from "../telemetry/events";
import type { DxComponentBaseProps, DxSize } from "./types";

export interface DxDialogProps
  extends Omit<ModalProps, "width" | "onClose" | "alertDialog">,
    DxComponentBaseProps {
  show: boolean;
  onClose?: () => void;
  alertModal?: boolean;
}

const widthMap: Record<DxSize, NonNullable<ModalProps["width"]>> = {
  sm: Modal.width.DEFAULT,
  md: Modal.width.FULL_WIDTH,
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
      width={widthMap[size]}
      data-density={density}
      alertDialog={variant === "danger" || alertModal}
      onClose={() => {
        trackOverlay("dialog", {
          component: "dialog",
          state: "close",
          density,
          variant,
          size,
          telemetryId,
        });
        onClose?.();
      }}
      {...rest}
    />
  );
}
