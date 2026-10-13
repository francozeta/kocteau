import { buildDocumentationIndex } from "@/lib/docs";
import { getMetadataBase } from "@/lib/metadata";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildDocumentationIndex(getMetadataBase().origin), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
