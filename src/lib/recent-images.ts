import { newId } from "./storage";

/**
 * "Recent images" memory.
 *
 * Browsers don't expose file paths, but the File System Access API gives us a
 * persistable FileSystemFileHandle. We store handles (plus light metadata and a
 * thumbnail) in IndexedDB. On a later visit we can re-open the *same* file —
 * provided it still exists at its original location and the user re-grants read
 * permission. If a file has moved or been deleted, `getFile()` throws and we
 * drop it from the list, satisfying "remove them if no longer available".
 *
 * When the API is unsupported (Firefox/Safari today) the feature is disabled
 * gracefully via `recentImagesSupported()`.
 */

const DB_NAME = "coupon-press";
const STORE = "recent-images";
const MAX_RECENT = 8;

/** Public, serializable view of a recent image (no live handle). */
export interface RecentImage {
  id: string;
  name: string;
  size: number;
  lastModified: number;
  /** Small data-URL preview for the recents strip. */
  thumb: string;
  addedAt: number;
}

interface RecentRecord extends RecentImage {
  handle: FileSystemFileHandle;
}

export function recentImagesSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "indexedDB" in window &&
    "showOpenFilePicker" in window
  );
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

function getAll(): Promise<RecentRecord[]> {
  return tx<RecentRecord[]>("readonly", (s) => s.getAll() as IDBRequest<RecentRecord[]>);
}

function getOne(id: string): Promise<RecentRecord | undefined> {
  return tx<RecentRecord | undefined>(
    "readonly",
    (s) => s.get(id) as IDBRequest<RecentRecord | undefined>,
  );
}

function putRecord(record: RecentRecord): Promise<unknown> {
  return tx("readwrite", (s) => s.put(record));
}

export async function removeRecent(id: string): Promise<void> {
  try {
    await tx("readwrite", (s) => s.delete(id));
  } catch {
    /* ignore */
  }
}

/** List recents newest-first (handles stripped). */
export async function listRecent(): Promise<RecentImage[]> {
  if (!recentImagesSupported()) return [];
  try {
    const all = await getAll();
    return all
      .sort((a, b) => b.addedAt - a.addedAt)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ handle, ...rest }) => rest);
  } catch {
    return [];
  }
}

/** Add (or bump) a recent image, de-duplicating by name+size+lastModified. */
export async function addRecent(
  handle: FileSystemFileHandle,
  file: File,
  thumb: string,
): Promise<void> {
  if (!recentImagesSupported()) return;
  try {
    const all = await getAll();
    const dupe = all.find(
      (r) => r.name === file.name && r.size === file.size && r.lastModified === file.lastModified,
    );
    if (dupe) await removeRecent(dupe.id);

    await putRecord({
      id: dupe?.id ?? newId(),
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      thumb,
      addedAt: Date.now(),
      handle,
    });

    // Trim to the most recent MAX_RECENT.
    const fresh = (await getAll()).sort((a, b) => b.addedAt - a.addedAt);
    await Promise.all(fresh.slice(MAX_RECENT).map((r) => removeRecent(r.id)));
  } catch {
    /* ignore */
  }
}

async function ensurePermission(
  handle: FileSystemFileHandle,
  interactive: boolean,
): Promise<boolean> {
  const opts = { mode: "read" as const };
  // These methods exist on handles in supporting browsers.
  const h = handle as FileSystemFileHandle & {
    queryPermission?: (o: typeof opts) => Promise<PermissionState>;
    requestPermission?: (o: typeof opts) => Promise<PermissionState>;
  };
  let state: PermissionState = (await h.queryPermission?.(opts)) ?? "granted";
  if (state === "granted") return true;
  if (!interactive) return false;
  state = (await h.requestPermission?.(opts)) ?? "denied";
  return state === "granted";
}

/**
 * Re-open a recent file. Must be called from a user gesture so permission can
 * be requested. Returns the File, or null if permission is denied or the file
 * is no longer available (in which case it is pruned).
 */
export async function resolveRecent(id: string): Promise<File | null> {
  try {
    const record = await getOne(id);
    if (!record) return null;
    const allowed = await ensurePermission(record.handle, true);
    if (!allowed) return null;
    const file = await record.handle.getFile();
    // Bump recency.
    await putRecord({ ...record, addedAt: Date.now() });
    return file;
  } catch {
    await removeRecent(id);
    return null;
  }
}

/**
 * Try to silently restore the most recent file on load — only if permission is
 * already granted (no prompt). Returns the File or null. Prunes if unavailable.
 */
export async function tryAutoRestore(): Promise<File | null> {
  if (!recentImagesSupported()) return null;
  try {
    const all = (await getAll()).sort((a, b) => b.addedAt - a.addedAt);
    const newest = all[0];
    if (!newest) return null;
    const allowed = await ensurePermission(newest.handle, false);
    if (!allowed) return null;
    return await newest.handle.getFile();
  } catch {
    return null;
  }
}
