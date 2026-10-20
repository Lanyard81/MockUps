import { useStore } from '../store/store';
import { DEVICES, type DeviceId } from '../store/types';

/** Contextual bar for the selected frame: name, device, width, duplicate and delete. */
export function FrameBar() {
  const frame = useStore((s) => s.doc.frames.find((f) => f.id === s.selectedFrameId));
  const store = useStore;

  if (!frame) {
    return (
      <div className="framebar framebar--idle">
        Select a frame (click its name) to rename, resize, duplicate or delete it.
      </div>
    );
  }
  const st = () => store.getState();
  return (
    <div className="framebar">
      <label>
        Name
        <input
          key={frame.id + frame.name}
          defaultValue={frame.name}
          onBlur={(e) => st().renameFrame(frame.id, e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      </label>
      <label>
        Device
        <select
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
      </label>
      <label>
        Width
        <input
          className="framebar__width"
          type="number"
          min={240}
          max={3000}
          key={`${frame.id}-${frame.width}`}
          defaultValue={frame.width}
          onBlur={(e) => st().setFrameWidth(frame.id, Number(e.target.value) || frame.width)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      </label>
      <div className="framebar__actions">
        <button
          className="btn"
          onClick={() => st().duplicateFrame(frame.id)}
          title="Duplicate (Ctrl/⌘ D)"
        >
          Duplicate
        </button>
        <button
          className="btn btn--danger"
          onClick={() => st().deleteFrame(frame.id)}
          title="Delete (Delete key). Undo brings it back."
        >
          Delete
        </button>
      </div>
    </div>
  );
}
