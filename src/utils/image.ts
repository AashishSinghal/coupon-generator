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

/** A small JPEG data-URL thumbnail of a loaded image, for the recents strip. */
export function makeThumbnail(img: HTMLImageElement, max = 160): string {
  const w = img.naturalWidth || img.width || 1;
  const h = img.naturalHeight || img.height || 1;
  const scale = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}

interface FilePickerWindow {
  showOpenFilePicker?: (options?: {
    multiple?: boolean;
    types?: { description?: string; accept: Record<string, string[]> }[];
  }) => Promise<FileSystemFileHandle[]>;
}

/**
 * Open the native file picker via the File System Access API, returning both
 * the File and its persistable handle. Returns null if the user cancels or the
 * API is unavailable (callers should fall back to a plain file input).
 */
export async function pickImageFile(): Promise<{
  file: File;
  handle: FileSystemFileHandle;
} | null> {
  const picker = (window as unknown as FilePickerWindow).showOpenFilePicker;
  if (!picker) return null;
  try {
    const [handle] = await picker({
      multiple: false,
      types: [
        {
          description: "Images",
          accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
        },
      ],
    });
    if (!handle) return null;
    const file = await handle.getFile();
    return { file, handle };
  } catch {
    // AbortError (user cancelled) or unsupported — treat as no selection.
    return null;
  }
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
