import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export interface OverflowItem {
  key: string;
  /** What the "More" button says when this item is the active one and has been tucked away. */
  label: string;
  node: ReactNode;
}

/**
 * A row that shows as many items as fit and puts the rest in a "More" menu, so nothing needs sideways
 * scrolling. Items are measured when they are shown and the widths remembered, so a tucked-away item
 * comes back as soon as there is room.
 */
export function Overflow({
  items,
  className,
  activeKey,
  moreLabel = 'More',
  role,
  onKeyDown,
}: {
  items: OverflowItem[];
  className?: string;
  /** If this item is tucked away, the "More" button is highlighted and named after it. */
  activeKey?: string;
  moreLabel?: string;
  /** `tablist` makes the row a tab strip: items are tabs, and the More button is a tab that opens the rest. */
  role?: 'tablist';
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widths = useRef(new Map<string, number>());
  const moreWidth = useRef(76);
  const [tick, setTick] = useState(0);
  const [hidden, setHidden] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTick((t) => t + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Deliberately runs after every render: it re-measures, and setHidden bails out when unchanged.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const gap = parseFloat(cs.columnGap) || 0;
    const avail =
      el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    for (const child of Array.from(el.children) as HTMLElement[]) {
      const w = child.getBoundingClientRect().width;
      if (child.dataset.ovkey) widths.current.set(child.dataset.ovkey, w);
      else if (child.dataset.ovmore) moreWidth.current = w;
    }
    let fit = items.length;
    for (; fit > 0; fit--) {
      let need = 0;
      for (let i = 0; i < fit; i++)
        need += (widths.current.get(items[i]!.key) ?? 0) + (i ? gap : 0);
      if (fit < items.length) need += gap + moreWidth.current;
      if (need <= avail) break;
    }
    setHidden(items.length - fit);
  });

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

  void tick;
  const shown = items.slice(0, items.length - hidden);
  const tucked = items.slice(items.length - hidden);
  const activeTucked = tucked.find((i) => i.key === activeKey);
  return (
    <div
      className={`overflow${className ? ` ${className}` : ''}`}
      ref={ref}
      role={role}
      onKeyDown={onKeyDown}
    >
      {shown.map((i) => (
        <div
          key={i.key}
          className="overflow__item"
          data-ovkey={i.key}
          role={role ? 'presentation' : undefined}
        >
          {i.node}
        </div>
      ))}
      {tucked.length > 0 && (
        <div className="overflow__more" data-ovmore="1">
          <button
            className={`btn${activeTucked ? ' is-active' : ''}`}
            aria-haspopup={role ? 'menu' : 'true'}
            aria-expanded={open}
            {...(role
              ? { role: 'tab', 'aria-selected': !!activeTucked, tabIndex: activeTucked ? 0 : -1 }
              : {})}
            onClick={() => setOpen(!open)}
          >
            {activeTucked ? activeTucked.label : moreLabel} <span aria-hidden>▾</span>
          </button>
          {open && (
            <div
              className="overflow__pop"
              role={role}
              onClick={(e) => {
                const b = (e.target as HTMLElement).closest('button');
                if (b && !b.hasAttribute('aria-haspopup')) setOpen(false);
              }}
            >
              {tucked.map((i) => (
                <div
                  key={i.key}
                  className="overflow__item"
                  role={role ? 'presentation' : undefined}
                >
                  {i.node}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
