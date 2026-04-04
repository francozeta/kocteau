import { createBrandOgImage } from "@/lib/og";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  return createBrandOgImage();
}
