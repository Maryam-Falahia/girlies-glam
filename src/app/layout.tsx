import type { Metadata } from "next";
import { AppFrame } from "@/components/app-frame";
import { PreferencesProvider } from "@/lib/preferences";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

export const instant = false;

export const metadata: Metadata = {
  title: "Girlies Glam",
  description: "Feminine fashion for everyday sparkle. Makhwar, scarves, and jewellery from Muscat, Oman.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <PreferencesProvider>
          <StoreProvider>
            <AppFrame>{children}</AppFrame>
          </StoreProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
