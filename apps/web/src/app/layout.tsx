// ✅ correct import
import { Geist, Geist_Mono } from "geist/font";

const geistSans = Geist({ variable: "--font-sans" });
const geistMono = Geist_Mono({ variable: "--font-mono" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
