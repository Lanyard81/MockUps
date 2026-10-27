import { getKit } from '../kits';
import { FREE_NO_CONVERT, isFreeFrame } from '../layout/free';
import { framesToSpecText } from '../pagespec';
import { pageSpecInstructions } from '../pagespec/docs';
import { useStore } from '../store/store';
import { copyText } from './copy';
import { downloadBlob, slug } from './download';

/** Copy a frame as a page spec (JSON) and say so, including anything a page spec can't carry. */
export async function copyFrameSpec(frameId: string): Promise<void> {
  const s = useStore.getState();
  if (isFreeFrame(s.doc.frames.find((f) => f.id === frameId))) return s.setNotice(FREE_NO_CONVERT);
  const out = framesToSpecText(s.doc, [frameId]);
  if (!out) return s.setNotice('That page could not be exported.');
  const ok = await copyText(out.text);
  s.setNotice(
    ok
      ? `Page spec copied.${out.notes.length ? ` ${out.notes.join(' ')}` : ''} Paste it into a chat, or back into the editor.`
      : 'The browser blocked copying. Allow clipboard access and try again.',
  );
}

/** Download a frame as a `.page.json` file. */
export function downloadFrameSpec(frameId: string): void {
  const s = useStore.getState();
  const frame = s.doc.frames.find((f) => f.id === frameId);
  if (isFreeFrame(frame)) return s.setNotice(FREE_NO_CONVERT);
  const out = framesToSpecText(s.doc, [frameId]);
  if (!frame || !out) return s.setNotice('That page could not be exported.');
  const file = `${slug(frame.name, 'page')}.page.json`;
  downloadBlob(out.text, file, 'application/json');
  s.setNotice(
    `Saved ${file} to your downloads.${out.notes.length ? ` ${out.notes.join(' ')}` : ''}`,
  );
}

/** Copy the instruction and one kit's reference, ready to paste into a chat with a screenshot. */
export async function copyPageSpecInstructions(kitId: string): Promise<void> {
  const s = useStore.getState();
  const ok = await copyText(pageSpecInstructions(kitId));
  s.setNotice(
    ok
      ? `Copied the page spec instructions for ${getKit(kitId).shortLabel}. Paste them into a Claude chat with your screenshot.`
      : 'The browser blocked copying. Allow clipboard access and try again.',
  );
}
