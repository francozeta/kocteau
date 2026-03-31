export type AvatarPresetId =
  | "ultraviolet"
  | "silver-haze"
  | "amber-noir"
  | "rose-flare"
  | "acid-lime"
  | "violet-glow";

export type AvatarPreset = {
  id: AvatarPresetId;
  label: string;
  baseOuter: string;
  baseInner: string;
  sheenA: string;
  sheenB: string;
  streakA: string;
  streakB: string;
  shadow: string;
};

export const avatarPresets: AvatarPreset[] = [
  {
    id: "ultraviolet",
    label: "Ultraviolet",
    baseOuter: "#1f3470",
    baseInner: "#5f3fd1",
    sheenA: "#87f5ff",
    sheenB: "#ff92d1",
    streakA: "#7de7ff",
    streakB: "#fef7ff",
    shadow: "#0b1123",
  },
  {
    id: "silver-haze",
    label: "Silver haze",
    baseOuter: "#8ca0b0",
    baseInner: "#f4f7fb",
    sheenA: "#85f0ff",
    sheenB: "#ffe7b8",
    streakA: "#9fe5ff",
    streakB: "#ffffff",
    shadow: "#35424d",
  },
  {
    id: "amber-noir",
    label: "Amber noir",
    baseOuter: "#2e2c18",
    baseInner: "#a6780d",
    sheenA: "#ffb347",
    sheenB: "#53f5cf",
    streakA: "#ffd36d",
    streakB: "#e9ff9d",
    shadow: "#13120c",
  },
  {
    id: "rose-flare",
    label: "Rose flare",
    baseOuter: "#7d1735",
    baseInner: "#f24489",
    sheenA: "#ffc7e3",
    sheenB: "#ff9838",
    streakA: "#ff8cc8",
    streakB: "#ffd4ec",
    shadow: "#2b0d17",
  },
  {
    id: "acid-lime",
    label: "Acid lime",
    baseOuter: "#1e5d18",
    baseInner: "#85d930",
    sheenA: "#f0ff75",
    sheenB: "#7ff0ff",
    streakA: "#d8ff55",
    streakB: "#f4ffd1",
    shadow: "#102113",
  },
  {
    id: "violet-glow",
    label: "Violet glow",
    baseOuter: "#3a2289",
    baseInner: "#6c42d4",
    sheenA: "#9ef4ff",
    sheenB: "#ffb8ee",
    streakA: "#7be8ff",
    streakB: "#ffd8f6",
    shadow: "#1a1433",
  },
] as const;

export function getAvatarPreset(presetId: AvatarPresetId) {
  return avatarPresets.find((preset) => preset.id === presetId) ?? avatarPresets[0];
}

export function createAvatarPresetSvg(presetId: AvatarPresetId, size = 640) {
  const preset = getAvatarPreset(presetId);
  const center = size / 2;
  const radius = size * 0.43;
  const discInner = size * 0.168;
  const hole = size * 0.082;
  const shadowY = size * 0.034;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="disc-base" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${center} ${center}) rotate(90) scale(${radius})">
          <stop offset="0" stop-color="${preset.baseInner}"/>
          <stop offset="0.58" stop-color="${preset.baseOuter}"/>
          <stop offset="1" stop-color="${preset.shadow}"/>
        </radialGradient>
        <linearGradient id="disc-sheen" x1="${size * 0.12}" y1="${size * 0.18}" x2="${size * 0.88}" y2="${size * 0.82}" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="${preset.sheenA}" stop-opacity="0.0"/>
          <stop offset="0.2" stop-color="${preset.sheenA}" stop-opacity="0.82"/>
          <stop offset="0.42" stop-color="${preset.sheenB}" stop-opacity="0.12"/>
          <stop offset="0.62" stop-color="${preset.sheenA}" stop-opacity="0.76"/>
          <stop offset="1" stop-color="${preset.sheenB}" stop-opacity="0.0"/>
        </linearGradient>
        <linearGradient id="disc-sheen-2" x1="${size * 0.88}" y1="${size * 0.16}" x2="${size * 0.12}" y2="${size * 0.84}" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="${preset.streakA}" stop-opacity="0"/>
          <stop offset="0.24" stop-color="${preset.streakA}" stop-opacity="0.5"/>
          <stop offset="0.48" stop-color="${preset.streakB}" stop-opacity="0.08"/>
          <stop offset="0.72" stop-color="${preset.streakA}" stop-opacity="0.44"/>
          <stop offset="1" stop-color="${preset.streakB}" stop-opacity="0"/>
        </linearGradient>
        <radialGradient id="disc-rim" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${center} ${center}) rotate(90) scale(${radius})">
          <stop offset="0.72" stop-color="#FFFFFF" stop-opacity="0"/>
          <stop offset="0.92" stop-color="#FFFFFF" stop-opacity="0.18"/>
          <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.06"/>
        </radialGradient>
        <filter id="disc-blur" x="0" y="0" width="${size}" height="${size}" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="${size * 0.022}" />
        </filter>
      </defs>

      <ellipse cx="${center}" cy="${center + shadowY}" rx="${radius * 0.86}" ry="${radius * 0.18}" fill="#000000" fill-opacity="0.22" filter="url(#disc-blur)" />

      <circle cx="${center}" cy="${center}" r="${radius}" fill="url(#disc-base)" />
      <circle cx="${center}" cy="${center}" r="${radius}" fill="url(#disc-sheen)" />
      <circle cx="${center}" cy="${center}" r="${radius}" fill="url(#disc-sheen-2)" opacity="0.9" />
      <circle cx="${center}" cy="${center}" r="${radius}" fill="url(#disc-rim)" />
      <circle cx="${center}" cy="${center}" r="${radius - size * 0.01}" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="${size * 0.008}" />

      <circle cx="${center}" cy="${center}" r="${discInner}" fill="#D7D8DC" />
      <circle cx="${center}" cy="${center}" r="${discInner * 0.82}" fill="#F7F7F8" />
      <circle cx="${center}" cy="${center}" r="${discInner * 0.57}" fill="#D7D8DC" />
      <circle cx="${center}" cy="${center}" r="${discInner * 0.36}" fill="#F7F7F8" />
      <circle cx="${center}" cy="${center}" r="${hole}" fill="#BFC1C7" />
      <circle cx="${center}" cy="${center}" r="${hole * 0.48}" fill="#DCDDDF" />

      <circle cx="${center}" cy="${center}" r="${discInner * 0.95}" stroke="#0A0A0A" stroke-opacity="0.9" stroke-width="${size * 0.008}" />
      <circle cx="${center}" cy="${center}" r="${discInner * 0.76}" stroke="#1A1A1A" stroke-opacity="0.75" stroke-width="${size * 0.006}" />
    </svg>
  `.trim();
}

export function createAvatarPresetDataUrl(presetId: AvatarPresetId, size = 640) {
  const svg = createAvatarPresetSvg(presetId, size);
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
