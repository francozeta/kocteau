"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type AuthFormShellProps = {
  title: string;
  description?: ReactNode;
  alternateLabel?: string;
  alternateHref?: string;
  alternateCta?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  widthClassName?: string;
};

export default function AuthFormShell({
  title,
  description,
  alternateLabel,
  alternateHref,
  alternateCta,
  children,
  footer,
  className,
  widthClassName,
}: AuthFormShellProps) {
  return (
    <main className="kocteau-auth-background relative isolate flex overflow-hidden bg-background text-foreground">
      <Image
        src="/background-auth.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 object-cover"
      />

      <Link
        href="/"
        className="absolute left-4 top-4 z-10 inline-flex h-9 items-center gap-1.5 rounded-[0.45rem] px-2.5 text-xs font-medium text-muted-foreground transition-[background-color,color,transform] duration-150 ease-out hover:bg-white/[0.055] hover:text-foreground active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 sm:left-6 sm:top-6"
      >
        <ChevronLeft className="size-3.5" />
        Home
      </Link>

      <div className="relative z-[3] mx-auto flex min-h-full w-full items-center justify-center px-5 py-16 sm:px-8">
        <div className={cn("w-full max-w-[25.75rem]", widthClassName)}>
          <div className={cn("flex flex-col gap-6", className)}>
            <FieldGroup className="gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <Link
                  href="/"
                  className="mb-3 flex size-10 items-center justify-center rounded-[0.55rem] border border-white/10 bg-white/[0.035] shadow-[0_0_0_1px_rgba(0,0,0,0.32),0_16px_48px_rgba(0,0,0,0.28)] transition-[background-color,transform] duration-150 ease-out hover:bg-white/[0.055] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                  aria-label="Kocteau home"
                >
                  <BrandLogo priority iconClassName="h-[1.35rem] w-[1.35rem]" />
                </Link>

                <h1 className="text-balance text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.38rem]">
                  {title}
                </h1>

                {description ? (
                  <FieldDescription className="max-w-[20rem] text-center text-sm leading-5 text-muted-foreground">
                    {description}
                  </FieldDescription>
                ) : null}

                {alternateLabel && alternateHref && alternateCta ? (
                  <FieldDescription className="text-center text-sm text-muted-foreground">
                    {alternateLabel}{" "}
                    <Link
                      href={alternateHref}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {alternateCta}
                    </Link>
                  </FieldDescription>
                ) : null}
              </div>

              {children}
            </FieldGroup>
          </div>
        </div>
      </div>

      {footer ? (
        <footer className="absolute inset-x-0 bottom-5 z-10 flex justify-center px-5 text-center text-xs text-muted-foreground">
          {footer}
        </footer>
      ) : null}
    </main>
  );
}
