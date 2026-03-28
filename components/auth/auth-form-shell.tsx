"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type AuthFormShellProps = {
  title: string;
  alternateLabel: string;
  alternateHref: string;
  alternateCta: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export default function AuthFormShell({
  title,
  alternateLabel,
  alternateHref,
  alternateCta,
  children,
  footer,
  className,
}: AuthFormShellProps) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6", className)}>
          <FieldGroup className="rounded-[1.75rem] border border-border/25 bg-card/18 p-5 shadow-none">
            <div className="flex flex-col items-center gap-2 text-center">
              <Link
                href="/"
                className="flex flex-col items-center gap-2 font-medium transition-opacity hover:opacity-80"
              >
                <div className="flex size-9 items-center justify-center rounded-xl border border-border/25 bg-background/55">
                  <BrandLogo priority iconClassName="h-5 w-5" />
                </div>
                <span className="sr-only">Kocteau</span>
              </Link>
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              <FieldDescription className="text-center">
                {alternateLabel}{" "}
                <Link href={alternateHref}>{alternateCta}</Link>
              </FieldDescription>
            </div>

            {children}
          </FieldGroup>

          {footer ? (
            <FieldDescription className="px-6 text-center">
              {footer}
            </FieldDescription>
          ) : null}
        </div>
      </div>
    </main>
  );
}
