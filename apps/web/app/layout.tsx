import type { Metadata } from "next";
import { Geist, Italianno, Merriweather } from "next/font/google";
import "./globals.css";
import JsonLd from "@/components/json-ld";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { getMetadataBase } from "@/lib/metadata";
import { buildSiteGraphJsonLd } from "@/lib/structured-data";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});
const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "700"],
});
const italianno = Italianno({
  subsets: ["latin"],
  variable: "--font-italianno",
  weight: "400",
});


export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  applicationName: "Kocteau",
  title: {
    default: "Kocteau",
    template: "%s | Kocteau",
  },
  description:
    "Music reviews, ratings, discovery, and public taste profiles on Kocteau.",
  openGraph: {
    siteName: "Kocteau",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(geist.variable, merriweather.variable, italianno.variable, "font-sans")}>
      <head>
        <link rel="preconnect" href="https://cdn-images.dzcdn.net" crossOrigin="" />
        <link rel="dns-prefetch" href="https://cdn-images.dzcdn.net" />
        <link
          rel="preconnect"
          href="https://ytxilnlmvioccfaomizi.supabase.co"
          crossOrigin=""
        />
        <link rel="dns-prefetch" href="https://ytxilnlmvioccfaomizi.supabase.co" />
      </head>
      <body
        className={`${geist.className} antialiased dark`}
      >
        <JsonLd data={buildSiteGraphJsonLd()} id="site-structured-data" />
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
