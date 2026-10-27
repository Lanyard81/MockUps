import { getComponent, getVariant } from '../catalogue';
import { getKit } from '../kits';
import type { BuildNotesTools } from '../kits/types';
import { isFreeFrame } from '../layout/free';
import { describeVariant, optionsForVariant } from '../layout/component';
import { useStore } from '../store/store';
import { copyText } from './copy';
import { downloadBlob, slug } from './download';

const tools: BuildNotesTools = { getComponent, getVariant, describeVariant, optionsForVariant };

/** The build notes for a frame, if its kit has them. */
export function buildNotesFor(
  frameId: string,
): { text: string; label: string; file: string } | null {
  const { doc } = useStore.getState();
  const frame = doc.frames.find((f) => f.id === frameId);
  const notes = frame && !isFreeFrame(frame) ? getKit(frame.kitId).buildNotes : undefined;
  if (!frame || !notes) return null;
  return {
    text: notes.build(doc, frame, tools),
    label: notes.label,
    file: `${slug(frame.name, 'page')}.build-notes.md`,
  };
}

/** Copy a frame's build notes to the clipboard and say so. */
export async function copyBuildNotes(frameId: string): Promise<void> {
  const s = useStore.getState();
  const notes = buildNotesFor(frameId);
  if (!notes) return s.setNotice('This page has no build notes.');
  s.setNotice(
    (await copyText(notes.text))
      ? `${notes.label} copied. Paste them into a document or ticket.`
      : 'The browser blocked copying. Allow clipboard access and try again.',
  );
}

/** Download a frame's build notes as a Markdown file. */
export function downloadBuildNotes(frameId: string): void {
  const s = useStore.getState();
  const notes = buildNotesFor(frameId);
  if (!notes) return s.setNotice('This page has no build notes.');
  downloadBlob(notes.text, notes.file, 'text/markdown');
  s.setNotice(`Saved ${notes.file} to your downloads.`);
}
