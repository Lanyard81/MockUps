import { useStore } from '../store/store';
import { registerGhost } from './drag';

/** The label that follows the pointer while dragging. Moved directly by the drag loop. */
export function DragGhost() {
  const drag = useStore((s) => s.drag);
  const hasTarget = useStore((s) => s.dropTarget !== null);
  if (!drag) return null;
  return (
    <div
      ref={registerGhost}
      className={`drag-ghost${hasTarget ? ' is-valid' : ''}`}
      aria-hidden="true"
    >
      <span className="drag-ghost__icon">{drag.kind === 'move' ? '↕' : '+'}</span>
      {drag.label}
      <span className="drag-ghost__hint">
        {hasTarget ? 'Release to drop' : 'Drag onto a frame'}
      </span>
    </div>
  );
}
