"use client";

import Skeleton from "@vibe/core/dist/components/Skeleton/Skeleton";
import type { ComponentProps } from "react";
import type { DxComponentBaseProps } from "./types";

export interface DxSkeletonProps
  extends Omit<ComponentProps<typeof Skeleton>, "size">,
    DxComponentBaseProps {}

const sizeMap = {
  sm: Skeleton.sizes.TEXT.SMALL,
  md: Skeleton.sizes.TEXT.MEDIUM,
} as const;

export function DxSkeleton({ size = "md", density = "compact", ...rest }: DxSkeletonProps) {
  return <Skeleton size={sizeMap[size]} data-density={density} {...rest} />;
}
