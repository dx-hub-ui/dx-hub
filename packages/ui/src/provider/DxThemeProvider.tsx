// packages/ui/src/provider/DxThemeProvider.tsx
"use client";
import { PropsWithChildren, useEffect, useState } from "react";

type Theme = "light" | "dark";

export function DxThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<Theme>(() => (typeof window !== "undefined" && (localStorage.getItem("dx-theme") as Theme)) || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("dx-theme", theme);
  }, [theme]);

  return (
    <>
      {/* você pode expor um context se quiser ler/setar o tema em qualquer lugar */}
      {children}
    </>
  );
}
