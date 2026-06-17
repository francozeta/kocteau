import { normalizeAppleMusicArtwork } from "./artwork";
import type {
  AppleMusicPlaylistMetadata,
  AppleMusicPlaylistTrack,
  AppleMusicPlaylistUrlParts,
} from "./types";

type UnknownRecord = Record<string, unknown>;

type AppleMusicServerDataTrackLockup = {
  title?: string;
  duration?: number;
  contentDescriptor?: {
    identifiers?: {
      storeAdamID?: string;
    };
    url?: string;
  };
  artwork?: {
    dictionary?: {
      url?: string;
      width?: number;
      height?: number;
      bgColor?: string;
      textColor1?: string;
      textColor2?: string;
    };
  };
  subtitleLinks?: Array<{
    title?: string;
    segue?: AppleMusicServerDataSegue;
  }>;
  tertiaryLinks?: Array<{
    title?: string;
    segue?: AppleMusicServerDataSegue;
  }>;
};

type AppleMusicServerDataSegue = {
  destination?: {
    contentDescriptor?: {
      identifiers?: {
        storeAdamID?: string;
      };
    };
  };
};

type AppleMusicServerDataTrackList = {
  id?: string;
  itemKind?: string;
  items?: AppleMusicServerDataTrackLockup[];
};

type AppleMusicServerDataPlaylistHeader = {
  id?: string;
  title?: string;
  subtitleLinks?: Array<{ title?: string }>;
  trackCount?: number;
  artwork?: {
    dictionary?: {
      url?: string;
      width?: number;
      height?: number;
      bgColor?: string;
      textColor1?: string;
      textColor2?: string;
    };
  };
};

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object";
}

function walkJson(node: unknown, visit: (record: UnknownRecord) => void) {
  if (!isRecord(node) && !Array.isArray(node)) {
    return;
  }

  if (isRecord(node)) {
    visit(node);
    Object.values(node).forEach((value) => walkJson(value, visit));
    return;
  }

  node.forEach((value) => walkJson(value, visit));
}

function getMetaContent(html: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(
    new RegExp(`<meta\\s+[^>]*(?:name|property)=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>`, "i"),
  );

  return match?.[1] ? decodeHtml(match[1]) : null;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractSerializedServerData(html: string) {
  const match = html.match(
    /<script[^>]*id=["']serialized-server-data["'][^>]*>([\s\S]*?)<\/script>/i,
  );

  if (!match?.[1]) {
    return null;
  }

  return JSON.parse(match[1]) as unknown;
}

function getLinkedAdamId(link: { segue?: AppleMusicServerDataSegue } | undefined) {
  return link?.segue?.destination?.contentDescriptor?.identifiers?.storeAdamID ?? null;
}

function parseTrackLockup(
  item: AppleMusicServerDataTrackLockup,
  position: number,
): AppleMusicPlaylistTrack | null {
  const appleMusicId = item.contentDescriptor?.identifiers?.storeAdamID;
  const title = item.title;

  if (!appleMusicId || !title) {
    return null;
  }

  const artistLink = item.subtitleLinks?.[0];
  const albumLink = item.tertiaryLinks?.[0];

  return {
    title,
    artist: artistLink?.title ?? null,
    album: albumLink?.title ?? null,
    durationMs: typeof item.duration === "number" ? item.duration : null,
    appleMusicUrl: item.contentDescriptor?.url ?? null,
    appleMusicId,
    artistAppleMusicId: getLinkedAdamId(artistLink),
    albumAppleMusicId: getLinkedAdamId(albumLink),
    position,
    artwork: normalizeAppleMusicArtwork(item.artwork?.dictionary),
  };
}

function parseDurationText(description: string | null) {
  if (!description) {
    return null;
  }

  const match = description.match(/Duraci[oó]n:\s*([^.]*)\./i);
  return match?.[1]?.trim() ?? null;
}

function parseTrackCount(description: string | null) {
  if (!description) {
    return null;
  }

  const match = description.match(/(\d+)\s*canciones/i);
  return match?.[1] ? Number.parseInt(match[1], 10) : null;
}

function parseMetadata(
  html: string,
  parts: AppleMusicPlaylistUrlParts,
  serverData: unknown,
): AppleMusicPlaylistMetadata {
  const headers: AppleMusicServerDataPlaylistHeader[] = [];

  if (serverData) {
    walkJson(serverData, (record) => {
      if (typeof record.id !== "string" || !record.id.startsWith("playlist-detail-header")) {
        return;
      }

      headers.push(record as AppleMusicServerDataPlaylistHeader);
    });
  }

  const header =
    headers.find((candidate) => Boolean(candidate.title || candidate.subtitleLinks?.length)) ??
    headers[0] ??
    null;

  const description =
    getMetaContent(html, "apple:description") ?? getMetaContent(html, "description");

  return {
    title: header?.title ?? getMetaContent(html, "apple:title"),
    curator: header?.subtitleLinks?.[0]?.title ?? null,
    appleMusicId: parts.playlistId,
    appleMusicUrl: parts.originalUrl,
    storefront: parts.storefront,
    trackCount: header?.trackCount ?? parseTrackCount(description),
    durationText: parseDurationText(description),
    artwork: normalizeAppleMusicArtwork(header?.artwork?.dictionary ?? {
      url: getMetaContent(html, "og:image"),
    }),
    isPublic: !html.includes("Sign In") && !html.includes("Iniciar sesión"),
  };
}

export function parseAppleMusicPlaylistHtml(
  html: string,
  parts: AppleMusicPlaylistUrlParts,
) {
  const serverData = extractSerializedServerData(html);
  const playlist = parseMetadata(html, parts, serverData);
  const trackLists: AppleMusicServerDataTrackList[] = [];

  if (serverData) {
    walkJson(serverData, (record) => {
      if (record.itemKind === "trackLockup" && Array.isArray(record.items)) {
        trackLists.push(record as AppleMusicServerDataTrackList);
      }
    });
  }

  const selectedList =
    trackLists.find((list) => list.id?.includes(parts.playlistId)) ?? trackLists[0];

  const tracks =
    selectedList?.items
      ?.map((item, index) => parseTrackLockup(item, index + 1))
      .filter((track): track is AppleMusicPlaylistTrack => Boolean(track)) ?? [];

  return {
    playlist: {
      ...playlist,
      trackCount: playlist.trackCount ?? tracks.length,
    },
    tracks,
  };
}
