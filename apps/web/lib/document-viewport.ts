import type { Viewport } from "next";
import { getCurrentViewerProfile } from "@/lib/auth/server";

export const documentThemeColors = {
  background: "#0a0a0a",
  landing: "#000000",
  canvas: "#040404",
  shell: "#101010",
  auth: "#050505",
} as const;

export async function getAppViewport(): Promise<Viewport> {
  const profile = await getCurrentViewerProfile();

  return {
    themeColor: profile
      ? documentThemeColors.canvas
      : [
          { media: "(max-width: 1023px)", color: documentThemeColors.shell },
          { media: "(min-width: 1024px)", color: documentThemeColors.canvas },
        ],
  };
}
