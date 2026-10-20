import { useEffect, useRef } from 'react';
import { clampZoom, zoomAt } from '../lib/geometry';
import { useStore } from '../store/store';
import { Breadcrumb } from './Breadcrumb';
import { Frame } from './Frame';
import { setCanvasHandlers, type ForwardedWheel } from './input';

const LINE_HEIGHT = 16;

/** The infinite canvas: pan, zoom and the frames laid out in world coordinates. */
export function Viewport() {
  const ref = useRef<HTMLDivElement>(null);
  const view = useStore((s) => s.doc.view);
  const frames = useStore((s) => s.doc.frames);
  const panning = useStore((s) => s.panning);
  const fitted = useStore((s) => s.fitted);
  const dragging = useStore((s) => s.drag !== null);
  const droppable = useStore((s) => s.dropTarget !== null || s.templateDrop !== null);

  // Track the viewport size so "Zoom to fit" knows how much room there is.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      useStore.getState().setViewport(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);
    useStore.getState().setViewport(el.clientWidth, el.clientHeight);
    return () => ro.disconnect();
  }, []);

  // Wheel and middle-mouse input, from the canvas itself and forwarded from inside frames.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (e: ForwardedWheel) => {
      const { doc, setView } = useStore.getState();
      const scale = e.deltaMode === 1 ? LINE_HEIGHT : 1;
      const dx = e.deltaX * scale;
      const dy = e.deltaY * scale;
      const rect = el.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        const step = Math.max(-50, Math.min(50, dy));
        const next = clampZoom(doc.view.zoom * Math.exp(-step * 0.01));
        setView(zoomAt(doc.view, next, e.clientX - rect.left, e.clientY - rect.top));
      } else {
        setView({ ...doc.view, x: doc.view.x - dx, y: doc.view.y - dy });
      }
    };

    const nativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      onWheel(e);
    };
    el.addEventListener('wheel', nativeWheel, { passive: false });
    setCanvasHandlers({ wheel: onWheel, middleDown: () => useStore.getState().setPanning(true) });
    return () => {
      el.removeEventListener('wheel', nativeWheel);
      setCanvasHandlers(null);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = useStore.getState();
    const wantsPan = e.button === 1 || (e.button === 0 && s.panning);
    if (!wantsPan) {
      if (e.button === 0 && (e.target as HTMLElement).closest('.frame') === null)
        s.selectFrame(null);
      return;
    }
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY, view: s.doc.view };
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    let raf = 0;
    const move = (ev: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        useStore.getState().setView({
          ...start.view,
          x: start.view.x + ev.clientX - start.x,
          y: start.view.y + ev.clientY - start.y,
        }),
      );
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      // A middle-mouse pan ends with the button; a space pan ends when space is released.
      if (e.button === 1) useStore.getState().setPanning(false);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };

  return (
    <div
      ref={ref}
      className={`viewport${panning ? ' viewport--panning' : ''}${dragging ? (droppable ? ' viewport--drop' : ' viewport--nodrop') : ''}`}
      onPointerDown={onPointerDown}
      onAuxClick={(e) => e.preventDefault()}
      data-testid="viewport"
      data-fitted={fitted}
      style={
        {
          backgroundPosition: `${view.x}px ${view.y}px`,
          backgroundSize: `${24 * view.zoom}px ${24 * view.zoom}px`,
        } as React.CSSProperties
      }
    >
      <div
        className="world"
        data-testid="world"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
          ['--inv-zoom' as string]: 1 / view.zoom,
        }}
      >
        {frames.map((f) => (
          <Frame key={f.id} frame={f} zoom={view.zoom} />
        ))}
      </div>
      {frames.length === 0 && (
        <div className="canvas-empty">
          <h2>Start with a frame</h2>
          <p>
            A frame is a device screen. Add one from the toolbar, then build your page inside it.
          </p>
        </div>
      )}
      <Breadcrumb />
      <div className="canvas-hint">
        Space + drag to pan · Ctrl/⌘ + scroll to zoom · Drag a frame name to move it
      </div>
    </div>
  );
}
