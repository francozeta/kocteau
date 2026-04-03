import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";
import { ImageResponse } from "next/og";

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
  const logoPath = join(process.cwd(), "public", "logo.svg");
  const logo = await readFile(logoPath, "utf8");

  return `data:image/svg+xml;base64,${Buffer.from(logo).toString("base64")}`;
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
                width: 42,
                height: 42,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                border: `1px solid ${palette.border}`,
                background: palette.panelSoft,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt=""
                width="22"
                height="22"
                style={{ display: "flex" }}
              />
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

function CoverArt({
  src,
  alt,
  size,
  fallbackLabel,
}: {
  src?: string | null;
  alt: string;
  size: number;
  fallbackLabel: string;
}) {
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
          "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          width={String(size)}
          height={String(size)}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            objectFit: "cover",
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
  return createFrame(
    <div
      style={{
        display: "flex",
        flex: 1,
        alignItems: "stretch",
        gap: 28,
      }}
    >
      <CoverArt
        src={coverUrl}
        alt={title}
        size={354}
        fallbackLabel={(artistName ?? title).slice(0, 1)}
      />

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
          }}
        >
          <Surface padding="12px 16px">
            <div
              style={{
                display: "flex",
                fontFamily:
                  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontSize: 13,
                color: palette.muted,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Track
            </div>
          </Surface>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 74,
                lineHeight: 0.95,
                fontWeight: 700,
                letterSpacing: "-0.05em",
              }}
            >
              {trimText(title, 56)}
            </div>
            <div
              style={{
                display: "flex",
                fontFamily:
                  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontSize: 28,
                color: palette.muted,
                letterSpacing: "-0.02em",
              }}
            >
              {trimText(artistName || "Unknown artist", 64)}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <MetricPill
              label="Reviews"
              value={String(Math.max(reviewCount ?? 0, 0))}
            />
            <MetricPill
              label="Rating"
              value={typeof averageRating === "number" ? averageRating.toFixed(1) : "—"}
              highlighted
            />
          </div>

          <div
            style={{
              display: "flex",
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontSize: 18,
              lineHeight: 1.4,
              color: palette.muted,
            }}
          >
            Reviews, notes, and shared listening around this track.
          </div>
        </div>
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

  return createFrame(
    <div
      style={{
        display: "flex",
        flex: 1,
        alignItems: "stretch",
        gap: 28,
      }}
    >
      <CoverArt
        src={avatarUrl}
        alt={title}
        size={280}
        fallbackLabel={initial}
      />

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
            gap: 16,
          }}
        >
          <Surface padding="12px 16px">
            <div
              style={{
                display: "flex",
                fontFamily:
                  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontSize: 13,
                color: palette.muted,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Profile
            </div>
          </Surface>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 74,
                lineHeight: 0.95,
                fontWeight: 700,
                letterSpacing: "-0.05em",
              }}
            >
              {trimText(title, 40)}
            </div>
            <div
              style={{
                display: "flex",
                fontFamily:
                  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontSize: 28,
                color: palette.muted,
                letterSpacing: "-0.02em",
              }}
            >
              @{username}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <Surface>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontFamily:
                    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  fontSize: 13,
                  color: palette.soft,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Taste profile
              </div>
              <div
                style={{
                  display: "flex",
                  fontFamily:
                    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  fontSize: 24,
                  lineHeight: 1.4,
                  color: palette.muted,
                }}
              >
                {trimText(
                  bio?.trim() || "Open profile, recent reviews, and listening identity on Kocteau.",
                  140,
                )}
              </div>
            </div>
          </Surface>
        </div>
      </div>
    </div>,
  );
}
