// apps/web/src/app/layout.tsx
import "@vibe/core/tokens";
import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppProviders } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" data-theme="light">
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}