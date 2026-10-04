"use client";

import { useState, type ReactNode } from "react";

export default function CodeBlock({ children, text }: { children: ReactNode; text: string }) {
  const [message, setMessage] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Copied");
    } catch {
      setMessage("Select the code to copy it.");
    }
  }

  return (
    <div className="my-5 min-w-0 rounded-lg border border-foreground/12 bg-foreground/[0.035]">
      <div className="flex min-h-10 items-center justify-end gap-3 border-b border-foreground/10 px-3">
        <span role="status" className="text-xs text-muted-foreground">{message}</span>
        <button type="button" onClick={copy} className="min-h-10 px-2 text-xs font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">Copy</button>
      </div>
      <pre tabIndex={0} aria-label="Code example" className="overflow-x-auto p-4 text-sm leading-6 text-foreground/90 focus-visible:outline-2 focus-visible:outline-foreground [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">{children}</pre>
    </div>
  );
}
