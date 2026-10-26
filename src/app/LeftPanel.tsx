import { useStore } from '../store/store';
import { Comments } from './Comments';
import { Layers } from './Layers';
import { Overflow } from './Overflow';
import { Library } from './Library';
import { Templates } from './Templates';

const TABS = [
  ['library', 'Library'],
  ['templates', 'Templates'],
  ['layers', 'Layers'],
  ['comments', 'Comments'],
] as const;

/** Left side: the component library, with the layers tree in a tab beside it. */
export function LeftPanel() {
  const tab = useStore((s) => s.leftTab);
  const setTab = useStore((s) => s.setLeftTab);
  return (
    <div className="left">
      <Overflow
        className="tabs"
        activeKey={tab}
        items={TABS.map(([t, label]) => ({
          key: t,
          label,
          node: (
            <button
              role="tab"
              id={`tab-${t}`}
              aria-selected={tab === t}
              aria-controls={`panel-${t}`}
              className={`tabs__tab${tab === t ? ' is-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {label}
            </button>
          ),
        }))}
      />
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
      <div
        id="panel-comments"
        role="tabpanel"
        aria-labelledby="tab-comments"
        hidden={tab !== 'comments'}
        className="left__body"
      >
        <Comments />
      </div>
    </div>
  );
}
