import { useEffect } from 'react';
import { useStore } from '../store/store';

/** A short message at the bottom of the screen that clears itself. */
export function Toast() {
  const notice = useStore((s) => s.notice);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => useStore.getState().setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  if (!notice) return null;
  return (
    <div className="toast" role="status">
      {notice}
      <button
        className="toast__close"
        aria-label="Dismiss"
        onClick={() => useStore.getState().setNotice(null)}
      >
        ×
      </button>
    </div>
  );
}
