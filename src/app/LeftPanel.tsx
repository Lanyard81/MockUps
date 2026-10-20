import { useStore } from '../store/store';
import { Layers } from './Layers';
import { Library } from './Library';
import { Templates } from './Templates';

/** Left side: the component library, with the layers tree in a tab beside it. */
export function LeftPanel() {
  const tab = useStore((s) => s.leftTab);
  const setTab = useStore((s) => s.setLeftTab);
  return (
    <div className="left">
      <div className="tabs" role="tablist" aria-label="Left panel">
        {(['library', 'templates', 'layers'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            className={`tabs__tab${tab === t ? ' is-active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'library' ? 'Library' : t === 'templates' ? 'Templates' : 'Layers'}
          </button>
        ))}
      </div>
      {/* Both stay mounted so the library keeps its scroll position, search and thumbnails. */}
      <div
        id="panel-library"
        role="tabpanel"
        aria-labelledby="tab-library"
        hidden={tab !== 'library'}
        className="left__body"
      >
        <Library />
      </div>
      <div
        id="panel-templates"
        role="tabpanel"
        aria-labelledby="tab-templates"
        hidden={tab !== 'templates'}
        className="left__body"
      >
        <Templates />
      </div>
      <div
        id="panel-layers"
        role="tabpanel"
        aria-labelledby="tab-layers"
        hidden={tab !== 'layers'}
        className="left__body left__body--layers"
      >
        <Layers />
      </div>
    </div>
  );
}
