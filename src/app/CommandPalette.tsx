import { useEffect, useMemo, useRef, useState } from 'react';
import { rankItems } from '../lib/rank';
import { useStore } from '../store/store';
import { buildPaletteItems, type PaletteItem } from './paletteItems';

/** ⌘K: one box to find an action, frame, component, template, sample or comment, and run it. */
export function CommandPalette() {
  const open = useStore((s) => s.paletteOpen);
  if (!open) return null;
  return <Inner />;
}

function Inner() {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const items = useMemo(() => buildPaletteItems(), []);
  const results = useMemo(() => rankItems(items, query), [items, query]);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const close = () => useStore.getState().setPaletteOpen(false);
  const active = Math.min(index, Math.max(0, results.length - 1));

  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, results]);

  const run = (item: PaletteItem | undefined) => {
    if (!item) return;
    close();
    // Let the palette close (and focus return) before the action opens a dialog or starts editing.
    setTimeout(item.run, 0);
  };

  return (
    <div
      className="palette-backdrop"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="palette" role="dialog" aria-label="Command palette" aria-modal="true">
        <input
          ref={input}
          className="palette__input"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={results[active] ? `pal-${results[active]!.id}` : undefined}
          aria-label="Search commands"
          placeholder="Search actions, frames, components, templates…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Escape' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
              e.preventDefault();
              close();
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              setIndex((active + 1) % Math.max(1, results.length));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setIndex((active - 1 + results.length) % Math.max(1, results.length));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              run(results[active]);
            }
          }}
        />
        <ul id="palette-list" ref={list} className="palette__list" role="listbox">
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`pal-${r.id}`}
              role="option"
              aria-selected={i === active}
              className={`palette__row${i === active ? ' is-active' : ''}`}
              onPointerMove={() => setIndex(i)}
              onClick={() => run(r)}
            >
              <span className="palette__label">{r.label}</span>
              <span className="palette__meta">
                {r.hint ? `${r.hint} · ` : ''}
                {r.group}
              </span>
            </li>
          ))}
          {results.length === 0 && (
            <li className="palette__none" role="presentation">
              Nothing matches “{query}”.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
