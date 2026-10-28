import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

interface Item {
  label: string;
  hint?: string;
  onSelect: () => void;
  disabled?: boolean;
  separatorBefore?: boolean;
}

/** A small button-with-dropdown, closed by outside click or Esc. Arrow keys move through the items. */
export function Menu({
  label,
  items,
  icon,
  plain,
  header,
}: {
  label: ReactNode;
  items: Item[];
  icon?: string;
  /** A quiet button rather than the blue call to action. */
  plain?: boolean;
  /** Controls shown above the items (e.g. a choice that changes what the items do). They are not menu items. */
  header?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) button.current?.focus();
  };
  const enabledItems = () =>
    Array.from(
      ref.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [],
    );

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', away);
    return () => window.removeEventListener('pointerdown', away);
  }, [open]);

  // Opening the menu with the keyboard puts focus on its first item.
  useEffect(() => {
    if (open && ref.current?.dataset.viaKeyboard === 'true') enabledItems()[0]?.focus();
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    const list = enabledItems();
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!list.length) return;
      e.preventDefault();
      const next = e.key === 'ArrowDown' ? (i + 1) % list.length : (i <= 0 ? list.length : i) - 1;
      list[next]?.focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      if (!list.length) return;
      e.preventDefault();
      list[e.key === 'Home' ? 0 : list.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className="menu" ref={ref} onKeyDown={onKeyDown}>
      <button
        ref={button}
        className={`btn${plain ? '' : ' btn--primary'}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={(e) => {
          if (ref.current) ref.current.dataset.viaKeyboard = String(e.detail === 0);
          setOpen(!open);
        }}
        onKeyDown={(e) => {
          if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !open) {
            e.preventDefault();
            if (ref.current) ref.current.dataset.viaKeyboard = 'true';
            setOpen(true);
          }
        }}
      >
        {icon && <span aria-hidden>{icon}</span>}
        {label}
      </button>
      {open && (
        <div className="menu__list" id={id}>
          {header && <div className="menu__header">{header}</div>}
          {items.length > 0 && (
            <div role="menu" aria-label={typeof label === 'string' ? label : undefined}>
              {items.map((item) => (
                <div key={item.label} role="none">
                  {item.separatorBefore && <div className="context-menu__sep" role="separator" />}
                  <button
                    role="menuitem"
                    className="menu__item"
                    disabled={item.disabled}
                    onClick={() => {
                      close(true);
                      item.onSelect();
                    }}
                  >
                    <span>{item.label}</span>
                    {item.hint && <span className="menu__hint">{item.hint}</span>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
