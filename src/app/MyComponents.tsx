import { beginPendingDrag, consumeDragClick } from '../canvas/drag';
import { getKit } from '../kits';
import type { KitId } from '../kits/types';
import { useSavedComponents } from '../store/savedComponents';
import { useStore } from '../store/store';

/** The user's saved components for the library's kit: click to add, or drag onto a frame. */
export function MyComponents({ kitId, frameId }: { kitId: KitId; frameId?: string }) {
  const all = useSavedComponents((s) => s.components);
  const mine = all.filter((c) => getKit(c.kitId).id === getKit(kitId).id);
  if (mine.length === 0) return null;
  return (
    <section className="library__group" aria-label="My components" data-testid="my-components">
      <h2 className="library__category">My components</h2>
      <ul className="mine">
        {mine.map((c) => (
          <li key={c.id} className="mine__row">
            <button
              className="mine__main"
              disabled={!frameId}
              title={`Add “${c.name}”. Drag it onto a page to place it.`}
              onPointerDown={(e) =>
                beginPendingDrag(e, { kind: 'saved', savedId: c.id, label: c.name })
              }
              onClick={() => {
                if (consumeDragClick()) return;
                if (frameId) useStore.getState().insertSaved(frameId, c.id);
              }}
            >
              <span className="mine__name">{c.name}</span>
              <span className="mine__kind">
                {c.nodes[c.rootId]?.type === 'section' ? 'Section' : 'Component'}
              </span>
            </button>
            <button
              className="btn btn--icon mine__delete"
              aria-label={`Delete “${c.name}”`}
              title="Delete this saved component"
              onClick={() =>
                useStore.getState().requestConfirm({
                  title: 'Delete saved component?',
                  body: `“${c.name}” will be removed from My components. Pages that already use it are not changed.`,
                  confirmLabel: 'Delete',
                  danger: true,
                  onConfirm: () => useSavedComponents.getState().remove(c.id),
                })
              }
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
