import "../globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "KOCTEAU - Authentication",
  description: "Authentication pages for KOCTEAU application.",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${geistSans.className} bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 antialiased`}>
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}







