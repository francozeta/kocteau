"use client";

export type PixelCropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OptimizedAvatarResult = {
  file: File;
  width: number;
  height: number;
  originalBytes: number;
  optimizedBytes: number;
  mimeType: string;
};

type OptimizeAvatarOptions = {
  maxBytes?: number;
  outputSize?: number;
};

const DEFAULT_OUTPUT_SIZE = 640;
const DEFAULT_MAX_BYTES = 900 * 1024;

async function loadImageFromFile(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";

    const imageLoaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not decode image."));
    });

    image.src = objectUrl;
    await imageLoaded;

    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
) {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });

  if (!blob) {
    throw new Error("Could not encode image.");
  }

  return blob;
}

function clampCropArea(cropArea: PixelCropArea, naturalWidth: number, naturalHeight: number) {
  const x = Math.max(0, Math.min(Math.round(cropArea.x), naturalWidth));
  const y = Math.max(0, Math.min(Math.round(cropArea.y), naturalHeight));
  const width = Math.max(1, Math.min(Math.round(cropArea.width), naturalWidth - x));
  const height = Math.max(1, Math.min(Math.round(cropArea.height), naturalHeight - y));

  return { x, y, width, height };
}

function getAvatarFileName(fileName: string, mimeType: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "").trim() || "avatar";

  if (mimeType === "image/png") {
    return `${baseName}.png`;
  }

  if (mimeType === "image/jpeg") {
    return `${baseName}.jpg`;
  }

  return `${baseName}.webp`;
}

export async function cropAndOptimizeAvatar(
  file: File,
  cropArea: PixelCropArea,
  options: OptimizeAvatarOptions = {},
): Promise<OptimizedAvatarResult> {
  const image = await loadImageFromFile(file);
  const safeCropArea = clampCropArea(cropArea, image.naturalWidth, image.naturalHeight);
  const outputSize = options.outputSize ?? DEFAULT_OUTPUT_SIZE;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const canvas = document.createElement("canvas");

  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context is not available.");
  }

  context.clearRect(0, 0, outputSize, outputSize);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    safeCropArea.x,
    safeCropArea.y,
    safeCropArea.width,
    safeCropArea.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  const candidates: Array<{ type: string; quality?: number }> = [
    { type: "image/webp", quality: 0.9 },
    { type: "image/webp", quality: 0.84 },
    { type: "image/webp", quality: 0.78 },
    { type: "image/jpeg", quality: 0.88 },
  ];

  let bestBlob: Blob | null = null;
  let bestMimeType = "image/webp";

  for (const candidate of candidates) {
    const blob = await canvasToBlob(canvas, candidate.type, candidate.quality);

    if (!bestBlob || blob.size < bestBlob.size) {
      bestBlob = blob;
      bestMimeType = candidate.type;
    }

    if (blob.size <= maxBytes) {
      bestBlob = blob;
      bestMimeType = candidate.type;
      break;
    }
  }

  if (!bestBlob) {
    throw new Error("Could not optimize image.");
  }

  const optimizedFile = new File(
    [bestBlob],
    getAvatarFileName(file.name, bestMimeType),
    {
      type: bestMimeType,
      lastModified: Date.now(),
    },
  );

  return {
    file: optimizedFile,
    width: outputSize,
    height: outputSize,
    originalBytes: file.size,
    optimizedBytes: bestBlob.size,
    mimeType: bestMimeType,
  };
}
