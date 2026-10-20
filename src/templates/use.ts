import { getKit } from '../kits';
import { useStore } from '../store/store';
import { useTemplates } from '../store/templates';
import type { InstantiatedTemplate } from './types';
import { getOfficialTemplate, instantiateOfficial, instantiateSaved } from './index';

export type TemplateRef = { source: 'official' | 'mine'; templateId: string };

/** A template with fresh ids, or null if it no longer exists (e.g. a deleted template of your own). */
export function resolveTemplate(ref: TemplateRef): InstantiatedTemplate | null {
  if (ref.source === 'official') {
    const def = getOfficialTemplate(ref.templateId);
    return def ? instantiateOfficial(def) : null;
  }
  const saved = useTemplates.getState().templates.find((t) => t.id === ref.templateId);
  return saved ? instantiateSaved(saved) : null;
}

/** Make a new frame from a template. At a canvas position if given, else beside the other frames. */
export function templateAsNewFrame(ref: TemplateRef, at?: { x: number; y: number }): void {
  const t = resolveTemplate(ref);
  const s = useStore.getState();
  if (!t) return s.setNotice('That template isn’t available any more.');
  const id = s.addFrameFromTemplate(t, at);
  // Bring the new frame into view once it has been measured.
  useStore.setState({ fitRequested: true });
  s.setNotice(`Added “${t.name}” as a new frame. Undo removes it.`);
  void id;
}

/** Replace a frame's content with a template, asking first if the frame already has content. */
export function templateOnFrame(ref: TemplateRef, frameId: string): void {
  const s = useStore.getState();
  const frame = s.doc.frames.find((f) => f.id === frameId);
  const t = resolveTemplate(ref);
  if (!frame || !t) return s.setNotice('That template isn’t available any more.');
  const apply = () => useStore.getState().replaceFrameWithTemplate(frameId, t);
  const changesKit = getKit(frame.kitId).id !== getKit(t.kitId).id;
  if (frame.root.length === 0 && !changesKit) return apply();
  s.requestConfirm({
    title: 'Replace this frame’s content?',
    body: `Everything in “${frame.name}” will be replaced with “${t.name}”${changesKit ? `, and the frame will become ${getKit(t.kitId).shortLabel === 'NSW' ? 'an' : 'a'} ${getKit(t.kitId).shortLabel} frame` : ''}. You can undo this straight afterwards.`,
    confirmLabel: 'Replace content',
    danger: true,
    onConfirm: apply,
  });
}

/** Where a screen point is on the canvas (in the canvas's own coordinates). */
export function screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
  const rect = document.querySelector('[data-testid="viewport"]')?.getBoundingClientRect();
  const { view } = useStore.getState().doc;
  return {
    x: (clientX - (rect?.left ?? 0) - view.x) / view.zoom,
    y: (clientY - (rect?.top ?? 0) - view.y) / view.zoom,
  };
}

export function isOverCanvas(clientX: number, clientY: number): boolean {
  const r = document.querySelector('[data-testid="viewport"]')?.getBoundingClientRect();
  return !!r && clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
}
