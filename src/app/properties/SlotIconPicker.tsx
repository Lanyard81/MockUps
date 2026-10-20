import { useEffect, useMemo, useRef, useState } from 'react';
import { kitOfComponent } from '../../catalogue';
import { getKit } from '../../kits';
import { useStore } from '../../store/store';

const SHOWN = 120;

/** A searchable picker for the icons of the component's own kit (SharePoint: Fluent System Icons). */
export function SlotIconPicker({
  nodeId,
  label,
  value,
  onChange,
}: {
  nodeId: string;
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const componentId = useStore((s) => s.doc.nodes[nodeId]?.componentId);
  const icons = getKit(componentId ? kitOfComponent(componentId) : undefined).icons;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', away);
    return () => window.removeEventListener('pointerdown', away);
  }, [open]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, '_');
    return (icons?.names ?? []).filter((n) => n.includes(q)).slice(0, SHOWN);
  }, [icons, query]);
  if (!icons) return null;

  return (
    <div className="icon-picker" ref={wrap}>
      <button
        className="btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(!open)}
      >
        {value ? (
          <>
            <span
              className="icon-picker__current"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: icons.render(value) }}
            />{' '}
            {value.replace(/_/g, ' ')}
          </>
        ) : (
          'Choose an icon…'
        )}
      </button>
      {value && (
        <button className="btn" onClick={() => onChange(null)}>
          Clear
        </button>
      )}
      {open && (
        <div className="icon-picker__pop" role="dialog" aria-label="Choose an icon">
          <input
            type="search"
            autoFocus
            placeholder="Search icons"
            aria-label="Search icons"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <div className="icon-grid">
            {matches.map((name) => (
              <button
                key={name}
                className="icon-grid__item"
                title={name.replace(/_/g, ' ')}
                aria-label={name.replace(/_/g, ' ')}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                dangerouslySetInnerHTML={{ __html: icons.render(name) }}
              />
            ))}
            {matches.length === 0 && <p className="prop-hint">No icons match “{query}”.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
