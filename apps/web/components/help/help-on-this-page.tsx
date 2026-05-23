import type { HelpDocument } from "@/lib/help";

type HelpOnThisPageProps = {
  document: HelpDocument;
};

export default function HelpOnThisPage({ document }: HelpOnThisPageProps) {
  return (
    <nav aria-label="On this page" className="space-y-3">
      <p className="text-[13px] font-semibold text-foreground">On this page</p>
      <div className="space-y-1.5">
        {document.headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className="block rounded-[0.42rem] py-1 text-[12px] leading-5 text-muted-foreground/64 transition-colors hover:text-foreground"
          >
            {heading.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
