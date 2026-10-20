import { useState } from 'react';
import { saveToFile } from '../persistence/file';
import { useStore } from '../store/store';

/** Shown when the browser won't keep work between visits, so people know to save a file. */
export function StorageBanner() {
  const ok = useStore((s) => s.storageOk);
  const [dismissed, setDismissed] = useState(false);
  if (ok !== false || dismissed) return <div className="banner-slot" />;
  return (
    <div className="banner" role="alert">
      <p>
        <strong>Your work isn’t being saved automatically.</strong> This browser won’t keep data for
        this page between visits (this is common when a page is opened from a file, or in a private
        window). Use <em>Save to file</em> to keep your work, and <em>Open file</em> to carry on
        later.
      </p>
      <div className="banner__actions">
        <button className="btn" onClick={saveToFile}>
          Save to file
        </button>
        <button className="btn" onClick={() => setDismissed(true)}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
