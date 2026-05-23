import Link from "next/link";

export default function HelpNotFound() {
  return (
    <div className="max-w-2xl">
      <p className="text-[13px] font-medium text-muted-foreground/62">Help center</p>
      <h1 className="mt-5 font-heading text-[2rem] font-bold leading-tight text-foreground sm:text-[2.45rem]">
        This note is not here.
      </h1>
      <p className="mt-5 max-w-[58ch] text-[0.98rem] leading-7 text-muted-foreground/84">
        The help page may have moved while Kocteau is still shaping its public
        policy surface.
      </p>
      <Link
        href="/help"
        className="mt-7 inline-flex h-10 items-center rounded-[0.5rem] border border-[var(--kocteau-line-soft)] px-3 text-[13px] font-medium text-foreground transition-colors hover:border-[var(--kocteau-line)] hover:bg-foreground/[0.035]"
      >
        Back to help
      </Link>
    </div>
  );
}
