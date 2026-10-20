import { useStore } from '../../store/store';
import { DEVICES, type DeviceId } from '../../store/types';
import { CommitInput, Field, Section } from './controls';

export function FrameProps({ frameId }: { frameId: string }) {
  const frame = useStore((s) => s.doc.frames.find((f) => f.id === frameId));
  const st = useStore.getState;
  if (!frame) return null;
  return (
    <>
      <Section title="Frame">
        <Field label="Name" htmlFor="frame-name">
          <CommitInput
            id="frame-name"
            value={frame.name}
            onCommit={(v) => st().renameFrame(frame.id, v)}
          />
        </Field>
        <Field label="Device" htmlFor="frame-device">
          <select
            id="frame-device"
            value={frame.device}
            onChange={(e) => st().setFrameDevice(frame.id, e.target.value as DeviceId)}
          >
            {Object.values(DEVICES).map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
                {d.id === 'custom' ? '' : ` (${d.width})`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Width" htmlFor="frame-width">
          <input
            id="frame-width"
            type="number"
            min={240}
            max={3000}
            key={`${frame.id}-${frame.width}`}
            defaultValue={frame.width}
            onBlur={(e) => st().setFrameWidth(frame.id, Number(e.target.value) || frame.width)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
          />
        </Field>
        <p className="prop-hint">
          The width decides which NSW layout is used, just as on a real device.
        </p>
      </Section>
      <div className="prop-actions">
        <button
          className="btn"
          onClick={() => st().duplicateFrame(frame.id)}
          title="Duplicate (Ctrl/⌘ D)"
        >
          Duplicate frame
        </button>
        <button
          className="btn btn--danger"
          onClick={() => st().deleteFrame(frame.id)}
          title="Delete (Delete key). Undo brings it back."
        >
          Delete frame
        </button>
      </div>
    </>
  );
}
