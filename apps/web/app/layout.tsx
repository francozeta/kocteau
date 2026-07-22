import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Merriweather } from "next/font/google";
import "./globals.css";
import JsonLd from "@/components/json-ld";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { getMetadataBase } from "@/lib/metadata";
import { buildSiteGraphJsonLd } from "@/lib/structured-data";

const supabaseAssetOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});
const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "700"],
});
export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  applicationName: "Kocteau",
  title: {
    default: "Kocteau",
    template: "%s | Kocteau",
  },
  description: "Music reviews by real listeners.",
  openGraph: {
    siteName: "Kocteau",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(geist.variable, merriweather.variable, "font-sans")}>
      <head>
        <link rel="preconnect" href="https://cdn-images.dzcdn.net" crossOrigin="" />
        <link rel="dns-prefetch" href="https://cdn-images.dzcdn.net" />
        {supabaseAssetOrigin ? (
          <>
            <link rel="preconnect" href={supabaseAssetOrigin} crossOrigin="" />
            <link rel="dns-prefetch" href={supabaseAssetOrigin} />
          </>
        ) : null}
      </head>
      <body
        className={`${geist.className} antialiased dark`}
      >
        <JsonLd data={buildSiteGraphJsonLd()} id="site-structured-data" />
        {children}
        <Analytics />
        <SpeedInsights />
        <Toaster />
      </body>
    </html>
  );
}
