import { useEffect, useMemo, useRef, useState } from 'react';
import icons from '../../kits/nsw/catalogue/generated/icons.json';
import { FONT_FACES } from '../../kits/nsw/shell';

const ALL_ICONS = icons as string[];
const SHOWN = 240;

let fontReady: Promise<void> | null = null;
/** The editor loads the icon font under its own family name, only to draw the picker. */
function loadIconFont(): Promise<void> {
  fontReady ??= (async () => {
    const face = FONT_FACES.find((f) => f.family === 'Material Icons')!;
    const font = new FontFace('Editor Icons', `url(${face.url})`);
    await font.load();
    document.fonts.add(font);
  })().catch(() => undefined);
  return fontReady;
}

export interface IconValue {
  name: string;
  position: 'before' | 'after';
}

/** A searchable Material Icons picker with before/after placement. */
export function IconPicker({
  value,
  onChange,
}: {
  value: IconValue | null;
  onChange: (v: IconValue | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [ready, setReady] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadIconFont().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', away);
    return () => window.removeEventListener('pointerdown', away);
  }, [open]);

  const matches = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const list = terms.length
      ? ALL_ICONS.filter((n) => terms.every((t) => n.replace(/_/g, ' ').includes(t)))
      : ALL_ICONS;
    return { total: list.length, shown: list.slice(0, SHOWN) };
  }, [query]);

  const position = value?.position ?? 'before';
  return (
    <div className="icon-picker" ref={wrap}>
      <div className="icon-picker__row">
        <button
          className="btn"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {value ? (
            <>
              <span className="ed-icon" aria-hidden="true">
                {ready ? value.name : ''}
              </span>
              {value.name.replace(/_/g, ' ')}
            </>
          ) : (
            'Choose icon…'
          )}
        </button>
        {value && (
          <button className="btn" onClick={() => onChange(null)} aria-label="Remove icon">
            Remove
          </button>
        )}
      </div>
      {value && (
        <div className="segmented segmented--block" role="group" aria-label="Icon position">
          {(['before', 'after'] as const).map((p) => (
            <button
              key={p}
              className={position === p ? 'is-active' : ''}
              aria-pressed={position === p}
              onClick={() => onChange({ name: value.name, position: p })}
            >
              {p === 'before' ? 'Before text' : 'After text'}
            </button>
          ))}
        </div>
      )}
      {open && (
        <div className="icon-picker__pop" role="dialog" aria-label="Choose an icon">
          <input
            type="search"
            autoFocus
            placeholder="Search icons, e.g. arrow, search, home"
            aria-label="Search icons"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Escape') setOpen(false);
            }}
          />
          <div className="icon-grid" role="listbox" aria-label="Icons">
            {matches.shown.map((name) => (
              <button
                key={name}
                role="option"
                aria-selected={value?.name === name}
                className={`icon-grid__item${value?.name === name ? ' is-active' : ''}`}
                title={name.replace(/_/g, ' ')}
                onClick={() => {
                  onChange({ name, position });
                  setOpen(false);
                }}
              >
                <span className="ed-icon" aria-hidden="true">
                  {ready ? name : ''}
                </span>
                <span className="sr-only">{name.replace(/_/g, ' ')}</span>
              </button>
            ))}
          </div>
          <p className="prop-hint">
            {matches.total === 0
              ? 'No icons match.'
              : matches.total > SHOWN
                ? `Showing ${SHOWN} of ${matches.total}. Type to narrow.`
                : `${matches.total} icons`}
          </p>
        </div>
      )}
    </div>
  );
}
