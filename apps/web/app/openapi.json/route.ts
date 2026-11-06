import { openApiDocument } from "@/lib/agent-openapi";

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(openApiDocument), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
