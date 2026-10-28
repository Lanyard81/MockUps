import { useStore } from '../store/store';
import { zoomStep } from './shortcuts';
import { Icon } from '../app/Icon';

const PRESETS = [10, 25, 50, 75, 100, 150, 200, 300, 400];

/** Zoom out, level, zoom in and fit: a small cluster in the corner of the canvas, as in most design tools. */
export function ZoomControls() {
  const zoom = useStore((s) => s.doc.view.zoom);
  const pct = Math.round(zoom * 100);
  const options = PRESETS.includes(pct) ? PRESETS : [...PRESETS, pct].sort((a, b) => a - b);
  const st = useStore.getState;
  return (
    <div className="zoom-controls" role="group" aria-label="Zoom">
      <button
        className="btn btn--icon"
        aria-label="Zoom out"
        title="Zoom out (Ctrl/⌘ −)"
        onClick={() => st().setView(zoomStep(st().doc.view, 0.8, st().viewport))}
      >
        <Icon name="minus" />
      </button>
      <select
        aria-label="Zoom level"
        value={pct}
        onChange={(e) => {
          const s = st();
          const centre = { x: s.viewport.width / 2, y: s.viewport.height / 2 };
          const v = s.doc.view;
          const next = Number(e.target.value) / 100;
          const wx = (centre.x - v.x) / v.zoom;
          const wy = (centre.y - v.y) / v.zoom;
          s.setView({ zoom: next, x: centre.x - wx * next, y: centre.y - wy * next });
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
        title="Zoom in (Ctrl/⌘ +)"
        onClick={() => st().setView(zoomStep(st().doc.view, 1.25, st().viewport))}
      >
        <Icon name="plus" />
      </button>
      <button
        className="btn"
        title="Fit everything in view (Ctrl/⌘ 0)"
        onClick={() => st().zoomToFit()}
      >
        Zoom to fit
      </button>
    </div>
  );
}
