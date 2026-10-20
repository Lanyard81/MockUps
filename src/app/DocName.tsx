import { useState } from 'react';
import { useStore } from '../store/store';

/** The mockup's name (click to rename) and whether it is saved. */
export function DocName() {
  const name = useStore((s) => s.doc.name);
  const saveState = useStore((s) => s.saveState);
  const storageOk = useStore((s) => s.storageOk);
  const [editing, setEditing] = useState(false);

  const status =
    storageOk === false || saveState === 'error'
      ? { text: 'Not saved automatically', cls: 'is-warn' }
      : saveState === 'saving'
        ? { text: 'Saving…', cls: '' }
        : { text: 'Saved', cls: 'is-ok' };

  return (
    <div className="docname">
      {editing ? (
        <input
          className="docname__input"
          autoFocus
          defaultValue={name}
          aria-label="Mockup name"
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => {
            useStore.getState().renameDoc(e.currentTarget.value);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      ) : (
        <button
          className="docname__button"
          onClick={() => setEditing(true)}
          title="Click to rename"
        >
          {name}
        </button>
      )}
      <span className={`docname__status ${status.cls}`} role="status" data-testid="save-status">
        {status.text}
      </span>
    </div>
  );
}
