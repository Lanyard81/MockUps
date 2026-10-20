import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Item {
  label: string;
  hint?: string;
  onSelect: () => void;
}

/** A small button-with-dropdown, closed by outside click or Esc. */
export function Menu({ label, items, icon }: { label: ReactNode; items: Item[]; icon?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', away);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', away);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="menu" ref={ref}>
      <button
        className="btn btn--primary"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {icon && <span aria-hidden>{icon}</span>}
        {label}
      </button>
      {open && (
        <div className="menu__list" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              className="menu__item"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              <span>{item.label}</span>
              {item.hint && <span className="menu__hint">{item.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
