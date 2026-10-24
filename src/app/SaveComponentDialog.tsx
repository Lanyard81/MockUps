import { useState } from 'react';
import { nodeLabel } from '../layout/labels';
import { useStore } from '../store/store';
import { Modal } from './Modal';

/** Ask for a name, then save the selected component or section for reuse. */
export function SaveComponentDialog() {
  const open = useStore((s) => s.dialog === 'saveComponent');
  const nodeId = useStore((s) => s.dialogNodeId);
  const node = useStore((s) => (nodeId ? s.doc.nodes[nodeId] : undefined));
  const kitId = useStore((s) => s.doc.frames.find((f) => f.id === s.dialogFrameId)?.kitId);
  if (!open || !node || !nodeId) return null;
  return <Inner nodeId={nodeId} initial={nodeLabel(node, kitId)} />;
}

function Inner({ nodeId, initial }: { nodeId: string; initial: string }) {
  const [name, setName] = useState(initial);
  const close = () => useStore.getState().setDialog(null);
  const save = () => {
    if (!name.trim()) return;
    if (useStore.getState().saveAsComponent(nodeId, name)) close();
  };
  return (
    <Modal
      title="Save as component"
      width={440}
      onClose={close}
      footer={
        <>
          <button className="btn" onClick={close}>
            Cancel
          </button>
          <button className="btn btn--primary" disabled={!name.trim()} onClick={save}>
            Save component
          </button>
        </>
      }
    >
      <p className="modal__text">
        Keep this so you can add it to any frame later, with its text and options as they are now.
        It’s saved in this browser, and goes with your mockups when you save to a file.
      </p>
      <div className="prop-field" style={{ marginTop: 16 }}>
        <label className="prop-field__label" htmlFor="cmp-name">
          Name
        </label>
        <input
          id="cmp-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') save();
          }}
        />
      </div>
    </Modal>
  );
}
