import { useState } from 'react';
import { saveToFile } from '../persistence/file';
import { loadMockup } from '../persistence/library';
import { useStore } from '../store/store';

/**
 * One banner at the top for the three things that put work at risk: another tab changed this
 * mockup, the browser won't keep data at all, or the last save failed (storage full).
 */
export function StorageBanner() {
  const ok = useStore((s) => s.storageOk);
  const conflict = useStore((s) => s.conflict);
  const saveState = useStore((s) => s.saveState);
  const [dismissed, setDismissed] = useState<string | null>(null);

  if (conflict) {
    return (
      <div className="banner" role="alert">
        <p>
          <strong>This mockup was changed in another tab.</strong> Saving is paused here so the
          other tab’s changes aren’t overwritten. Load the other tab’s version, or keep what is on
          this screen (it will replace the other version the next time you change something).
        </p>
        <div className="banner__actions">
          <button
            className="btn btn--primary"
            onClick={async () => {
              const st = useStore.getState();
              const fresh = await loadMockup(st.doc.id);
              if (fresh) st.loadDoc(fresh);
              else st.setConflict(false);
            }}
          >
            Load the other tab’s version
          </button>
          <button
            className="btn"
            onClick={() => {
              const st = useStore.getState();
              st.setConflict(false);
              st.setSaveState('saving');
              // Nudge the autosave with a copy of the same document (no history entry).
              useStore.setState((s) => ({ doc: { ...s.doc } }));
            }}
          >
            Keep this version
          </button>
        </div>
      </div>
    );
  }
  const kind = ok === false ? 'blocked' : saveState === 'error' ? 'failed' : null;
  if (!kind || dismissed === kind) return <div className="banner-slot" />;
  return (
    <div className="banner" role="alert">
      {kind === 'blocked' ? (
        <p>
          <strong>Your work isn’t being saved automatically.</strong> This browser won’t keep data
          for this page between visits (this is common when a page is opened from a file, or in a
          private window). Use <em>Save to file</em> to keep your work, and <em>Open file</em> to
          carry on later.
        </p>
      ) : (
        <p>
          <strong>Your last change couldn’t be saved.</strong> The browser’s storage may be full or
          unavailable. This message goes away as soon as a save works again. Use{' '}
          <em>Save to file</em> to keep a copy now.
        </p>
      )}
      <div className="banner__actions">
        <button className="btn" onClick={saveToFile}>
          Save to file
        </button>
        <button className="btn" onClick={() => setDismissed(kind)}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
