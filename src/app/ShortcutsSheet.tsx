import { useEffect, useRef } from 'react';
import { useStore } from '../store/store';
import { SHORTCUT_GROUPS } from './shortcutList';

/** The keyboard shortcuts sheet (press ?). */
export function ShortcutsSheet() {
  const open = useStore((s) => s.helpOpen);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        e.stopPropagation();
        useStore.getState().setHelpOpen(false);
      } else if (e.key === 'Tab') {
        e.preventDefault(); // one focusable control: keep focus inside the dialog
        close.current?.focus();
      }
    };
    window.addEventListener('keydown', key, true);
    return () => {
      window.removeEventListener('keydown', key, true);
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="sheet-backdrop" onPointerDown={() => useStore.getState().setHelpOpen(false)}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <header className="sheet__head">
          <h2 id="sheet-title">Keyboard shortcuts</h2>
          <button
            ref={close}
            className="btn"
            onClick={() => useStore.getState().setHelpOpen(false)}
          >
            Close
          </button>
        </header>
        <div className="sheet__body">
          {SHORTCUT_GROUPS.map((g) => (
            <section key={g.title} className="sheet__group">
              <h3>{g.title}</h3>
              <dl>
                {g.items.map((i) => (
                  <div key={i.keys + i.action} className="sheet__row">
                    <dt>
                      <kbd>{i.keys}</kbd>
                    </dt>
                    <dd>{i.action}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
