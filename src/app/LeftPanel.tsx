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
    <aside
      className="left"
      id="left-panel"
      tabIndex={-1}
      aria-label="Library, templates, layers and comments"
    >
      <Overflow
        className="tabs"
        role="tablist"
        onKeyDown={(e) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
          const tabs = Array.from(
            e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'),
          ).filter((el) => el.offsetParent !== null && !el.closest('.overflow__pop'));
          const i = tabs.indexOf(document.activeElement as HTMLElement);
          if (i < 0) return;
          e.preventDefault();
          const next =
            e.key === 'Home'
              ? 0
              : e.key === 'End'
                ? tabs.length - 1
                : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
          const target = tabs[next]!;
          target.focus();
          const id = target.id.replace('tab-', '') as (typeof TABS)[number][0];
          if (target.id.startsWith('tab-')) setTab(id);
        }}
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
              tabIndex={tab === t ? 0 : -1}
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
    </aside>
  );
}
