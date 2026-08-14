import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { Providers } from "@/components/providers";
import { site } from "@/lib/site";
import "./globals.css";

const sans = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${site.nameEn} · Hua Hin`,
    template: `%s · ${site.nameEn}`,
  },
  description: "Men's barbershop in Thap Tai, Hua Hin. Open daily 08:00–21:00.",
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" translate="no" className={`notranslate ${sans.variable}`}>
      <body className={`${sans.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
