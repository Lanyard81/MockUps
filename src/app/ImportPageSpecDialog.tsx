import { useRef, useState } from 'react';
import { copyPageSpecInstructions } from '../export/pageSpec';
import { KITS } from '../kits';
import { useStore } from '../store/store';
import { Modal } from './Modal';

/** Paste page spec JSON, or choose a `.page.json` file, and import it as new frames. */
export function ImportPageSpecDialog() {
  const open = useStore((s) => s.dialog === 'importSpec');
  if (!open) return null;
  return <Inner />;
}

function Inner() {
  const [text, setText] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const close = () => useStore.getState().setDialog(null);
  const run = () => {
    if (useStore.getState().importPageSpecText(text)) close();
  };
  return (
    <Modal
      title="Import page spec"
      width={560}
      onClose={close}
      footer={
        <>
          <button className="btn" onClick={() => file.current?.click()}>
            Choose a file…
          </button>
          <button className="btn" onClick={close}>
            Cancel
          </button>
          <button className="btn btn--primary" disabled={!text.trim()} onClick={run}>
            Import
          </button>
        </>
      }
    >
      <p className="modal__text">
        Paste the JSON of a page spec (from a Claude chat, or Copy as page spec). Each page becomes
        a new frame beside the others, and Undo removes them.
      </p>
      <textarea
        className="import-spec__text"
        aria-label="Page spec JSON"
        rows={10}
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        placeholder='{ "format": "mockup-page-spec", "version": 1, "kit": "nsw", "page": [ … ] }'
      />
      <p className="modal__text">
        Don’t have one yet? Copy the instructions, paste them into a Claude chat with a screenshot,
        and paste the answer here:
      </p>
      <div className="prop-actions">
        {KITS.map((k) => (
          <button key={k.id} className="btn" onClick={() => void copyPageSpecInstructions(k.id)}>
            Copy instructions for {k.shortLabel}
          </button>
        ))}
      </div>
      <input
        ref={file}
        type="file"
        accept=".json,application/json"
        hidden
        aria-label="Page spec file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          void f.text().then((t) => {
            if (useStore.getState().importPageSpecText(t)) close();
          });
        }}
      />
    </Modal>
  );
}
