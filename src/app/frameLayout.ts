import { getFrameElement } from '../canvas/registry';
import { isFreeFrame } from '../layout/free';
import { useStore } from '../store/store';
import type { FreeBox } from '../store/types';

/**
 * Switch a frame between flow and freeform, asking first when that changes real content. Going to
 * freeform keeps each component where it is on screen now; going back puts them in reading order,
 * each in its own section.
 */
export function switchFrameLayout(frameId: string, layout: 'flow' | 'free'): void {
  const s = useStore.getState();
  const frame = s.doc.frames.find((f) => f.id === frameId);
  if (!frame || isFreeFrame(frame) === (layout === 'free')) return;
  const hasContent = frame.root.length > 0;
  const apply = () => {
    if (layout === 'free') {
      // Measure where each component is now, so nothing jumps.
      const idoc = getFrameElement(frameId)?.contentDocument;
      const boxes: Record<string, FreeBox> = {};
      for (const id of Object.keys(useStore.getState().doc.nodes)) {
        const n = useStore.getState().doc.nodes[id];
        if (n?.type !== 'component') continue;
        const r = idoc?.querySelector(`[data-node="${id}"]`)?.getBoundingClientRect();
        if (r) boxes[id] = { x: r.left, y: r.top, width: r.width };
      }
      useStore.getState().setFrameLayout(frameId, 'free', boxes);
    } else useStore.getState().setFrameLayout(frameId, 'flow');
  };
  if (!hasContent) return apply();
  s.requestConfirm(
    layout === 'free'
      ? {
          title: 'Switch to Freeform?',
          body: 'Each component stays where it is now and can then be dragged anywhere. Sections, grids and columns (and a SharePoint frame’s site header and menu) are dropped. Undo brings them back.',
          confirmLabel: 'Switch to Freeform',
          onConfirm: apply,
        }
      : {
          title: 'Switch to Flow?',
          body: 'Components are put in reading order (top to bottom, then left to right), each in its own section. Their free positions are dropped. Undo brings them back.',
          confirmLabel: 'Switch to Flow',
          onConfirm: apply,
        },
  );
}
