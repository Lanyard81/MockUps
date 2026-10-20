import { getKit } from '../kits';
import type { KitId } from '../kits/types';
import { useStore } from '../store/store';

/** One-click page furniture from the kit (NSW: masthead + header at the top, or a footer at the bottom). */
export function PageParts({ frameId, kitId }: { frameId?: string; kitId: KitId }) {
  return (
    <div className="page-parts">
      {getKit(kitId).pageParts.map((part) => (
        <button
          key={part.id}
          className="btn"
          disabled={!frameId}
          onClick={() => frameId && useStore.getState().addPageParts(frameId, part.id)}
          title={part.title}
        >
          {part.label}
        </button>
      ))}
    </div>
  );
}
