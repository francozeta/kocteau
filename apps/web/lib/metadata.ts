import type { Metadata } from "next";

const SITE_NAME = "Kocteau";
const DEFAULT_DESCRIPTION =
  "A modern music social app for reviews, notes, and curated discovery.";
const DEFAULT_OPEN_GRAPH_IMAGE = "/api/og/site";
const DEFAULT_TWITTER_IMAGE = "/api/og/site";

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

function buildImageDescriptor(image: string, title: string) {
  const alt = `${withSiteName(title)} preview`;

  return {
    url: image,
    alt,
    width: 1200,
    height: 630,
    type: "image/png",
  };
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
  const normalizedImage = normalizeImage(image);
  const openGraphImage = normalizedImage ?? DEFAULT_OPEN_GRAPH_IMAGE;
  const twitterImage = normalizedImage ?? DEFAULT_TWITTER_IMAGE;
  const openGraphImageDescriptor = buildImageDescriptor(openGraphImage, title);
  const twitterImageDescriptor = buildImageDescriptor(twitterImage, title);

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
      locale: "en_US",
      url: canonical,
      images: [openGraphImageDescriptor],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [twitterImageDescriptor],
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
