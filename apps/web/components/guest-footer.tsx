import Link from "next/link";

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
    "w-fit font-circular text-[12px] font-medium leading-5 text-muted-foreground/62 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

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
    <footer className="bg-[var(--kocteau-landing-canvas)]">
      <div className="mx-auto w-full max-w-[80rem] px-4 py-12 sm:px-6 sm:py-14 lg:px-10">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 sm:gap-6">
          {footerGroups.map((group) => (
            <section key={group.title} aria-labelledby={`footer-${group.title.toLowerCase()}`}>
              <h2
                id={`footer-${group.title.toLowerCase()}`}
                className="font-circular text-[12px] font-medium text-foreground"
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

      </div>
    </footer>
  );
}
