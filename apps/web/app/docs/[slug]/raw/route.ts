import markdown from "@/.generated/docs/markdown.json";
import { documentation, getDocumentationPage } from "@/lib/docs";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return documentation.map(({ slug }) => ({ slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getDocumentationPage(slug)) return new Response(null, { status: 404 });
  return new Response(markdown[slug as keyof typeof markdown], {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "x-robots-tag": "noindex",
    },
  });
}
