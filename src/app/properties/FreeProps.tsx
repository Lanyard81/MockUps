import { alignInFrame } from '../../layout/guides';
import { readBox } from '../../layout/free';
import { useStore } from '../../store/store';
import { Field, Section, Segmented, Toggle } from './controls';

/** A whole-number box that commits on Enter or blur, as one undo step. */
function NumberBox({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
}) {
  return (
    <Field label={label} htmlFor={`free-${label}`}>
      <input
        id={`free-${label}`}
        type="number"
        key={value}
        defaultValue={value}
        onBlur={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n) && Math.round(n) !== value) onCommit(Math.round(n));
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
    </Field>
  );
}

/** Where an item sits on a freeform frame: exact numbers, and alignment to the frame. */
export function FreePosition({ nodeId }: { nodeId: string }) {
  const node = useStore((s) => s.doc.nodes[nodeId]);
  const frame = useStore((s) => s.doc.frames.find((f) => f.root.includes(nodeId)));
  if (!node || frame?.layout !== 'free') return null;
  const box = readBox(node, frame.width);
  const st = useStore.getState;
  return (
    <Section title="Position" hint="On a free-layout page. Pixels from the page’s top-left corner.">
      <div className="prop-row">
        <NumberBox label="X" value={box.x} onCommit={(x) => st().setFreeBox(nodeId, { x })} />
        <NumberBox label="Y" value={box.y} onCommit={(y) => st().setFreeBox(nodeId, { y })} />
      </div>
      <NumberBox
        label="Width"
        value={box.width}
        onCommit={(width) => st().setFreeBox(nodeId, { width })}
      />
      <div className="segmented segmented--block" role="group" aria-label="Align in page">
        {(['left', 'centre', 'right'] as const).map((to) => (
          <button
            key={to}
            onClick={() => st().setFreeBox(nodeId, { x: alignInFrame(to, box.width, frame.width) })}
          >
            {to === 'left' ? 'Left' : to === 'centre' ? 'Centre' : 'Right'}
          </button>
        ))}
      </div>
      <div className="prop-actions">
        <button className="btn" onClick={() => st().reorderFree(nodeId, 'front')}>
          Bring to front
        </button>
        <button className="btn" onClick={() => st().reorderFree(nodeId, 'back')}>
          Send to back
        </button>
      </div>
    </Section>
  );
}

/** Grid and snapping for a freeform frame. */
export function FreeFrameSettings({ frameId }: { frameId: string }) {
  const frame = useStore((s) => s.doc.frames.find((f) => f.id === frameId));
  if (!frame || frame.layout !== 'free') return null;
  const st = useStore.getState;
  return (
    <Section
      title="Alignment"
      hint="Pink guides show when an item lines up with the page or another item. Hold Alt while dragging to ignore snapping."
    >
      <Segmented
        label="Grid"
        value={String(frame.freeGrid ?? 0)}
        options={[
          { id: '0', label: 'No grid' },
          { id: '8', label: '8' },
          { id: '16', label: '16' },
          { id: '24', label: '24' },
        ]}
        onChange={(v) => st().setFrameFree(frameId, { freeGrid: Number(v) || null })}
      />
      <Toggle
        label="Snap to guides"
        checked={frame.freeSnap === true && !frame.freeGrid}
        disabled={!!frame.freeGrid}
        onChange={(freeSnap) => st().setFrameFree(frameId, { freeSnap })}
      />
      {frame.freeGrid ? (
        <p className="prop-hint">With a grid, items snap to the grid instead.</p>
      ) : null}
    </Section>
  );
}
