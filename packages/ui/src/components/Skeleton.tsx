"use client";

import { Skeleton } from "@vibe/core";
import type { ComponentProps } from "react";
import type { DxComponentBaseProps, DxSize } from "./types";

export interface DxSkeletonProps
  extends Omit<ComponentProps<typeof Skeleton>, "size">,
    DxComponentBaseProps {}

type SkeletonSize = ComponentProps<typeof Skeleton>["size"];

const sizeMap: Record<DxSize, SkeletonSize> = {
  sm: Skeleton.sizes.TEXT.SMALL,
  md: Skeleton.sizes.TEXT.P,
};

export function DxSkeleton({ size = "md", density = "compact", ...rest }: DxSkeletonProps) {
  return <Skeleton size={sizeMap[size]} data-density={density} {...rest} />;
}
