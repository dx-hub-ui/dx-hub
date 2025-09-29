"use client";
import type { PropsWithChildren } from "react";

export function DxThemeProvider({ children }: PropsWithChildren) {
  return children as unknown as JSX.Element;
}