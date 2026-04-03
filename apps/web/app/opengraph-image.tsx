import {
  createBrandOgImage,
  ogContentType,
  ogSize,
} from "@/lib/og";

export const runtime = "nodejs";
export const revalidate = 300;
export const alt = "Kocteau";
export const size = ogSize;
export const contentType = ogContentType;

export default async function OpenGraphImage() {
  return createBrandOgImage();
}
