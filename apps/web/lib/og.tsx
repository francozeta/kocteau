import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";
import { ImageResponse } from "next/og";
import { getMetadataBase } from "@/lib/metadata";

export const ogSize = {
  width: 1200,
  height: 630,
} as const;

export const ogContentType = "image/png";

const palette = {
  background: "#050505",
  panel: "#0b0b0b",
  panelSoft: "#111111",
  border: "rgba(255,255,255,0.12)",
  borderSoft: "rgba(255,255,255,0.08)",
  text: "#f4f4f5",
  muted: "rgba(244,244,245,0.66)",
  soft: "rgba(244,244,245,0.36)",
  accent: "#f5f5f5",
  accentSoft: "rgba(255,255,255,0.08)",
  amber: "#fbbf24",
};

function trimText(value: string | null | undefined, maxLength: number) {
  if (!value) {
    return "";
  }

  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

const getLogoDataUrl = cache(async () => {
  try {
    const logoPath = join(process.cwd(), "public", "logo-k.png");
    const logo = await readFile(logoPath);

    if (logo.byteLength === 0) {
      return null;
    }

    return `data:image/png;base64,${logo.toString("base64")}`;
  } catch {
    return null;
  }
});

function isDataUrl(value: string) {
  return value.startsWith("data:");
}

function resolveOgAssetUrl(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://") || isDataUrl(value)) {
    return value;
  }

  return new URL(value, getMetadataBase()).toString();
}

const getImageDataUrl = cache(async (source: string) => {
  if (!source) {
    return null;
  }

  if (isDataUrl(source)) {
    return source;
  }

  const resolvedSource = resolveOgAssetUrl(source);

  if (isDataUrl(resolvedSource)) {
    return resolvedSource;
  }

  try {
    const response = await fetch(resolvedSource, {
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      return null;
    }

    const contentType =
      response.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
    const bytes = await response.arrayBuffer();

    if (bytes.byteLength === 0) {
      return null;
    }

    return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
  } catch {
    return null;
  }
});

function createImageResponse(content: React.ReactElement) {
  return new ImageResponse(content, {
    ...ogSize,
  });
}

async function createFrame(children: React.ReactNode) {
  const logoSrc = await getLogoDataUrl();

  return createImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: palette.background,
        color: palette.text,
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "radial-gradient(circle at top left, rgba(255,255,255,0.07), transparent 36%), radial-gradient(circle at bottom right, rgba(255,255,255,0.05), transparent 28%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 24,
          display: "flex",
          border: `1px solid ${palette.borderSoft}`,
          borderRadius: 32,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.008))",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "42px 46px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                border: `1px solid ${palette.border}`,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  alt=""
                  width={28}
                  height={28}
                  style={{
                    display: "flex",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <span
                  style={{
                    display: "flex",
                    fontSize: 20,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  K
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                fontFamily:
                  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              }}
            >
              <span
                style={{
                  display: "flex",
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                }}
              >
                Kocteau
              </span>
              <span
                style={{
                  display: "flex",
                  fontSize: 12,
                  color: palette.muted,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Music review
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontSize: 12,
              color: palette.soft,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            <span style={{ display: "flex" }}>Shared from</span>
            <span style={{ display: "flex", color: palette.text }}>Kocteau</span>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1 }}>{children}</div>
      </div>
    </div>,
  );
}

function MetricPill({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 18px",
        borderRadius: 999,
        border: `1px solid ${highlighted ? "rgba(251,191,36,0.38)" : palette.border}`,
        background: highlighted ? "rgba(251,191,36,0.08)" : palette.accentSoft,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <span
        style={{
          display: "flex",
          fontSize: 13,
          color: palette.muted,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: "flex",
          fontSize: 18,
          fontWeight: 700,
          color: highlighted ? palette.amber : palette.text,
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Surface({
  children,
  padding = "28px",
}: {
  children: React.ReactNode;
  padding?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        borderRadius: 28,
        border: `1px solid ${palette.border}`,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))",
        padding,
      }}
    >
      {children}
    </div>
  );
}

async function CoverArt({
  src,
  alt,
  size,
  fallbackLabel,
  fit = "cover",
  padding = 0,
}: {
  src?: string | null;
  alt: string;
  size: number;
  fallbackLabel: string;
  fit?: "cover" | "contain";
  padding?: number;
}) {
  const imageSrc = src ? await getImageDataUrl(src) : null;
  const imageSize = Math.max(size - padding * 2, 0);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderRadius: 32,
        border: `1px solid ${palette.border}`,
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.07), rgba(255,255,255,0.02) 58%), linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))",
      }}
    >
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={alt}
          width={imageSize}
          height={imageSize}
          style={{
            width: imageSize,
            height: imageSize,
            display: "flex",
            objectFit: fit,
          }}
        />
      ) : (
        <span
          style={{
            display: "flex",
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: size > 180 ? 88 : 52,
            fontWeight: 700,
            color: palette.soft,
            textTransform: "uppercase",
          }}
        >
          {fallbackLabel}
        </span>
      )}
    </div>
  );
}

export async function createBrandOgImage() {
  return createFrame(
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          maxWidth: 760,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: 13,
            color: palette.muted,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Feed, tracks, profiles
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 92,
            lineHeight: 0.95,
            fontWeight: 700,
            letterSpacing: "-0.05em",
          }}
        >
          Music taste with real shape.
        </div>
        <div
          style={{
            display: "flex",
            maxWidth: 660,
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: 28,
            lineHeight: 1.35,
            color: palette.muted,
          }}
        >
          Reviews, notes, and shared listening identity in a quieter, sharper social format.
        </div>
      </div>

      <Surface padding="18px 20px">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: 18,
            color: palette.text,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 10,
              height: 10,
              borderRadius: 999,
              background: palette.amber,
            }}
          />
          <span style={{ display: "flex" }}>Share a track. Open a profile. Read the signal.</span>
        </div>
      </Surface>
    </div>,
  );
}

export async function createTrackOgImage({
  title,
  artistName,
  coverUrl,
  reviewCount,
  averageRating,
}: {
  title: string;
  artistName?: string | null;
  coverUrl?: string | null;
  reviewCount?: number;
  averageRating?: number | null;
}) {
  const coverArt = await CoverArt({
    src: coverUrl,
    alt: title,
    size: 470,
    fallbackLabel: (artistName ?? title).slice(0, 1),
  });

  return createImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: palette.background,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "radial-gradient(circle at top left, rgba(255,255,255,0.08), transparent 34%), radial-gradient(circle at bottom right, rgba(255,255,255,0.06), transparent 28%)",
        }}
      />
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={await getImageDataUrl(coverUrl) ?? undefined}
          alt={title}
          width={1200}
          height={630}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            objectFit: "cover",
            filter: "blur(28px)",
            opacity: 0.24,
            transform: "scale(1.08)",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "linear-gradient(180deg, rgba(5,5,5,0.14), rgba(5,5,5,0.26)), radial-gradient(circle at center, rgba(255,255,255,0.04), transparent 62%)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          padding: 18,
          borderRadius: 42,
          border: `1px solid ${palette.border}`,
          background: "rgba(10,10,10,0.36)",
          boxShadow: "0 28px 80px rgba(0,0,0,0.45)",
        }}
      >
        {coverArt}
      </div>
    </div>,
  );
}

export async function createProfileOgImage({
  username,
  displayName,
  avatarUrl,
  bio,
}: {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}) {
  const title = displayName?.trim() || `@${username}`;
  const initial = (displayName || username).slice(0, 1).toUpperCase();
  const avatarArt = await CoverArt({
    src: avatarUrl,
    alt: title,
    size: 360,
    fallbackLabel: initial,
    fit: "cover",
  });

  return createImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: palette.background,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 36%), radial-gradient(circle at bottom right, rgba(255,255,255,0.05), transparent 28%)",
        }}
      />
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={await getImageDataUrl(avatarUrl) ?? undefined}
          alt={title}
          width={1200}
          height={630}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            objectFit: "cover",
            filter: "blur(34px)",
            opacity: 0.18,
            transform: "scale(1.1)",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "linear-gradient(180deg, rgba(5,5,5,0.16), rgba(5,5,5,0.28)), radial-gradient(circle at center, rgba(255,255,255,0.04), transparent 58%)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          padding: 20,
          borderRadius: 999,
          border: `1px solid ${palette.border}`,
          background: "rgba(10,10,10,0.36)",
          boxShadow: "0 28px 80px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            display: "flex",
            overflow: "hidden",
            borderRadius: 999,
          }}
        >
          {avatarArt}
        </div>
      </div>
    </div>,
  );
}
