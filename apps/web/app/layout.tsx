import type { Metadata } from "next";
import { Geist, Merriweather } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { getMetadataBase } from "@/lib/metadata";

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
  description: "Social platform for music review and curation",
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
    <html lang="en" className={cn( merriweather.variable, "font-sans", geist.variable, merriweatherHeading.variable)}>
      <body
        className={`${geistSans.className} antialiased dark`}
      >
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
