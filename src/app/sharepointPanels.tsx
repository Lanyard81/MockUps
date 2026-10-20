import { useRef } from 'react';
import { MAX_FOOTER_LINKS, MAX_NAV_DEPTH, readSite, type NavItem } from '../kits/sharepoint/site';
import { useStore } from '../store/store';
import { setFrameImageFromFile } from './imageUpload';
import { ImageField } from './properties/ImageField';
import { CommitInput, Field, Section } from './properties/controls';

/**
 * Properties panels for the SharePoint kit that its settings data can't express: menu and footer
 * link lists, and picture uploads for the header, logos and title area.
 */

/** One picture setting on a frame: upload, replace, or go back to SharePoint's plain default. */
function FrameImage({
  frameId,
  settingKey,
  label,
}: {
  frameId: string;
  settingKey: string;
  label: string;
}) {
  const id = useStore((s) => {
    const v = s.doc.frames.find((f) => f.id === frameId)?.settings?.[settingKey];
    return typeof v === 'string' ? v : undefined;
  });
  const stored = useStore((s) => (id ? s.doc.images[id] : undefined));
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="image-field">
      <div className="prop-field__label">{label}</div>
      <div className="image-field__drop">
        {stored ? <img src={stored.dataUrl} alt="" /> : <span>Default picture</span>}
      </div>
      <div className="image-field__actions">
        <button className="btn" onClick={() => input.current?.click()}>
          {stored ? 'Replace image…' : 'Upload image…'}
        </button>
        {stored && (
          <button
            className="btn"
            onClick={() =>
              useStore.getState().setFrameSettings(frameId, { [settingKey]: undefined })
            }
          >
            Remove
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          aria-label={`Upload ${label.toLowerCase()}`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void setFrameImageFromFile(frameId, settingKey, file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

/** Replace the item at `path` (a list of indexes, `children` between levels) using `fn`. */
function editList(
  items: NavItem[],
  path: number[],
  fn: (list: NavItem[], index: number) => NavItem[],
): NavItem[] {
  const next = structuredClone(items);
  let list = next;
  for (const i of path.slice(0, -1)) {
    const item = list[i];
    if (!item) return items;
    item.children ??= [];
    list = item.children;
  }
  const result = fn(list, path[path.length - 1]!);
  // Put the changed list back in place.
  if (path.length === 1) return result;
  let parentList = next;
  for (const i of path.slice(0, -2)) parentList = parentList[i]!.children!;
  const parent = parentList[path[path.length - 2]!]!;
  parent.children = result.length ? result : undefined;
  return next;
}

function NavRows({
  frameId,
  items,
  all,
  path,
}: {
  frameId: string;
  items: NavItem[];
  all: NavItem[];
  path: number[];
}) {
  const depth = path.length + 1;
  const save = (next: NavItem[]) =>
    useStore.getState().setFrameSettings(frameId, { navItems: next });
  return (
    <ul className="list-editor__list">
      {items.map((item, i) => {
        const here = [...path, i];
        return (
          <li key={i} className="list-editor__row" style={{ marginLeft: path.length * 12 }}>
            <div className="list-editor__line">
              <CommitInput
                label={`Menu item ${here.map((n) => n + 1).join('.')}`}
                value={item.label}
                onCommit={(v) =>
                  save(
                    editList(all, here, (list, idx) =>
                      list.map((x, j) => (j === idx ? { ...x, label: v } : x)),
                    ),
                  )
                }
              />
              <button
                className="btn btn--icon"
                aria-label={`Move ${item.label} up`}
                disabled={i === 0}
                onClick={() =>
                  save(
                    editList(all, here, (list, idx) => {
                      const c = [...list];
                      [c[idx - 1], c[idx]] = [c[idx]!, c[idx - 1]!];
                      return c;
                    }),
                  )
                }
              >
                ↑
              </button>
              <button
                className="btn btn--icon"
                aria-label={`Move ${item.label} down`}
                disabled={i === items.length - 1}
                onClick={() =>
                  save(
                    editList(all, here, (list, idx) => {
                      const c = [...list];
                      [c[idx + 1], c[idx]] = [c[idx]!, c[idx + 1]!];
                      return c;
                    }),
                  )
                }
              >
                ↓
              </button>
              <button
                className="btn btn--icon"
                aria-label={`Add a link under ${item.label}`}
                title={
                  depth >= MAX_NAV_DEPTH
                    ? 'Menus can have three levels'
                    : 'Add a link under this one'
                }
                disabled={depth >= MAX_NAV_DEPTH}
                onClick={() =>
                  save(
                    editList(all, here, (list, idx) =>
                      list.map((x, j) =>
                        j === idx
                          ? { ...x, children: [...(x.children ?? []), { label: 'New link' }] }
                          : x,
                      ),
                    ),
                  )
                }
              >
                +
              </button>
              <button
                className="btn btn--icon"
                aria-label={`Remove ${item.label}`}
                onClick={() =>
                  save(editList(all, here, (list, idx) => list.filter((_, j) => j !== idx)))
                }
              >
                ×
              </button>
            </div>
            {item.children?.length ? (
              <NavRows frameId={frameId} items={item.children} all={all} path={here} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function NavEditor({ frameId }: { frameId: string }) {
  const settings = useStore((s) => s.doc.frames.find((f) => f.id === frameId)?.settings);
  const items = readSite(settings).nav.items;
  return (
    <Section
      title="Menu links"
      hint="Up to three levels. You can also double-click a menu label on the canvas."
    >
      <NavRows frameId={frameId} items={items} all={items} path={[]} />
      <button
        className="btn"
        onClick={() =>
          useStore
            .getState()
            .setFrameSettings(frameId, { navItems: [...items, { label: 'New link' }] })
        }
      >
        Add a link
      </button>
    </Section>
  );
}

function FooterLinks({ frameId }: { frameId: string }) {
  const settings = useStore((s) => s.doc.frames.find((f) => f.id === frameId)?.settings);
  const site = readSite(settings);
  if (!site.footer.visible) return null;
  const links = site.footer.links;
  const save = (next: string[]) =>
    useStore.getState().setFrameSettings(frameId, { footerLinks: next });
  return (
    <Section title="Footer links" hint={`Up to ${MAX_FOOTER_LINKS}, one level.`}>
      <ul className="list-editor__list">
        {links.map((l, i) => (
          <li key={i} className="list-editor__row">
            <div className="list-editor__line">
              <CommitInput
                label={`Footer link ${i + 1}`}
                value={l}
                onCommit={(v) => save(links.map((x, j) => (j === i ? v : x)))}
              />
              <button
                className="btn btn--icon"
                aria-label={`Remove ${l}`}
                onClick={() => save(links.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button
        className="btn"
        disabled={links.length >= MAX_FOOTER_LINKS}
        onClick={() => save([...links, 'New link'])}
      >
        Add a link
      </button>
    </Section>
  );
}

/** Frame-level extras for a SharePoint frame: pictures, the menu and footer links. */
export function SpFramePanel({ frameId }: { frameId: string }) {
  const settings = useStore((s) => s.doc.frames.find((f) => f.id === frameId)?.settings);
  const site = readSite(settings);
  return (
    <>
      <Section title="Header pictures">
        {site.header.background === 'image' && (
          <FrameImage frameId={frameId} settingKey="headerImage" label="Header background image" />
        )}
        <FrameImage frameId={frameId} settingKey="logoThumbnail" label="Logo thumbnail (square)" />
        <FrameImage frameId={frameId} settingKey="siteLogo" label="Site logo (64×64 to 192×64)" />
      </Section>
      {site.nav.visible && <NavEditor frameId={frameId} />}
      {site.footer.visible && (
        <Section title="Footer logo">
          <FrameImage frameId={frameId} settingKey="footerLogo" label="Footer logo" />
        </Section>
      )}
      <FooterLinks frameId={frameId} />
      {site.titleArea.visible &&
        site.titleArea.layout !== 'plain' &&
        site.titleArea.layout !== 'colour-block' && (
          <Section title="Title picture">
            <FrameImage frameId={frameId} settingKey="titleImage" label="Page title image" />
          </Section>
        )}
    </>
  );
}

/** Extras for a SharePoint section: the background picture. */
export function SpSectionPanel({ nodeId }: { nodeId: string }) {
  const image = useStore((s) => s.doc.nodes[nodeId]?.props?.background === 'image');
  if (!image) return null;
  return (
    <Section
      title="Background image"
      hint="A dark overlay is added automatically so text stays readable."
    >
      <ImageField nodeId={nodeId} imageKey="background" label="Section background" />
    </Section>
  );
}

export { Field };
