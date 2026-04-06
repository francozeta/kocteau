import type { Metadata } from "next";
import { Geist, Merriweather } from "next/font/google";
import "./globals.css";
import JsonLd from "@/components/json-ld";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { getMetadataBase } from "@/lib/metadata";
import { buildSiteGraphJsonLd } from "@/lib/structured-data";

const merriweatherHeading = Merriweather({subsets:['latin'],variable:'--font-heading'});

const geist = Geist({subsets:['latin'],variable:'--font-sans'});
const merriweather = Merriweather({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '700'],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
    icon: "/logo-k.png",
    shortcut: "/logo-k.png",
    apple: "/logo-k.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn( merriweather.variable, "font-sans", geist.className, merriweatherHeading.variable)}>
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
        className={`${geistSans.className} antialiased dark`}
      >
        <JsonLd data={buildSiteGraphJsonLd()} id="site-structured-data" />
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
