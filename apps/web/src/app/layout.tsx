// apps/web/src/app/layout.tsx
import "@vibe/core/tokens";
import { DxThemeProvider } from "@dx/ui";
import "./globals.css";
import { Geist, Geist_Mono } from "geist/font";
const geistSans = Geist({ variable: "--font-sans" });
const geistMono = Geist_Mono({ variable: "--font-mono" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" data-theme="light">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <DxThemeProvider>{children}</DxThemeProvider>
      </body>
    </html>
  );
}
