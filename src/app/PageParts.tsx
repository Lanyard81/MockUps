import { useStore } from '../store/store';

/** One-click page furniture: masthead + header at the top, or a footer at the bottom. */
export function PageParts({ frameId }: { frameId?: string }) {
  const add = (part: 'top' | 'footer') =>
    frameId && useStore.getState().addPageParts(frameId, part);
  return (
    <div className="page-parts">
      <button
        className="btn"
        disabled={!frameId}
        onClick={() => add('top')}
        title="Adds the NSW masthead and header at the top of the frame"
      >
        Add masthead + header
      </button>
      <button
        className="btn"
        disabled={!frameId}
        onClick={() => add('footer')}
        title="Adds the NSW footer at the bottom of the frame"
      >
        Add footer
      </button>
    </div>
  );
}
