import { useMemo } from "react";
import { useTelemetry } from "./TelemetryProvider";
import type { DxDensity, DxVariant, DxSize } from "../components/types";

type CommonProps = {
  component: string;
  density?: DxDensity;
  variant?: DxVariant;
  size?: DxSize;
  telemetryId?: string;
};

export function useInteractionEvents() {
  const { capture } = useTelemetry();

  return useMemo(
    () => ({
      trackClick: (component: string, props: CommonProps) => {
        capture(`ui_click_${component}`, {
          component,
          density: props.density,
          variant: props.variant,
          size: props.size,
          telemetryId: props.telemetryId,
        });
      },
      trackOverlay: (overlay: string, props: CommonProps & { state: "open" | "close" }) => {
        capture("ui_open_overlay", {
          overlay,
          state: props.state,
          density: props.density,
          variant: props.variant,
          telemetryId: props.telemetryId,
        });
      },
      trackFormSubmit: (form: string, props: CommonProps & { method?: string }) => {
        capture("ui_submit_form", {
          form,
          method: props.method,
          density: props.density,
          telemetryId: props.telemetryId,
        });
      },
      trackReorder: (area: string, props: CommonProps & { from: number; to: number }) => {
        capture("ui_dd_reorder", {
          area,
          from: props.from,
          to: props.to,
          density: props.density,
          telemetryId: props.telemetryId,
        });
      },
    }),
    [capture],
  );
}
