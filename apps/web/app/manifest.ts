import type { MetadataRoute } from "next";
import { documentThemeColors } from "@/lib/document-viewport";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kocteau",
    short_name: "Kocteau",
    description: "Music reviews and taste discovery by real listeners.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: documentThemeColors.landing,
    theme_color: documentThemeColors.landing,
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
