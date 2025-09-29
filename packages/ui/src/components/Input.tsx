"use client";

import { forwardRef, type ComponentProps, type Ref } from "react";
import { TextField } from "@vibe/core";
import { useInteractionEvents } from "../telemetry/events";
import type { DxComponentBaseProps } from "./types";

export interface DxInputProps
  extends Omit<ComponentProps<typeof TextField>, "size" | "validation" | "onChange">,
    DxComponentBaseProps {
  onChange?: (value: string) => void;
  validationStatus?: "success" | "error";
}

const sizeMap = {
  sm: TextField.sizes.SMALL,
  md: TextField.sizes.MEDIUM,
} as const;

export const DxInput = forwardRef<HTMLInputElement, DxInputProps>(function DxInput(
  {
    size = "md",
    variant = "primary",
    density = "compact",
    telemetryId,
    validationStatus,
    onChange,
    onBlur,
    onKeyDown,
    ...rest
  },
  ref: Ref<HTMLInputElement>,
) {
  const { trackFormSubmit } = useInteractionEvents();

  return (
    <TextField
      ref={ref}
      size={sizeMap[size]}
      data-density={density}
      validation={validationStatus ? { status: validationStatus } : undefined}
      onChange={(value) => {
        onChange?.(value);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        trackFormSubmit(rest.name ?? "input", {
          component: "input",
          density,
          variant,
          size,
          telemetryId,
        });
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          trackFormSubmit(rest.name ?? "input", {
            component: "input",
            density,
            variant,
            size,
            telemetryId,
          });
        }
        onKeyDown?.(event);
      }}
      {...rest}
    />
  );
});
