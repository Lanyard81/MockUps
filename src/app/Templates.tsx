import { useEffect, useMemo, useRef, useState } from 'react';
import { getPageThumbnail } from '../catalogue/thumbnails';
import { beginPendingDrag, consumeDragClick } from '../canvas/drag';
import { DEFAULT_KIT_ID } from '../kits';
import { renderFrameHtml } from '../layout/render';
import { useStore } from '../store/store';
import { useTemplates } from '../store/templates';
import { KitSwitcher } from './KitSwitcher';
import { useLibraryKit } from './useLibraryKit';
import {
  OFFICIAL_TEMPLATES,
  templateGroups,
  instantiateOfficial,
  instantiateSaved,
} from '../templates';
import { templateAsNewFrame, type TemplateRef } from '../templates/use';
import type { SavedTemplate } from '../store/types';

/** Ids that don't change between renders, so a template's thumbnail key stays the same. */
const stableIds = () => {
  let i = 0;
  return (prefix: string) => `${prefix}_${++i}`;
};

function useVisible(ref: React.RefObject<HTMLElement | null>): boolean {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, seen]);
  return seen;
}

interface TileProps {
  gref: TemplateRef;
  name: string;
  description: string;
  /** A ready-made thumbnail (saved templates), or a way to make one (official ones). */
  thumbnail?: string;
  render?: () => Promise<string | null>;
  actions?: React.ReactNode;
}

function TemplateTile({ gref, name, description, thumbnail, render, actions }: TileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useVisible(ref);
  const [made, setMade] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!visible || thumbnail || !render) return;
    let cancelled = false;
    void render().then((url) => {
      if (cancelled) return;
      if (url) setMade(url);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, thumbnail, render]);

  const src = thumbnail ?? made;
  return (
    <div className="template" ref={ref} data-testid="template-tile">
      <button
        className="template__main"
        title={`Click to add “${name}” as a new page, or drag it onto a page or the canvas`}
        onPointerDown={(e) =>
          beginPendingDrag(e, {
            kind: 'template',
            source: gref.source,
            templateId: gref.templateId,
            label: name,
          })
        }
        onClick={() => {
          if (!consumeDragClick()) templateAsNewFrame(gref);
        }}
      >
        <span className="template__thumb">
          {src ? (
            <img src={src} alt="" draggable={false} />
          ) : (
            <span className={`tile__skeleton${failed ? ' is-failed' : ''}`}>
              {failed ? name : ''}
            </span>
          )}
        </span>
        <span className="template__name">{name}</span>
        <span className="template__desc">{description}</span>
      </button>
      {actions}
    </div>
  );
}

function OfficialTile({ id }: { id: string }) {
  const def = OFFICIAL_TEMPLATES.find((t) => t.id === id)!;
  // Rendered once per template: the ids are fixed so the cached thumbnail is found again.
  const html = useMemo(() => {
    const t = instantiateOfficial(def, stableIds());
    return renderFrameHtml(t.nodes, t.root, t.images, { kitId: t.kitId, settings: t.settings });
  }, [def]);
  const render = useMemo(
    () => () => getPageThumbnail(`official:${def.id}`, html, def.width, 900, def.kitId),
    [def, html],
  );
  return (
    <TemplateTile
      gref={{ source: 'official', templateId: def.id }}
      name={def.name}
      description={def.description}
      render={render}
    />
  );
}

function MineTile({ template }: { template: SavedTemplate }) {
  const [renaming, setRenaming] = useState(false);
  const render = useMemo(
    () => () => {
      const t = instantiateSaved(template, stableIds());
      return getPageThumbnail(
        `mine:${template.id}`,
        renderFrameHtml(t.nodes, t.root, t.images, { kitId: t.kitId, settings: t.settings }),
        template.width,
        900,
        t.kitId,
      );
    },
    [template],
  );
  const actions = (
    <div className="template__actions">
      {renaming ? (
        <input
          autoFocus
          defaultValue={template.name}
          aria-label="Template name"
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => {
            useTemplates.getState().rename(template.id, e.currentTarget.value);
            setRenaming(false);
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') setRenaming(false);
          }}
        />
      ) : (
        <>
          <button className="btn" onClick={() => setRenaming(true)}>
            Rename
          </button>
          <button
            className="btn btn--danger"
            onClick={() =>
              useStore.getState().requestConfirm({
                title: 'Delete this template?',
                body: `“${template.name}” will be deleted from your templates. This can’t be undone. Pages already made from it are not affected.`,
                confirmLabel: 'Delete template',
                danger: true,
                onConfirm: () => useTemplates.getState().remove(template.id),
              })
            }
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
  return (
    <TemplateTile
      gref={{ source: 'mine', templateId: template.id }}
      name={template.name}
      description={`${template.width}px · saved ${new Date(template.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`}
      thumbnail={template.thumbnail}
      render={render}
      actions={actions}
    />
  );
}

/** The Templates tab: the NSW page templates, and the user's own. */
export function Templates() {
  const [query, setQuery] = useState('');
  const mine = useTemplates((s) => s.templates);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (text: string) => terms.every((t) => text.toLowerCase().includes(t));

  // Templates follow the same kit as the library.
  const { kit } = useLibraryKit();
  const myMatches = mine.filter(
    (t) => (t.kitId ?? DEFAULT_KIT_ID) === kit.id && matches(`${t.name} my template`),
  );
  const groups = templateGroups(kit.id)
    .map((group) => ({
      group,
      items: OFFICIAL_TEMPLATES.filter(
        (t) =>
          t.kitId === kit.id &&
          t.group === group &&
          matches(`${t.name} ${t.description} ${t.group}`),
      ),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="templates" data-testid="templates">
      <div className="library__head">
        <input
          type="search"
          className="library__search"
          placeholder="Search templates"
          aria-label="Search templates"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <KitSwitcher />
        <p className="library__target">
          Click to add as a new page, or drag onto a page to replace its content.
        </p>
      </div>
      <div className="library__scroll">
        {myMatches.length > 0 && (
          <section className="library__group" aria-label="My templates">
            <h2 className="library__category">My templates</h2>
            {myMatches.map((t) => (
              <MineTile key={t.id} template={t} />
            ))}
          </section>
        )}
        {mine.length === 0 && query === '' && (
          <p className="library__none">
            Your own templates will appear here. Right-click a page and choose “Save as template…”.
          </p>
        )}
        {groups.map(({ group, items }) => (
          <section key={group} className="library__group" aria-label={group}>
            <h2 className="library__category">{group}</h2>
            {items.map((t) => (
              <OfficialTile key={t.id} id={t.id} />
            ))}
          </section>
        ))}
        {myMatches.length === 0 && groups.length === 0 && (
          <p className="library__none">
            Nothing matches “{query}”. Try “homepage”, “form” or “map”.
          </p>
        )}
      </div>
    </div>
  );
}
