import { zoomStep } from '../canvas/shortcuts';
import { useStore } from '../store/store';
import { DEVICES } from '../store/types';
import { copySelectionHtml } from '../export/copy';
import { KITS, getKit } from '../kits';
import { loadSample, pickMockupFile, saveToFile } from '../persistence/file';
import { DocName } from './DocName';
import { copyPageSpecInstructions } from '../export/pageSpec';
import { Menu } from './Menu';

const ZOOM_PRESETS = [10, 25, 50, 75, 100, 150, 200, 300, 400];

export function Toolbar() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const zoom = useStore((s) => s.doc.view.zoom);
  const hasSelection = useStore((s) => s.selectedNodeId !== null);
  const newFrameKit = useStore((s) => s.newFrameKitId);
  const newFrameLayout = useStore((s) => s.newFrameLayout);
  const s = useStore;
  const pct = Math.round(zoom * 100);
  const options = ZOOM_PRESETS.includes(pct)
    ? ZOOM_PRESETS
    : [...ZOOM_PRESETS, pct].sort((a, b) => a - b);

  return (
    <header className="toolbar">
      <div className="toolbar__group">
        <strong className="toolbar__title">NSW Mockup Builder</strong>
        <DocName />
        <Menu
          plain
          label="File"
          items={[
            { label: 'New mockup', onSelect: () => s.getState().newDoc() },
            { label: 'My mockups…', onSelect: () => s.getState().setDialog('mockups') },
            ...KITS.flatMap((k) => k.samples).map((d, i) => ({
              label: `Sample: ${d.name}`,
              separatorBefore: i === 0,
              onSelect: () => loadSample(d.id),
            })),
            { label: 'Open file…', separatorBefore: true, onSelect: pickMockupFile },
            { label: 'Save to file', hint: '.mockup.json', onSelect: saveToFile },
            {
              label: 'Import page spec…',
              hint: '.page.json',
              separatorBefore: true,
              onSelect: () => s.getState().setDialog('importSpec'),
            },
            ...KITS.map((k) => ({
              label: `Copy page spec instructions (${k.shortLabel})`,
              hint: 'for a Claude chat',
              onSelect: () => void copyPageSpecInstructions(k.id),
            })),
            {
              label: 'Export…',
              hint: 'PNG, HTML',
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

      <div className="toolbar__group">
        <Menu
          icon="+"
          label="Add frame"
          header={
            <>
              <div
                className="segmented segmented--block"
                role="group"
                aria-label="Layout for the new frame"
              >
                {(['flow', 'free'] as const).map((l) => (
                  <button
                    key={l}
                    className={l === newFrameLayout ? 'is-active' : ''}
                    aria-pressed={l === newFrameLayout}
                    title={
                      l === 'flow'
                        ? 'Sections, grids and columns, like a real page'
                        : 'Drag components anywhere, with no grid'
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      s.getState().setNewFrameLayout(l);
                    }}
                  >
                    {l === 'flow' ? 'Flow' : 'Freeform'}
                  </button>
                ))}
              </div>
              {KITS.length > 1 ? (
                <div
                  className="segmented segmented--block"
                  role="group"
                  aria-label="Style kit for the new frame"
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
          items={getKit(newFrameKit).devices.map((d) => ({
            label: DEVICES[d].label,
            hint: d === 'custom' ? 'any width' : `${DEVICES[d].width}px`,
            onSelect: () => s.getState().addFrame(d, newFrameKit, newFrameLayout),
          }))}
        />
        <button
          className="btn"
          disabled={!canUndo}
          onClick={() => s.getState().undo()}
          title="Undo (Ctrl/⌘ Z)"
        >
          Undo
        </button>
        <button
          className="btn"
          disabled={!canRedo}
          onClick={() => s.getState().redo()}
          title="Redo (Ctrl/⌘ Shift Z)"
        >
          Redo
        </button>
      </div>

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

      <div className="toolbar__group zoom">
        <button
          className="btn btn--icon"
          aria-label="Zoom out"
          onClick={() =>
            s.getState().setView(zoomStep(s.getState().doc.view, 0.8, s.getState().viewport))
          }
        >
          −
        </button>
        <select
          aria-label="Zoom level"
          value={pct}
          onChange={(e) => {
            const st = s.getState();
            const centre = { x: st.viewport.width / 2, y: st.viewport.height / 2 };
            const v = st.doc.view;
            const next = Number(e.target.value) / 100;
            const wx = (centre.x - v.x) / v.zoom;
            const wy = (centre.y - v.y) / v.zoom;
            st.setView({ zoom: next, x: centre.x - wx * next, y: centre.y - wy * next });
          }}
        >
          {options.map((p) => (
            <option key={p} value={p}>
              {p}%
            </option>
          ))}
        </select>
        <button
          className="btn btn--icon"
          aria-label="Zoom in"
          onClick={() =>
            s.getState().setView(zoomStep(s.getState().doc.view, 1.25, s.getState().viewport))
          }
        >
          +
        </button>
        <button className="btn" onClick={() => s.getState().zoomToFit()}>
          Zoom to fit
        </button>
        <button
          className="btn btn--icon"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
          onClick={() => s.getState().setHelpOpen(true)}
        >
          ?
        </button>
      </div>
    </header>
  );
}
