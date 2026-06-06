import { SUPPORTED_IMAGE_TYPES } from "@/lib/types";

export interface LoadedImage {
  element: HTMLImageElement;
  width: number;
  height: number;
  /** Object URL backing the element; revoke when no longer needed. */
  objectUrl: string;
  fileName: string;
  /** Original MIME type, used to choose the PDF image encoder. */
  mimeType: string;
}

/** True if the file's MIME type is one we can render. */
export function isSupportedImage(file: File): boolean {
  return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(file.type);
}

/**
 * Load an uploaded image file into an HTMLImageElement, entirely in-memory via
 * an object URL. No network, no server upload. Rejects unsupported types.
 */
export function loadImageFromFile(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    if (!isSupportedImage(file)) {
      reject(new Error("Unsupported image format. Use PNG, JPG, JPEG, or WEBP."));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        element: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        objectUrl,
        fileName: file.name,
        mimeType: file.type,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not decode the image file."));
    };
    img.src = objectUrl;
  });
}

/** Trigger a browser download for a Blob under the given filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
