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
import { blockUnavailable, useStore } from '../store/store';
import { MyComponents } from './MyComponents';
import { KitSwitcher } from './KitSwitcher';
import { PageParts } from './PageParts';
import { useLibraryKit } from './useLibraryKit';
import { kitMismatchMessage } from '../layout/kitGuard';

type Filter = Category | 'All';

export function Library() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const { kit, target, mismatch } = useLibraryKit();
  // The filter belongs to a kit's categories: reset it when the kit changes.
  const activeFilter: Filter = filter === 'All' || kit.categories.includes(filter) ? filter : 'All';
  const results = useMemo(
    () => searchCatalogue(query, activeFilter, kit.id),
    [query, activeFilter, kit.id],
  );
  const showLayoutBlocks =
    (activeFilter === 'All' || activeFilter === kit.layoutCategory) && query.trim() === '';

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
              className={`chip${activeFilter === c ? ' is-active' : ''}`}
              aria-pressed={activeFilter === c}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <KitSwitcher />
        <p className="library__target">
          {mismatch && target ? (
            <span className="library__warn" role="status">
              {kitMismatchMessage(target.kitId)}
            </span>
          ) : target ? (
            <>
              Click to add to <strong>{target.name}</strong>
            </>
          ) : (
            'Add a page to start building'
          )}
        </p>
      </div>

      <div className="library__scroll" data-testid="library-scroll">
        {query.trim() === '' && (
          <MyComponents kitId={kit.id} frameId={mismatch ? undefined : target?.id} />
        )}
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
                    <PageParts frameId={mismatch ? undefined : target?.id} kitId={kit.id} />
                  </div>
                )}
                <LayoutBlocks frameId={mismatch ? undefined : target?.id} kitId={kit.id} />
              </>
            )}
            {items.map(({ component, variants }) => (
              <ComponentGroup
                key={component.id}
                component={component}
                variants={variants}
                frameId={mismatch ? undefined : target?.id}
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

function BlockTile({
  frameId,
  block,
  kitId,
}: {
  frameId?: string;
  block: LayoutBlock;
  kitId: KitId;
}) {
  // A kit rule can rule a block out for this frame (e.g. full-width sections on a team site).
  const reason = useStore((s) =>
    frameId ? blockUnavailable(s.doc, frameId, block.kind, block.columns) : null,
  );
  return (
    <button
      className="tile"
      disabled={!frameId || reason !== null}
      title={reason ?? block.title}
      onPointerDown={(e) =>
        beginPendingDrag(e, {
          kind: 'new-layout',
          kitId,
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
          <BlockTile
            key={`${b.kind}:${b.columns ?? ''}`}
            frameId={frameId}
            block={b}
            kitId={kitId}
          />
        ))}
      </div>
    </div>
  );
}
