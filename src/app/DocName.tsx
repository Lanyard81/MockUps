import { useState } from 'react';
import { useStore } from '../store/store';

/** The mockup's name (click to rename) and whether it is saved. */
export function DocName() {
  const name = useStore((s) => s.doc.name);
  const saveState = useStore((s) => s.saveState);
  const storageOk = useStore((s) => s.storageOk);
  const conflict = useStore((s) => s.conflict);
  const savedAt = useStore((s) => s.savedAt);
  const [editing, setEditing] = useState(false);

  const time = savedAt ? new Date(savedAt).toLocaleTimeString('en-AU', { timeStyle: 'short' }) : '';
  const status = conflict
    ? {
        text: 'Changed in another tab',
        cls: 'is-warn',
        tip: 'Saving is paused. See the message at the top.',
      }
    : storageOk === false || saveState === 'error'
      ? {
          text: 'Not saved automatically',
          cls: 'is-warn',
          tip: 'Use File → Save to file to keep a copy.',
        }
      : saveState === 'saving'
        ? { text: 'Saving…', cls: '', tip: 'Saving in this browser' }
        : {
            text: 'Saved',
            cls: 'is-ok',
            tip: `Saved in this browser${time ? ` at ${time}` : ''}. Use File → Save to file to keep a copy you can carry elsewhere.`,
          };

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
      <span
        className={`docname__status ${status.cls}`}
        role="status"
        title={status.tip}
        data-testid="save-status"
      >
        {status.text}
      </span>
    </div>
  );
}
