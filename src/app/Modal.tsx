import { useEffect, useRef, type ReactNode } from 'react';

/** A centred dialog over a dimmed page. Esc or clicking outside closes it; focus returns afterwards. */
export function Modal({
  title,
  onClose,
  children,
  width = 560,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    // The page behind a dialog can't be reached by keyboard or screen reader until it closes.
    const backdrop = ref.current?.parentElement ?? null;
    const behind = Array.from(document.querySelectorAll('.app > *')).filter(
      (el) =>
        el !== backdrop &&
        !el.contains(backdrop) &&
        !el.classList.contains('toast-region') &&
        !el.hasAttribute('inert'),
    );
    behind.forEach((el) => el.setAttribute('inert', ''));
    const first = ref.current?.querySelector<HTMLElement>(
      '[autofocus], input, select, textarea, button:not([data-modal-close])',
    );
    (first ?? ref.current)?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Tab' && ref.current) {
        const items = [
          ...ref.current.querySelectorAll<HTMLElement>(
            'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
          ),
        ];
        if (items.length === 0) return;
        const i = items.indexOf(document.activeElement as HTMLElement);
        const next = e.shiftKey
          ? i <= 0
            ? items.length - 1
            : i - 1
          : i === items.length - 1
            ? 0
            : i + 1;
        e.preventDefault();
        items[next]!.focus();
      }
    };
    window.addEventListener('keydown', key, true);
    return () => {
      window.removeEventListener('keydown', key, true);
      behind.forEach((el) => el.removeAttribute('inert'));
      previous?.focus?.();
    };
    // `onClose` is stable enough for the lifetime of the dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="sheet-backdrop" onPointerDown={onClose}>
      <div
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{ width: `min(${width}px, 100%)` }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <header className="sheet__head">
          <h2>{title}</h2>
          <button className="btn btn--icon" data-modal-close aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>
  );
}
