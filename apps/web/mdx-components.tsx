import Link from "next/link";
import type { ComponentProps } from "react";
import type { MDXComponents } from "mdx/types";
import { cn } from "@/lib/utils";

function HelpLink({
  href,
  className,
  ...props
}: ComponentProps<"a">) {
  const linkClassName = cn(
    "font-medium text-foreground underline decoration-foreground/24 underline-offset-4 transition-colors hover:decoration-foreground/55",
    className,
  );

  if (href?.startsWith("/")) {
    return <Link href={href} className={linkClassName} {...props} />;
  }

  return (
    <a
      href={href}
      className={linkClassName}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noreferrer" : undefined}
      {...props}
    />
  );
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ className, ...props }) => (
      <h2
        className={cn(
          "mt-12 scroll-m-24 text-balance font-heading text-[1.22rem] font-bold leading-tight text-foreground first:mt-0",
          className,
        )}
        {...props}
      />
    ),
    h3: ({ className, ...props }) => (
      <h3
        className={cn(
          "mt-7 scroll-m-24 text-[0.92rem] font-semibold leading-snug text-foreground",
          className,
        )}
        {...props}
      />
    ),
    p: ({ className, ...props }) => (
      <p
        className={cn(
          "mt-4 max-w-[68ch] text-pretty text-[0.94rem] leading-7 text-muted-foreground/88",
          className,
        )}
        {...props}
      />
    ),
    ul: ({ className, ...props }) => (
      <ul
        className={cn(
          "mt-4 max-w-[68ch] list-disc space-y-2 pl-5 text-[0.94rem] leading-7 text-muted-foreground/88",
          className,
        )}
        {...props}
      />
    ),
    ol: ({ className, ...props }) => (
      <ol
        className={cn(
          "mt-4 max-w-[68ch] list-decimal space-y-2 pl-5 text-[0.94rem] leading-7 text-muted-foreground/88",
          className,
        )}
        {...props}
      />
    ),
    li: ({ className, ...props }) => (
      <li className={cn("pl-1 marker:text-foreground/34", className)} {...props} />
    ),
    strong: ({ className, ...props }) => (
      <strong
        className={cn("font-semibold text-foreground/92", className)}
        {...props}
      />
    ),
    hr: ({ className, ...props }) => (
      <hr
        className={cn("my-9 border-0 border-t border-[var(--kocteau-line-soft)]", className)}
        {...props}
      />
    ),
    blockquote: ({ className, ...props }) => (
      <blockquote
        className={cn(
          "mt-6 max-w-[68ch] border-l border-[var(--kocteau-line)] pl-4 text-[0.94rem] leading-7 text-foreground/78",
          className,
        )}
        {...props}
      />
    ),
    img: ({ className, alt = "", ...props }) => (
      <img
        className={cn(
          "mt-6 w-full rounded-[0.72rem] bg-foreground/[0.035] object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.1)]",
          className,
        )}
        alt={alt}
        loading="lazy"
        decoding="async"
        {...props}
      />
    ),
    code: ({ className, ...props }) => (
      <code
        className={cn(
          "rounded-[0.32rem] bg-foreground/[0.055] px-1.5 py-0.5 text-[0.84em] text-foreground/86",
          className,
        )}
        {...props}
      />
    ),
    pre: ({ className, ...props }) => (
      <pre
        className={cn(
          "mt-5 max-w-[68ch] overflow-x-auto rounded-[0.72rem] bg-foreground/[0.045] p-4 text-[0.88rem] leading-6 text-foreground/86",
          className,
        )}
        {...props}
      />
    ),
    a: HelpLink,
    ...components,
  };
}
