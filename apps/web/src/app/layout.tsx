// apps/web/src/app/layout.tsx
import "@vibe/core/tokens";
import "./globals.css";
import { AppProviders } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" data-theme="light">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}