import { useStore } from '../store/store';
import { Modal } from './Modal';

/** Preferences that belong to this browser, not to a mockup. */
export function SettingsDialog() {
  const open = useStore((s) => s.dialog === 'settings');
  const layout = useStore((s) => s.newFrameLayout);
  if (!open) return null;
  const st = useStore.getState;
  return (
    <Modal title="Settings" onClose={() => st().setDialog(null)}>
      <fieldset className="field-group">
        <legend>Default layout for new frames</legend>
        {(
          [
            ['flow', 'Flow', 'Sections, grids and columns, like a real page.'],
            ['free', 'Freeform', 'Drag components anywhere, with no grid.'],
          ] as const
        ).map(([id, label, hint]) => (
          <label key={id} className="choice">
            <input
              type="radio"
              name="default-layout"
              checked={layout === id}
              onChange={() => st().setNewFrameLayout(id)}
            />
            <span>
              {label}
              <small>{hint}</small>
            </span>
          </label>
        ))}
      </fieldset>
    </Modal>
  );
}
