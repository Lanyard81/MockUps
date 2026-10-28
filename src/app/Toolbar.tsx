import { useState } from 'react';
import { useStore } from '../store/store';
import { DEVICES } from '../store/types';
import { copySelectionHtml } from '../export/copy';
import { KITS, getKit } from '../kits';
import { FRAME_SIZES } from '../lib/frameSizes';
import { loadSample, pickMockupFile, saveToFile, startNewMockup } from '../persistence/file';
import { DocName } from './DocName';
import { applyTheme, readTheme, type Theme } from './theme';
import { copyPageSpecInstructions } from '../export/pageSpec';
import { Menu } from './Menu';
import { Overflow, type OverflowItem } from './Overflow';

export function Toolbar() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const hasSelection = useStore((s) => s.selectedNodeId !== null);
  const newFrameKit = useStore((s) => s.newFrameKitId);
  const newFrameLayout = useStore((s) => s.newFrameLayout);
  const handTool = useStore((s) => s.handTool);
  const commentTool = useStore((s) => s.commentTool);
  const s = useStore;

  const items: OverflowItem[] = [
    {
      key: 'add',
      priority: 11,
      label: 'Add page',
      node: (
        <Menu
          icon="+"
          label="Add page"
          header={
            <>
              <div
                className="segmented segmented--block"
                role="group"
                aria-label="Layout for the new page"
              >
                {(['flow', 'free'] as const).map((l) => (
                  <button
                    key={l}
                    className={l === newFrameLayout ? 'is-active' : ''}
                    aria-pressed={l === newFrameLayout}
                    title={
                      l === 'flow'
                        ? 'Stacked: sections, grids and columns, like a real web page'
                        : 'Free: drag components anywhere, with no grid'
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      s.getState().setNewFrameLayout(l);
                    }}
                  >
                    {l === 'flow' ? 'Stacked' : 'Free'}
                  </button>
                ))}
              </div>
              {KITS.length > 1 ? (
                <div
                  className="segmented segmented--block"
                  role="group"
                  aria-label="Style kit for the new page"
                >
                  {KITS.map((k) => (
                    <button
                      key={k.id}
                      className={k.id === newFrameKit ? 'is-active' : ''}
                      aria-pressed={k.id === newFrameKit}
                      title={k.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        s.getState().setNewFrameKit(k.id);
                      }}
                    >
                      {k.shortLabel}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          }
          items={[
            ...getKit(newFrameKit).devices.map((d) => ({
              label: DEVICES[d].label,
              hint: d === 'custom' ? 'any width' : `${DEVICES[d].width}px`,
              onSelect: () => s.getState().addFrame(d, newFrameKit, newFrameLayout),
            })),
            ...FRAME_SIZES.map((z, i) => ({
              label: z.label,
              hint: z.hint,
              separatorBefore: i === 0,
              onSelect: () => s.getState().addFrame('custom', newFrameKit, newFrameLayout, z),
            })),
          ]}
        />
      ),
    },
    {
      key: 'undo',
      priority: 6,
      label: 'Undo',
      node: (
        <button
          className="btn"
          disabled={!canUndo}
          onClick={() => s.getState().undo()}
          title="Undo (Ctrl/⌘ Z)"
        >
          Undo
        </button>
      ),
    },
    {
      key: 'redo',
      priority: 5,
      label: 'Redo',
      node: (
        <button
          className="btn"
          disabled={!canRedo}
          onClick={() => s.getState().redo()}
          title="Redo (Ctrl/⌘ Shift Z)"
        >
          Redo
        </button>
      ),
    },
    {
      key: 'comment',
      priority: 4,
      label: 'Comment',
      node: (
        <button
          className={`btn${commentTool ? ' btn--primary' : ''}`}
          aria-pressed={commentTool}
          title="Comment: click a spot on a page to pin a note (Esc cancels)"
          onClick={() => {
            s.getState().setCommentTool(!commentTool);
            if (!commentTool) s.getState().setMode('edit');
          }}
        >
          Comment
        </button>
      ),
    },
    {
      key: 'mode',
      priority: 10,
      label: 'Edit / Preview',
      node: (
        <div className="segmented" role="group" aria-label="Mode">
          <button
            className={mode === 'edit' ? 'is-active' : ''}
            aria-pressed={mode === 'edit'}
            onClick={() => setMode('edit')}
            title="Edit: clicks select things"
          >
            Edit
          </button>
          <button
            className={mode === 'preview' ? 'is-active' : ''}
            aria-pressed={mode === 'preview'}
            onClick={() => setMode('preview')}
            title="Preview: components behave live"
          >
            Preview
          </button>
        </div>
      ),
    },
    {
      key: 'hand',
      priority: 3,
      label: 'Hand',
      node: (
        <button
          className={`btn${handTool ? ' btn--primary' : ''}`}
          aria-label="Pan (hand tool)"
          aria-pressed={handTool}
          title="Hand tool (H): drag to pan the canvas"
          onClick={() => s.getState().setHandTool(!handTool)}
        >
          Pan
        </button>
      ),
    },
    {
      key: 'play',
      priority: 9,
      label: 'Present',
      node: (
        <button
          className="btn"
          title="Present full screen, starting from the start page, and follow prototype links"
          disabled={!s.getState().doc.frames.length}
          onClick={() => s.getState().playPrototype()}
        >
          ▶ Present
        </button>
      ),
    },
    {
      key: 'share',
      priority: 9,
      label: 'Share and export',
      node: (
        <button
          className="btn"
          aria-label="Share and export"
          title="Export an image, PDF or web page, or make a shareable viewer file"
          onClick={() => s.getState().setDialog('export')}
        >
          Share
        </button>
      ),
    },
    {
      key: 'settings',
      priority: 7,
      label: 'Settings',
      node: (
        <Menu
          plain
          label="Settings"
          header={
            <>
              <div className="menu__setting">
                <span id="set-layout">New pages start as</span>
                <div className="segmented" role="group" aria-labelledby="set-layout">
                  {(['flow', 'free'] as const).map((l) => (
                    <button
                      key={l}
                      className={l === newFrameLayout ? 'is-active' : ''}
                      aria-pressed={l === newFrameLayout}
                      title={
                        l === 'flow'
                          ? 'Stacked: sections, grids and columns, like a real web page'
                          : 'Free: drag components anywhere, with no grid'
                      }
                      onClick={() => s.getState().setNewFrameLayout(l)}
                    >
                      {l === 'flow' ? 'Stacked' : 'Free'}
                    </button>
                  ))}
                </div>
              </div>
              <ThemeChoice />
              <StructureChoice />
            </>
          }
          items={[]}
        />
      ),
    },
    {
      key: 'help',
      priority: 4,
      label: 'Help',
      node: (
        <Menu
          plain
          label="Help"
          items={[
            { label: 'Replay the tour', onSelect: () => s.getState().requestTour() },
            {
              label: 'Keyboard shortcuts',
              hint: '?',
              onSelect: () => s.getState().setHelpOpen(true),
            },
            { label: 'Try a sample', onSelect: () => s.getState().setDialog('samples') },
          ]}
        />
      ),
    },
  ];

  return (
    <header className="toolbar">
      <div className="toolbar__group">
        <h1 className="toolbar__title">PageWright</h1>
        <DocName />
        <button
          className="btn"
          title="Search everything (Ctrl/⌘ K)"
          onClick={() => s.getState().setPaletteOpen(true)}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="toolbar__search-label">Search</span>
        </button>
        <Menu
          plain
          label="File"
          items={[
            { label: 'New mockup', onSelect: startNewMockup },
            { label: 'My mockups…', onSelect: () => s.getState().setDialog('mockups') },
            {
              label: 'Version history…',
              hint: 'save and restore',
              onSelect: () => s.getState().setDialog('history'),
            },
            ...KITS.flatMap((k) => k.samples).map((d, i) => ({
              label: `Sample: ${d.name}`,
              separatorBefore: i === 0,
              onSelect: () => loadSample(d.id),
            })),
            { label: 'Open file…', separatorBefore: true, onSelect: pickMockupFile },
            { label: 'Save to file', hint: '.mockup.json', onSelect: saveToFile },
            {
              label: 'Import a page description…',
              hint: '.page.json',
              separatorBefore: true,
              onSelect: () => s.getState().setDialog('importSpec'),
            },
            ...KITS.map((k) => ({
              label: `Copy AI instructions (${k.shortLabel})`,
              hint: 'to describe a screenshot as a page',
              onSelect: () => void copyPageSpecInstructions(k.id),
            })),
            {
              label: 'Export…',
              hint: 'PNG, PDF, HTML',
              separatorBefore: true,
              onSelect: () => s.getState().setDialog('export'),
            },
            {
              label: 'Copy HTML of selection',
              disabled: !hasSelection,
              onSelect: () => void copySelectionHtml(),
            },
          ]}
        />
      </div>

      <Overflow className="toolbar__overflow" items={items} />
    </header>
  );
}

/** Dark (the default) or light editor theme. Only the editor changes; mockups are drawn by their kit. */
function ThemeChoice() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  return (
    <div className="menu__setting">
      <span id="set-theme">Editor theme</span>
      <div className="segmented" role="group" aria-labelledby="set-theme">
        {(['dark', 'light'] as const).map((t) => (
          <button
            key={t}
            className={t === theme ? 'is-active' : ''}
            aria-pressed={t === theme}
            onClick={() => {
              applyTheme(t);
              setTheme(t);
            }}
          >
            {t === 'dark' ? 'Dark' : 'Light'}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Advanced: show containers and grids when stepping through a page's structure. */
function StructureChoice() {
  const on = useStore((s) => s.showStructure);
  return (
    <div className="menu__setting">
      <label className="menu__check">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => useStore.getState().setShowStructure(e.target.checked)}
        />
        <span>Show layout details (containers, grids and columns)</span>
      </label>
    </div>
  );
}
