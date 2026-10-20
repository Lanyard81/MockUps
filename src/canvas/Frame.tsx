import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { renderFrameHtml } from '../layout/render';
import { useStore } from '../store/store';
import { DEVICES, type Frame as FrameModel } from '../store/types';
import { FRAME_SHELL } from './nswAssets';
import { attachFrameInput } from './input';

interface Props {
  frame: FrameModel;
  zoom: number;
}

type FrameWindow = Window & { NSW?: { initSite: () => void } };

/** One device frame: a label above an iframe that renders real NSW markup. */
export const Frame = memo(function Frame({ frame, zoom }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const renameRequest = useStore((s) => s.renameRequest);
  const html = useStore((s) => renderFrameHtml(s.doc.nodes, frame.root));
  const height = useStore((s) => s.frameHeights[frame.id] ?? DEVICES[frame.device].screenHeight);
  const selected = useStore((s) => s.selectedFrameId === frame.id);
  const interactive = useStore((s) => !s.panning);
  const mode = useStore((s) => s.mode);
  const store = useStore;
  const screenHeight = DEVICES[frame.device].screenHeight;

  const onLoad = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    attachFrameInput(doc, iframeRef.current, frame.id);
    setReady(true);
  }, [frame.id]);

  // Render content, re-run the NSW initialisers, then measure.
  useEffect(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const root = doc?.getElementById('root');
    if (!ready || !iframe || !doc || !root) return;
    doc.body.dataset.mode = mode;
    root.innerHTML = html;
    try {
      (iframe.contentWindow as FrameWindow).NSW?.initSite();
    } catch (err) {
      console.error('NSW.initSite failed', err);
    }
    const measure = () =>
      store.getState().setFrameHeight(frame.id, Math.max(screenHeight, root.offsetHeight));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [ready, html, mode, frame.id, frame.width, screenHeight, store]);

  useEffect(() => {
    if (renameRequest === frame.id) {
      setRenaming(true);
      useStore.getState().requestRename(null);
    }
  }, [renameRequest, frame.id]);

  const finishRename = (value: string) => {
    store.getState().renameFrame(frame.id, value);
    setRenaming(false);
  };

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const s = store.getState();
    s.selectFrame(frame.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const origin = { x: frame.x, y: frame.y };
    let started = false;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      if (!started) {
        if (Math.hypot(dx, dy) * zoom < 3) return;
        started = true;
        store.getState().beginGesture(); // one drag = one undo entry
      }
      store.getState().moveFrameLive(frame.id, origin.x + dx, origin.y + dy);
    };
    const up = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  };

  return (
    <div
      className={`frame${selected ? ' frame--selected' : ''}`}
      style={{ left: frame.x, top: frame.y, width: frame.width }}
      data-frame-id={frame.id}
      data-testid={`frame-${frame.name}`}
    >
      <div
        className="frame__label"
        onPointerDown={renaming ? undefined : startDrag}
        onDoubleClick={() => setRenaming(true)}
      >
        {renaming ? (
          <input
            className="frame__rename"
            autoFocus
            defaultValue={frame.name}
            aria-label="Frame name"
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => finishRename(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') setRenaming(false);
              e.stopPropagation();
            }}
          />
        ) : (
          <span className="frame__name" title="Drag to move. Double-click to rename.">
            {frame.name}
          </span>
        )}
        <span className="frame__size">{frame.width}px</span>
      </div>
      <div className="frame__body" style={{ height }}>
        <iframe
          ref={iframeRef}
          className="frame__iframe"
          title={frame.name}
          srcDoc={FRAME_SHELL}
          onLoad={onLoad}
          style={{ pointerEvents: interactive ? 'auto' : 'none' }}
          data-mode={mode}
        />
        {height > screenHeight && (
          <div className="frame__fold" style={{ top: screenHeight }}>
            <span>Fold · {screenHeight}px</span>
          </div>
        )}
        {frame.root.length === 0 && ready && (
          <div className="frame__empty">
            <strong>This frame is empty</strong>
            <span>Click a component in the library to add it here.</span>
          </div>
        )}
      </div>
    </div>
  );
});
