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
  DrawerBase,
  DrawerBaseBackdrop,
  DrawerBaseContent,
  DrawerBaseDescription,
  DrawerBaseHandle,
  DrawerBaseHeader,
  DrawerBasePortal,
  DrawerBaseTitle,
  DrawerBaseViewport,
} from "@/components/ui/drawer-base";
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from "@/components/ui/cropper";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
  const isMobile = useIsMobile();
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

  const cropperViewport = (
    <div className={cn("overflow-hidden border border-white/6 bg-black", isMobile ? "rounded-[1.1rem]" : "rounded-[0.95rem]")}>
      {previewUrl ? (
        <Cropper
          className={cn("w-full", isMobile ? "h-[min(58dvh,28rem)]" : "h-[min(68vh,24rem)]")}
          image={previewUrl}
          aspectRatio={1}
          cropPadding={isMobile ? 16 : 20}
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
        <div className={cn("flex items-center justify-center px-6 text-center text-sm text-white/65", isMobile ? "h-[min(54dvh,26rem)]" : "h-[min(62vh,24rem)]")}>
          Choose a photo to start cropping.
        </div>
      )}
    </div>
  );

  const footerContent = isMobile ? (
    <div className="flex flex-col gap-2 border-t border-white/8 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
      <Button
        type="button"
        onClick={handleConfirm}
        disabled={!sourceFile || !cropArea || isConfirming}
        className="h-11 w-full rounded-[0.95rem] bg-white text-sm text-black hover:bg-white/90"
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
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isConfirming}
        className="h-11 w-full rounded-[0.95rem] border-white/10 bg-[#111] text-sm text-white hover:bg-[#181818] hover:text-white"
      >
        Cancel
      </Button>
    </div>
  ) : (
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
  );

  const cropperContent = (
    <div className="flex flex-col">
      <div className={cn(isMobile ? "px-3 pb-3 pt-2" : "p-3")}>
        {cropperViewport}
      </div>

      {error ? (
        <p className="px-4 pb-3 text-sm text-red-400">{error}</p>
      ) : null}

      {footerContent}
    </div>
  );

  if (isMobile) {
    return (
      <DrawerBase open={open} onOpenChange={onOpenChange} swipeDirection="down">
        <DrawerBasePortal>
          <DrawerBaseBackdrop className="bg-black/78" />
          <DrawerBaseViewport>
            <DrawerBaseContent className="max-h-[calc(100dvh-0.25rem)] border-white/10 bg-[#060606] text-white">
              <DrawerBaseHandle className="bg-white/18" />
              <DrawerBaseHeader className="sr-only">
                <DrawerBaseTitle>Crop profile photo</DrawerBaseTitle>
                <DrawerBaseDescription>
                  Adjust the framing and save.
                </DrawerBaseDescription>
              </DrawerBaseHeader>

              {cropperContent}
            </DrawerBaseContent>
          </DrawerBaseViewport>
        </DrawerBasePortal>
      </DrawerBase>
    );
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

        {cropperContent}
      </DialogContent>
    </Dialog>
  );
}
