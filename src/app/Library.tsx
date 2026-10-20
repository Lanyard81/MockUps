import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORIES,
  searchCatalogue,
  type CatalogueComponent,
  type CatalogueVariant,
  type Category,
} from '../catalogue';
import { getThumbnail } from '../catalogue/thumbnails';
import { useStore } from '../store/store';

type Filter = Category | 'All';

/** Where "click to add" puts things: the selected frame, else the first one. */
function useTargetFrame() {
  return useStore((s) => s.doc.frames.find((f) => f.id === s.selectedFrameId) ?? s.doc.frames[0]);
}

export function Library() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const target = useTargetFrame();
  const results = useMemo(() => searchCatalogue(query, filter), [query, filter]);
  const showLayoutBlocks = (filter === 'All' || filter === 'Layout') && query.trim() === '';

  const grouped = CATEGORIES.map((category) => ({
    category,
    items: results.filter((r) => r.component.category === category),
  })).filter((g) => g.items.length > 0 || (g.category === 'Layout' && showLayoutBlocks));

  return (
    <aside className="library" aria-label="Component library">
      <div className="library__head">
        <input
          type="search"
          className="library__search"
          placeholder="Search components"
          aria-label="Search components"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chips" role="group" aria-label="Category">
          {(['All', ...CATEGORIES] as Filter[]).map((c) => (
            <button
              key={c}
              className={`chip${filter === c ? ' is-active' : ''}`}
              aria-pressed={filter === c}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="library__target">
          {target ? (
            <>
              Click to add to <strong>{target.name}</strong>
            </>
          ) : (
            'Add a frame to start building'
          )}
        </p>
      </div>

      <div className="library__scroll" data-testid="library-scroll">
        {grouped.map(({ category, items }) => (
          <section key={category} className="library__group" aria-label={category}>
            <h2 className="library__category">{category}</h2>
            {category === 'Layout' && showLayoutBlocks && <LayoutBlocks frameId={target?.id} />}
            {items.map(({ component, variants }) => (
              <ComponentGroup
                key={component.id}
                component={component}
                variants={variants}
                frameId={target?.id}
              />
            ))}
          </section>
        ))}
        {grouped.length === 0 && (
          <p className="library__none">
            Nothing matches “{query}”. Try a simpler word, such as “button”, “card” or “menu”.
          </p>
        )}
      </div>
    </aside>
  );
}

function ComponentGroup({
  component,
  variants,
  frameId,
}: {
  component: CatalogueComponent;
  variants: CatalogueVariant[];
  frameId?: string;
}) {
  return (
    <div className="component" data-testid={`component-${component.id}`}>
      <div className="component__head">
        <h3 className="component__name">{component.name}</h3>
        {component.fidelity !== 'full' && (
          <span className="badge" title={component.note}>
            {component.fidelity === 'static' ? 'Static' : 'Partial'}
          </span>
        )}
      </div>
      <div className={`tiles${component.fullWidth ? ' tiles--wide' : ''}`}>
        {variants.map((v) => (
          <Tile key={v.id} component={component} variant={v} frameId={frameId} />
        ))}
      </div>
    </div>
  );
}

function Tile({
  component,
  variant,
  frameId,
}: {
  component: CatalogueComponent;
  variant: CatalogueVariant;
  frameId?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Render the thumbnail only once the tile scrolls into view.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        void getThumbnail(component.id, variant, component.fullWidth).then((url) => {
          if (cancelled) return;
          if (url) setSrc(url);
          else setFailed(true);
        });
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [component, variant]);

  return (
    <button
      ref={ref}
      className="tile"
      disabled={!frameId}
      title={`Add “${component.name} – ${variant.label}”`}
      onClick={() => frameId && useStore.getState().addComponent(frameId, component.id, variant.id)}
    >
      <span className="tile__thumb">
        {src ? (
          <img src={src} alt="" draggable={false} />
        ) : (
          <span className={`tile__skeleton${failed ? ' is-failed' : ''}`}>
            {failed ? component.name : ''}
          </span>
        )}
      </span>
      <span className="tile__label">{variant.label}</span>
    </button>
  );
}

const GRID_ICONS: Record<number, number[]> = { 1: [12], 2: [6, 6], 3: [4, 4, 4], 4: [3, 3, 3, 3] };

function LayoutBlocks({ frameId }: { frameId?: string }) {
  const add = (kind: 'section' | 'container' | 'grid', columns?: number) =>
    frameId && useStore.getState().addLayoutBlock(frameId, kind, columns);
  return (
    <div className="component" data-testid="layout-blocks">
      <div className="component__head">
        <h3 className="component__name">Layout blocks</h3>
      </div>
      <div className="tiles">
        <button
          className="tile"
          disabled={!frameId}
          onClick={() => add('section')}
          title="Add a full-width section"
        >
          <span className="tile__thumb tile__thumb--icon">
            <svg viewBox="0 0 64 40" aria-hidden="true">
              <rect x="2" y="6" width="60" height="28" rx="2" />
              <rect x="12" y="14" width="40" height="12" rx="1" className="fill" />
            </svg>
          </span>
          <span className="tile__label">Section</span>
        </button>
        <button
          className="tile"
          disabled={!frameId}
          onClick={() => add('container')}
          title="Add a container (nsw-container)"
        >
          <span className="tile__thumb tile__thumb--icon">
            <svg viewBox="0 0 64 40" aria-hidden="true">
              <rect x="14" y="4" width="36" height="32" rx="2" />
              <rect x="20" y="12" width="24" height="6" rx="1" className="fill" />
            </svg>
          </span>
          <span className="tile__label">Container</span>
        </button>
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            className="tile"
            disabled={!frameId}
            onClick={() => add('grid', n)}
            title={`Add a grid with ${n} column${n > 1 ? 's' : ''}`}
          >
            <span className="tile__thumb tile__thumb--icon">
              <svg viewBox="0 0 64 40" aria-hidden="true">
                {GRID_ICONS[n]!.map((span, i, all) => {
                  const total = 56 - (all.length - 1) * 4;
                  const w = (total * span) / 12;
                  const x = 4 + all.slice(0, i).reduce((acc, sp) => acc + (total * sp) / 12 + 4, 0);
                  return <rect key={i} x={x} y="6" width={w} height="28" rx="2" className="fill" />;
                })}
              </svg>
            </span>
            <span className="tile__label">
              {n} column{n > 1 ? 's' : ''}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
