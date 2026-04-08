"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  prepareAvatarUpload,
  type PreparedAvatarUpload,
  type PixelCropArea,
} from "@/lib/avatar-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from "@/components/ui/cropper";

type AvatarCropDialogProps = {
  open: boolean;
  initialFile: File | null;
  onConfirm: (result: PreparedAvatarUpload) => void;
  onOpenChange: (open: boolean) => void;
};

export default function AvatarCropDialog({
  open,
  initialFile,
  onConfirm,
  onOpenChange,
}: AvatarCropDialogProps) {
  const [cropArea, setCropArea] = useState<PixelCropArea | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const sourceFile = initialFile;

  useEffect(() => {
    if (!open) {
      return;
    }

    setCropArea(null);
    setError(null);
  }, [open, initialFile]);

  const previewUrl = useMemo(() => {
    if (!sourceFile) {
      return null;
    }

    return URL.createObjectURL(sourceFile);
  }, [sourceFile]);

  useEffect(() => {
    if (!previewUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleCropChange = useCallback((nextCropArea: PixelCropArea | null) => {
    setCropArea(nextCropArea);
  }, []);

  async function handleConfirm() {
    if (!sourceFile || !cropArea) {
      return;
    }

    setIsConfirming(true);
    setError(null);

    try {
      const result = await prepareAvatarUpload(sourceFile, cropArea);
      onConfirm(result);
    } catch {
      setError("We could not prepare this image. Please try another photo.");
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(100vw-1rem,34rem)] overflow-hidden rounded-[1.1rem] border border-white/10 bg-[#060606] p-0 text-white shadow-2xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Crop profile photo</DialogTitle>
          <DialogDescription>
            Adjust the framing and save.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-0">
          <div className="p-3">
            <div className="overflow-hidden rounded-[0.95rem] border border-white/6 bg-black">
              {previewUrl ? (
                <Cropper
                  className="h-[min(68vh,24rem)] w-full"
                  image={previewUrl}
                  aspectRatio={1}
                  cropPadding={20}
                  minZoom={1}
                  maxZoom={3}
                  onCropChange={handleCropChange}
                >
                  <CropperDescription>
                    Drag to reposition the image. Use scroll or pinch to zoom.
                  </CropperDescription>
                  <CropperImage />
                  <CropperCropArea className="rounded-full border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.56)]" />
                </Cropper>
              ) : (
                <div className="flex h-[min(62vh,24rem)] items-center justify-center px-6 text-center text-sm text-white/65">
                  Choose a photo to start cropping.
                </div>
              )}
            </div>
          </div>

          {error ? (
            <p className="px-4 pb-3 text-sm text-red-400">{error}</p>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-white/8 px-3 py-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isConfirming}
              className="rounded-[0.65rem] border-white/10 bg-[#111] text-white hover:bg-[#181818] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!sourceFile || !cropArea || isConfirming}
              className="rounded-[0.65rem] bg-white text-black hover:bg-white/90"
            >
              {isConfirming ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Preparing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
