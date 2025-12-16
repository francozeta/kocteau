import "../globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kocteau | Authentication",
  description: "Authentication pages for Kocteau application.",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 antialiased">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}







