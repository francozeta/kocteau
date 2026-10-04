import { Children, isValidElement, type ReactNode } from "react";
import type { MDXComponents } from "mdx/types";
import { useMDXComponents as getBaseComponents } from "@/mdx-components";
import CodeBlock from "@/components/docs/code-block";

function codeText(children: ReactNode): string {
  return Children.toArray(children).map((child) => {
    if (typeof child === "string" || typeof child === "number") return String(child);
    if (isValidElement<{ children?: ReactNode }>(child)) return codeText(child.props.children);
    return "";
  }).join("");
}

export function getDocumentationComponents(): MDXComponents {
  return getBaseComponents({
    h2: ({ children, id }) => <h2 id={id} className="mt-12 scroll-mt-24 text-balance text-xl font-medium leading-tight text-foreground first:mt-0"><a href={`#${id}`} className="underline-offset-4 hover:underline">{children}</a></h2>,
    h3: ({ children, id }) => <h3 id={id} className="mt-7 scroll-mt-24 text-base font-semibold text-foreground"><a href={`#${id}`} className="underline-offset-4 hover:underline">{children}</a></h3>,
    pre: ({ children }) => <CodeBlock text={codeText(children)}>{children}</CodeBlock>,
    table: ({ children }) => (
      <div tabIndex={0} aria-label="Reference table" className="my-6 overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
        <table className="w-full border-collapse text-left text-sm leading-6">{children}</table>
      </div>
    ),
    th: ({ children }) => <th className="border-b border-foreground/20 px-3 py-3 font-medium text-foreground first:pl-0">{children}</th>,
    td: ({ children }) => <td className="border-b border-foreground/10 px-3 py-3 align-top text-muted-foreground first:pl-0">{children}</td>,
    h4: ({ children, ...props }) => <h4 className="mt-6 scroll-mt-24 text-sm font-semibold text-foreground" {...props}>{children}</h4>,
  });
}
