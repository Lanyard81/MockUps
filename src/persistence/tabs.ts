/**
 * Tell other tabs when this one saves a mockup, so two tabs on the same mockup don't silently
 * overwrite each other. Nothing leaves the browser: this is a BroadcastChannel between tabs.
 */
const NAME = 'pagewright-saves';
export const TAB_ID = Math.random().toString(36).slice(2);

let channel: BroadcastChannel | null = null;
const open = (): BroadcastChannel | null => {
  try {
    channel ??= new BroadcastChannel(NAME);
    return channel;
  } catch {
    return null;
  }
};

export function announceSave(docId: string): void {
  open()?.postMessage({ type: 'saved', docId, tab: TAB_ID });
}

/** Call `onOther(docId)` when a different tab saves a mockup. Returns a function that stops listening. */
export function listenForOtherSaves(onOther: (docId: string) => void): () => void {
  const c = open();
  if (!c) return () => undefined;
  const handler = (e: MessageEvent) => {
    const m = e.data as { type?: string; docId?: string; tab?: string } | null;
    if (m?.type === 'saved' && typeof m.docId === 'string' && m.tab !== TAB_ID) onOther(m.docId);
  };
  c.addEventListener('message', handler);
  return () => c.removeEventListener('message', handler);
}
