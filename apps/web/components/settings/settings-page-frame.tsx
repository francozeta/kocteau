import type { ReactNode } from "react";

export default function SettingsPageFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full pb-16 pt-7 md:pb-20 md:pt-10">
      <header className="mb-8 space-y-1.5">
        <h1 className="text-balance font-pixel text-[1.45rem] font-medium tracking-[-0.025em] text-foreground">
          {title}
        </h1>
        <p className="max-w-[34rem] text-[13px] leading-5 text-muted-foreground">
          {description}
        </p>
      </header>
      {children}
    </div>
  );
}
