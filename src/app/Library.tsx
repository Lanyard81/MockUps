import { useEffect, useMemo, useRef, useState } from 'react';
import {
  searchCatalogue,
  type CatalogueComponent,
  type CatalogueVariant,
  type Category,
} from '../catalogue';
import { getThumbnail } from '../catalogue/thumbnails';
import { beginPendingDrag, consumeDragClick } from '../canvas/drag';
import { getKit } from '../kits';
import type { KitId, LayoutBlock } from '../kits/types';
import { useStore } from '../store/store';
import { PageParts } from './PageParts';

type Filter = Category | 'All';

/** Where "click to add" puts things: the selected frame, else the first one. */
function useTargetFrame() {
  return useStore((s) => s.doc.frames.find((f) => f.id === s.selectedFrameId) ?? s.doc.frames[0]);
}

export function Library() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const target = useTargetFrame();
  // The library shows the kit of the frame that "click to add" would use.
  const kit = getKit(target?.kitId);
  const results = useMemo(() => searchCatalogue(query, filter, kit.id), [query, filter, kit.id]);
  const showLayoutBlocks =
    (filter === 'All' || filter === kit.layoutCategory) && query.trim() === '';

  const grouped = kit.categories
    .map((category) => ({
      category,
      items: results.filter((r) => r.component.category === category),
    }))
    .filter((g) => g.items.length > 0 || (g.category === kit.layoutCategory && showLayoutBlocks));

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
          {(['All', ...kit.categories] as Filter[]).map((c) => (
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
            {category === kit.layoutCategory && showLayoutBlocks && (
              <>
                {kit.pageParts.length > 0 && (
                  <div className="component" data-testid="page-parts">
                    <div className="component__head">
                      <h3 className="component__name">Quick page parts</h3>
                    </div>
                    <PageParts frameId={target?.id} kitId={kit.id} />
                  </div>
                )}
                <LayoutBlocks frameId={target?.id} kitId={kit.id} />
              </>
            )}
            {items.map(({ component, variants }) => (
              <ComponentGroup
                key={component.id}
                component={component}
                variants={variants}
                frameId={target?.id}
                kitId={kit.id}
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
  kitId,
}: {
  component: CatalogueComponent;
  variants: CatalogueVariant[];
  frameId?: string;
  kitId: KitId;
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
          <Tile key={v.id} component={component} variant={v} frameId={frameId} kitId={kitId} />
        ))}
      </div>
    </div>
  );
}

function Tile({
  component,
  variant,
  frameId,
  kitId,
}: {
  component: CatalogueComponent;
  variant: CatalogueVariant;
  frameId?: string;
  kitId: KitId;
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
        void getThumbnail(component.id, variant, component.fullWidth, kitId).then((url) => {
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
  }, [component, variant, kitId]);

  return (
    <button
      ref={ref}
      className="tile"
      disabled={!frameId}
      title={`Add “${component.name} – ${variant.label}”`}
      onPointerDown={(e) =>
        beginPendingDrag(e, {
          kind: 'new-component',
          componentId: component.id,
          variantId: variant.id,
          label: `${component.name} · ${variant.label}`,
        })
      }
      onClick={() => {
        if (consumeDragClick()) return;
        if (frameId) useStore.getState().addComponent(frameId, component.id, variant.id);
      }}
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

function BlockTile({ frameId, block }: { frameId?: string; block: LayoutBlock }) {
  return (
    <button
      className="tile"
      disabled={!frameId}
      title={block.title}
      onPointerDown={(e) =>
        beginPendingDrag(e, {
          kind: 'new-layout',
          block: block.kind,
          columns: block.columns,
          label: block.label,
        })
      }
      onClick={() => {
        if (consumeDragClick()) return;
        if (frameId) useStore.getState().addLayoutBlock(frameId, block.kind, block.columns);
      }}
    >
      <span className="tile__thumb tile__thumb--icon">
        <svg viewBox="0 0 64 40" aria-hidden="true">
          {block.icon.map((r, i) => (
            <rect
              key={i}
              x={r.x}
              y={r.y}
              width={r.width}
              height={r.height}
              rx={r.fill ? 1 : 2}
              className={r.fill ? 'fill' : undefined}
            />
          ))}
        </svg>
      </span>
      <span className="tile__label">{block.label}</span>
    </button>
  );
}

function LayoutBlocks({ frameId, kitId }: { frameId?: string; kitId: KitId }) {
  return (
    <div className="component" data-testid="layout-blocks">
      <div className="component__head">
        <h3 className="component__name">Layout blocks</h3>
      </div>
      <div className="tiles">
        {getKit(kitId).layoutBlocks.map((b) => (
          <BlockTile key={`${b.kind}:${b.columns ?? ''}`} frameId={frameId} block={b} />
        ))}
      </div>
    </div>
  );
}
