import { useEffect, useState } from 'react';
import { useStore } from '../store/store';

/**
 * A short message at the bottom of the screen. The live region is always on the page, so screen
 * readers announce each message as it arrives. It stays while the pointer or focus is on it.
 */
export function Toast() {
  const notice = useStore((s) => s.notice);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!notice || held) return;
    const t = setTimeout(() => useStore.getState().setNotice(null), 8000);
    return () => clearTimeout(t);
  }, [notice, held]);
  return (
    <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">
      {notice && (
        <div
          className="toast"
          onPointerEnter={() => setHeld(true)}
          onPointerLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={() => setHeld(false)}
        >
          <span>{notice}</span>
          <button
            className="toast__close"
            aria-label="Dismiss"
            onClick={() => useStore.getState().setNotice(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
