import { del, get, set } from 'idb-keyval';

/**
 * All browser storage goes through here, wrapped so a blocked or full store never throws into the
 * app. (Some browsers refuse IndexedDB for pages opened from disk or in private windows.)
 */
export async function safeGet<T>(key: string): Promise<T | undefined> {
  try {
    return await get<T>(key);
  } catch {
    return undefined;
  }
}

export async function safeSet(key: string, value: unknown): Promise<boolean> {
  try {
    await set(key, value);
    return true;
  } catch {
    return false;
  }
}

export async function safeDel(key: string): Promise<boolean> {
  try {
    await del(key);
    return true;
  } catch {
    return false;
  }
}

/** Can this page really keep data between visits? Writes and reads back a test value. */
export async function probeStorage(): Promise<boolean> {
  try {
    const key = 'probe';
    const value = String(Date.now());
    await set(key, value);
    const back = await get<string>(key);
    await del(key);
    return back === value;
  } catch {
    return false;
  }
}
