import { getKit } from '../../kits';
import { useStore } from '../../store/store';
import { DEVICES, type DeviceId } from '../../store/types';
import { PageParts } from '../PageParts';
import { CommitInput, Field, Section } from './controls';
import { SettingsPanel } from './SettingsPanel';

const NO_VALUES: Record<string, unknown> = {};

export function FrameProps({ frameId }: { frameId: string }) {
  const frame = useStore((s) => s.doc.frames.find((f) => f.id === frameId));
  const kitSettings = useStore((s) => s.doc.kitSettings[frame?.kitId ?? '']) ?? NO_VALUES;
  const st = useStore.getState;
  if (!frame) return null;
  const kit = getKit(frame.kitId);
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
          The width decides which {kit.shortLabel} layout is used, just as on a real device.
        </p>
      </Section>
      {kit.pageParts.length > 0 && (
        <Section
          title="Page parts"
          hint={`Start a page with the standard ${kit.shortLabel} furniture.`}
        >
          <PageParts frameId={frame.id} kitId={kit.id} />
        </Section>
      )}
      {kit.settings.frame.length > 0 && (
        <SettingsPanel
          defs={kit.settings.frame}
          values={frame.settings ?? NO_VALUES}
          frame={frame.settings ?? NO_VALUES}
          onChange={(key, value) => st().setFrameSettings(frame.id, { [key]: value })}
        />
      )}
      {kit.settings.kit.length > 0 && (
        <SettingsPanel
          defs={kit.settings.kit}
          values={kitSettings}
          frame={frame.settings ?? NO_VALUES}
          onChange={(key, value) => st().setKitSettings(kit.id, { [key]: value })}
        />
      )}
      <div className="prop-actions">
        <button
          className="btn"
          disabled={frame.root.length === 0}
          onClick={() => st().setDialog('saveTemplate', frame.id)}
          title="Keep this frame to start new frames from later"
        >
          Save as template…
        </button>
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
