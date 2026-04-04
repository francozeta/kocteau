import type { Metadata } from "next";

const SITE_NAME = "Kocteau";
const DEFAULT_DESCRIPTION =
  "A modern music social app for reviews, notes, and curated discovery.";

function resolveSiteUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (!envUrl) {
    return "http://localhost:3000";
  }

  return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
}

export function getMetadataBase() {
  return new URL(resolveSiteUrl());
}

function withSiteName(title: string) {
  return title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;
}

function normalizePath(path?: string) {
  if (!path) {
    return undefined;
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function normalizeImage(image?: string | null) {
  if (!image) {
    return undefined;
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return normalizePath(image);
}

function buildGeneratedImagePath(path: string | undefined, kind: "openGraph" | "twitter") {
  const normalizedPath = normalizePath(path);
  const suffix = kind === "openGraph" ? "opengraph-image" : "twitter-image";

  if (!normalizedPath || normalizedPath === "/") {
    return `/${suffix}`;
  }

  return `${normalizedPath}/${suffix}`;
}

type CreatePageMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  image?: string | null;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image,
  noIndex = false,
}: CreatePageMetadataOptions): Metadata {
  const fullTitle = withSiteName(title);
  const canonical = normalizePath(path);
  const openGraphImage =
    normalizeImage(image) ?? buildGeneratedImagePath(canonical, "openGraph");
  const twitterImage =
    normalizeImage(image) ?? buildGeneratedImagePath(canonical, "twitter");

  return {
    title,
    description,
    alternates: canonical
      ? {
          canonical,
        }
      : undefined,
    openGraph: {
      title: fullTitle,
      description,
      type: "website",
      siteName: SITE_NAME,
      url: canonical,
      images: openGraphImage ? [openGraphImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: twitterImage ? [twitterImage] : undefined,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  };
}

export function createTrackDescription(title: string, artist?: string | null) {
  return artist
    ? `Reviews, ratings, and notes for ${title} by ${artist} on Kocteau.`
    : `Reviews, ratings, and notes for ${title} on Kocteau.`;
}

export function createProfileDescription(
  username: string,
  displayName?: string | null,
  bio?: string | null,
) {
  if (bio?.trim()) {
    return bio.trim();
  }

  return `${displayName ?? `@${username}`} on Kocteau. Reviews, saves, and music taste.`;
}
