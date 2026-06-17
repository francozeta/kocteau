import type { AppleMusicArtwork } from "./types";

type AppleMusicArtworkDictionary = {
  url?: string | null;
  width?: number | null;
  height?: number | null;
  bgColor?: string | null;
  textColor1?: string | null;
  textColor2?: string | null;
};

export function buildAppleMusicArtworkUrl(
  templateUrl: string | null | undefined,
  size = 1000,
) {
  if (!templateUrl) {
    return null;
  }

  return templateUrl
    .replace("{w}", String(size))
    .replace("{h}", String(size))
    .replace("{f}", "jpg");
}

export function normalizeAppleMusicArtwork(
  dictionary: AppleMusicArtworkDictionary | null | undefined,
  size = 1000,
): AppleMusicArtwork {
  const templateUrl = dictionary?.url ?? null;

  return {
    url: buildAppleMusicArtworkUrl(templateUrl, size),
    templateUrl,
    width: typeof dictionary?.width === "number" ? dictionary.width : null,
    height: typeof dictionary?.height === "number" ? dictionary.height : null,
    bgColor: dictionary?.bgColor ?? null,
    textColor1: dictionary?.textColor1 ?? null,
    textColor2: dictionary?.textColor2 ?? null,
  };
}
