import "../globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "KURA - Authentication",
  description: "Authentication pages for KURA application.",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${geistSans.className} bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 dark antialiased text-neutral-100 `}>
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}







