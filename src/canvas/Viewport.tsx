import { useEffect, useRef } from 'react';
import { clampZoom, zoomAt } from '../lib/geometry';
import { useStore } from '../store/store';
import { Breadcrumb } from './Breadcrumb';
import { Frame } from './Frame';
import { ZoomControls } from './ZoomControls';
import { setCanvasHandlers, type ForwardedWheel } from './input';
import { isMultiTouch, touchDown, touchMove, touchUp } from './touch';
import { setCanvasPointer } from './pointer';

const LINE_HEIGHT = 16;

/** Dot spacing on screen: doubles while it would be tighter than 14px, so the grid never gets dense. */
function gridStep(zoom: number): number {
  let step = 24 * zoom;
  while (step < 14) step *= 2;
  return step;
}

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

  // Touch fingers that move or lift anywhere (they are captured by the canvas once down).
  useEffect(() => {
    const move = (e: PointerEvent) =>
      e.pointerType === 'touch' && touchMove(e.pointerId, e.clientX, e.clientY);
    const up = (e: PointerEvent) => e.pointerType === 'touch' && touchUp(e.pointerId);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Pressing the zoom controls (or any control drawn over the canvas) is not a click on the background.
    if ((e.target as HTMLElement).closest('.zoom-controls')) return;
    const s = useStore.getState();
    const touch = e.pointerType === 'touch';
    if (touch) touchDown(e.pointerId, e.clientX, e.clientY);
    // One finger on the empty canvas pans it, like the hand tool.
    const onBackground = (e.target as HTMLElement).closest('.frame') === null;
    const wantsPan = e.button === 1 || (e.button === 0 && (s.panning || (touch && onBackground)));
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
    let moved = false;
    const move = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 6) moved = true;
      if (isMultiTouch()) return; // two fingers pan and zoom together instead
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
      // A tap (not a drag) on the empty canvas with a finger clears the selection, as a click does.
      if (touch && !moved && onBackground) useStore.getState().selectFrame(null);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };

  return (
    <main
      ref={ref}
      id="canvas"
      tabIndex={-1}
      aria-label="Canvas"
      className={`viewport${panning ? ' viewport--panning' : ''}${dragging ? (droppable ? ' viewport--drop' : ' viewport--nodrop') : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={(e) => setCanvasPointer({ x: e.clientX, y: e.clientY })}
      onPointerLeave={() => setCanvasPointer(null)}
      onAuxClick={(e) => e.preventDefault()}
      data-testid="viewport"
      data-fitted={fitted}
      style={
        {
          backgroundPosition: `${view.x}px ${view.y}px`,
          backgroundSize: `${gridStep(view.zoom)}px ${gridStep(view.zoom)}px`,
          // Zoomed far out the dots would be a grey haze: thin them, then drop them.
          ['--grid-dots' as string]: view.zoom < 0.12 ? 0 : view.zoom < 0.25 ? 0.5 : 1,
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
          <h2>Start with a page</h2>
          <p>Add a page from the toolbar (a phone, tablet or desktop), then build inside it.</p>
        </div>
      )}
      <Breadcrumb />
      <ZoomControls />
      <div className="canvas-hint">
        <span className="canvas-hint__mouse">
          Space + drag to pan · Ctrl/⌘ + scroll to zoom · Drag a page name to move it
        </span>
        <span className="canvas-hint__touch">
          Drag to pan · Pinch to zoom · Press and hold an item for its menu
        </span>
      </div>
    </main>
  );
}
