"use client";

export type PixelCropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AvatarUploadVariant = {
  bytes: number;
  file: File;
  height: number;
  mimeType: "image/webp";
  width: number;
};

export type PreparedAvatarUpload = {
  master: AvatarUploadVariant;
  originalBytes: number;
  thumbnail: AvatarUploadVariant;
};

type AvatarVariantOptions = {
  maxBytes: number;
  outputSize: number;
  suffix: "master" | "thumb";
};

const MASTER_OUTPUT_SIZE = 1024;
const THUMB_OUTPUT_SIZE = 256;
const MASTER_MAX_BYTES = 550 * 1024;
const THUMB_MAX_BYTES = 90 * 1024;
const WEBP_QUALITIES = [0.92, 0.88, 0.84, 0.8, 0.76] as const;

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

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
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

function getVariantFileName(fileName: string, suffix: AvatarVariantOptions["suffix"]) {
  const baseName = fileName.replace(/\.[^.]+$/, "").trim() || "avatar";
  return `${baseName}-${suffix}.webp`;
}

async function createAvatarVariant(
  image: HTMLImageElement,
  cropArea: PixelCropArea,
  sourceFileName: string,
  options: AvatarVariantOptions,
): Promise<AvatarUploadVariant> {
  const canvas = document.createElement("canvas");

  canvas.width = options.outputSize;
  canvas.height = options.outputSize;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context is not available.");
  }

  context.clearRect(0, 0, options.outputSize, options.outputSize);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    options.outputSize,
    options.outputSize,
  );

  let bestBlob: Blob | null = null;

  for (const quality of WEBP_QUALITIES) {
    const blob = await canvasToBlob(canvas, quality);

    if (!bestBlob || blob.size < bestBlob.size) {
      bestBlob = blob;
    }

    if (blob.size <= options.maxBytes) {
      bestBlob = blob;
      break;
    }
  }

  if (!bestBlob) {
    throw new Error("Could not optimize image.");
  }

  const file = new File(
    [bestBlob],
    getVariantFileName(sourceFileName, options.suffix),
    {
      type: "image/webp",
      lastModified: Date.now(),
    },
  );

  return {
    bytes: bestBlob.size,
    file,
    height: options.outputSize,
    mimeType: "image/webp",
    width: options.outputSize,
  };
}

export async function prepareAvatarUpload(
  file: File,
  cropArea: PixelCropArea,
): Promise<PreparedAvatarUpload> {
  const image = await loadImageFromFile(file);
  const safeCropArea = clampCropArea(cropArea, image.naturalWidth, image.naturalHeight);
  const [master, thumbnail] = await Promise.all([
    createAvatarVariant(image, safeCropArea, file.name, {
      maxBytes: MASTER_MAX_BYTES,
      outputSize: MASTER_OUTPUT_SIZE,
      suffix: "master",
    }),
    createAvatarVariant(image, safeCropArea, file.name, {
      maxBytes: THUMB_MAX_BYTES,
      outputSize: THUMB_OUTPUT_SIZE,
      suffix: "thumb",
    }),
  ]);

  return {
    master,
    originalBytes: file.size,
    thumbnail,
  };
}
