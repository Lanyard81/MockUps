import { useState } from 'react';
import { saveFrameAsTemplate } from '../templates/save';
import { useStore } from '../store/store';
import { Modal } from './Modal';

/** Ask for a name, then save the frame as one of the user's own templates. */
export function SaveTemplateDialog() {
  const open = useStore((s) => s.dialog === 'saveTemplate');
  const frameId = useStore((s) => s.dialogFrameId);
  const frame = useStore((s) => s.doc.frames.find((f) => f.id === frameId));
  if (!open || !frame) return null;
  return <Inner frameId={frame.id} initial={frame.name} />;
}

function Inner({ frameId, initial }: { frameId: string; initial: string }) {
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const close = () => useStore.getState().setDialog(null);
  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const ok = await saveFrameAsTemplate(frameId, name);
    setBusy(false);
    if (ok) close();
  };
  return (
    <Modal
      title="Save as template"
      width={440}
      onClose={close}
      footer={
        <>
          <button className="btn" onClick={close}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            disabled={busy || !name.trim()}
            onClick={() => void save()}
          >
            {busy ? 'Saving…' : 'Save template'}
          </button>
        </>
      }
    >
      <p className="modal__text">
        Keep this frame so you can start new frames from it later. It’s saved in this browser, and
        goes with your mockups when you save to a file.
      </p>
      <div className="prop-field" style={{ marginTop: 16 }}>
        <label className="prop-field__label" htmlFor="tpl-name">
          Template name
        </label>
        <input
          id="tpl-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') void save();
          }}
        />
      </div>
    </Modal>
  );
}
