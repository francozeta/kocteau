import OpenGraphImage from "./opengraph-image";

export const runtime = "nodejs";
export const revalidate = 300;
export const alt = "Kocteau";
export const size = {
  width: 1200,
  height: 630,
} as const;
export const contentType = "image/png";

export default OpenGraphImage;
