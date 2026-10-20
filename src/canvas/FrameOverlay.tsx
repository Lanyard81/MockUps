import { useEffect, useRef } from 'react';
import { isDraggable } from '../layout/ops';
import { nodeLabel } from '../layout/labels';
import { useStore } from '../store/store';
import { beginPendingDrag } from './drag';
import { getFrameElement, nodeRect } from './registry';

interface Props {
  frameId: string;
  /** Anything that can move boxes: re-measure when it changes. */
  layoutKey: string;
}

function place(el: HTMLElement | null, rect: DOMRect | null) {
  if (!el) return;
  if (!rect) {
    el.style.display = 'none';
    return;
  }
  el.style.display = 'block';
  el.style.left = `${rect.left}px`;
  el.style.top = `${rect.top}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
}

/**
 * Editor chrome drawn over a frame: hover outline, selection box with a drag handle, and the
 * drop indicator. It lives in the editor document, not inside the frame, so it can never change
 * how a mockup looks. Boxes are positioned straight on the DOM to avoid re-rendering on every move.
 */
export function FrameOverlay({ frameId, layoutKey }: Props) {
  const hoverRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const mode = useStore((s) => s.mode);
  const selectedId = useStore((s) => (s.selectedFrameId === frameId ? s.selectedNodeId : null));
  const hoverId = useStore((s) => (s.hover?.frameId === frameId ? s.hover.nodeId : null));
  const dragging = useStore((s) => s.drag !== null);
  const drop = useStore((s) => (s.dropTarget?.frameId === frameId ? s.dropTarget : null));
  const node = useStore((s) => (selectedId ? s.doc.nodes[selectedId] : undefined));
  const label = nodeLabel(node);
  const movable = !!node && isDraggable(node);
  const editing = useStore((s) => s.editing?.frameId === frameId);
  const edit = mode === 'edit' && !editing;

  // Measure after the frame has rendered its content (the frame's own effect runs after ours).
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const idoc = getFrameElement(frameId)?.contentDocument;
      place(selectRef.current, edit && idoc && selectedId ? nodeRect(idoc, selectedId) : null);
      const showHover = edit && !dragging && hoverId && hoverId !== selectedId;
      place(hoverRef.current, showHover && idoc ? nodeRect(idoc, hoverId) : null);
    });
    return () => cancelAnimationFrame(raf);
  }, [frameId, selectedId, hoverId, edit, dragging, layoutKey]);

  const onChipDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!selectedId || !movable) return;
    beginPendingDrag(e, { kind: 'move', nodeId: selectedId, label });
  };

  const parent = drop?.indicator.parent;
  return (
    <div className="overlay" aria-hidden="true">
      <div ref={hoverRef} className="ov-hover" />
      <div ref={selectRef} className="ov-select">
        <div className="ov-chip">
          {movable && (
            <span
              className="ov-chip__grip"
              onPointerDown={onChipDown}
              title="Drag to move"
              data-testid="drag-handle"
            >
              ⠿
            </span>
          )}
          {label}
        </div>
      </div>
      {drop && parent && (
        <div
          className="ov-drop-parent"
          style={{ left: parent.x, top: parent.y, width: parent.width, height: parent.height }}
        />
      )}
      {drop && (
        <div
          className={`ov-drop ov-drop--${drop.indicator.kind}`}
          data-testid="drop-indicator"
          style={{
            left: drop.indicator.rect.x,
            top: drop.indicator.rect.y,
            width: drop.indicator.rect.width,
            height: drop.indicator.rect.height,
          }}
        >
          {drop.indicator.kind === 'box' && <span>Drop here</span>}
        </div>
      )}
    </div>
  );
}
