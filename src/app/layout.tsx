import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Dancing_Script, Jost, Noto_Serif_Devanagari } from "next/font/google";
import { Providers } from "@/components/providers";
import { AuthModal } from "@/components/store/auth-modal";
import { Toaster } from "@/components/ui/toaster";
import { getIsAdmin, getSessionUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { STORE } from "@/lib/store-config";
import "./globals.css";

const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});
const dancing = Dancing_Script({ subsets: ["latin"], weight: ["700"], variable: "--font-dancing", display: "swap" });
const devanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  weight: ["500"],
  variable: "--font-devanagari",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: `${STORE.fullName} — Kurti, Suit, Saree & Cord Set`,
    template: `%s | ${STORE.name} by ${STORE.owner}`,
  },
  description: STORE.description,
  applicationName: STORE.fullName,
  keywords: ["kurti", "suit", "saree", "cord set", "ethnic wear", "ladies collection", "Mini Closet", "Arti Chandra"],
  openGraph: {
    type: "website",
    siteName: STORE.fullName,
    locale: "en_IN",
    title: STORE.fullName,
    description: STORE.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#9B1B54",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [user, isAdmin] = await Promise.all([getSessionUser(), getIsAdmin()]);

  return (
    <html
      lang="en-IN"
      className={`${jost.variable} ${cormorant.variable} ${dancing.variable} ${devanagari.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers user={user} isAdmin={isAdmin}>
          {children}
          <AuthModal />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
