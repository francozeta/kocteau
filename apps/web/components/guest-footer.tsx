import Link from "next/link";

import BrandLogo from "@/components/brand-logo";

const footerGroups = [
  {
    title: "Explore",
    links: [
      { label: "Recent reviews", href: "/reviews" },
      { label: "Explore music", href: "/search" },
      { label: "Atlas", href: "/atlas" },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "Help", href: "/help" },
      { label: "Changelog", href: "/help/changelog" },
      { label: "Accessibility", href: "/help/accessibility" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Join Kocteau", href: "/signup" },
      { label: "GitHub", href: "https://github.com/francozeta/kocteau" },
      { label: "Discord", href: "https://discord.gg/FgrNjkPa8" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/help/terms" },
      { label: "Privacy", href: "/help/privacy" },
      { label: "Cookies", href: "/help/cookies" },
    ],
  },
] as const;

function FooterLink({ href, label }: { href: string; label: string }) {
  const className =
    "w-fit text-[12px] leading-5 text-muted-foreground/62 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export default function GuestFooter() {
  return (
    <footer className="border-t border-foreground/[0.07] bg-[var(--kocteau-canvas)]">
      <div className="mx-auto w-full max-w-[80rem] px-4 py-14 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Kocteau home"
            className="flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <BrandLogo iconClassName="size-5" />
            <span className="font-serif text-[16px] font-semibold text-foreground">
              Kocteau
            </span>
          </Link>
          <p className="text-[10px] text-muted-foreground/42">kocteau.com</p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-11 sm:mt-14 sm:grid-cols-4 sm:gap-6">
          {footerGroups.map((group) => (
            <section key={group.title} aria-labelledby={`footer-${group.title.toLowerCase()}`}>
              <h2
                id={`footer-${group.title.toLowerCase()}`}
                className="text-[12px] font-semibold text-foreground"
              >
                {group.title}
              </h2>
              <div className="mt-5 flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <FooterLink key={link.label} {...link} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 border-t border-foreground/[0.06] pt-5 sm:mt-16">
          <p className="text-[10px] text-muted-foreground/42">
            © 2026 Kocteau
          </p>
        </div>
      </div>
    </footer>
  );
}
