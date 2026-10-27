import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collectFitTargets } from '../layout/fit';
import { renderFrameHtml } from '../layout/render';
import { applyTextFit } from '../lib/textFit';
import { useStore } from '../store/store';
import { DEVICES, type Frame as FrameModel } from '../store/types';
import { getKit } from '../kits';
import { CommentPins } from './CommentPins';
import { FrameOverlay } from './FrameOverlay';
import { attachFrameInput } from './input';
import { ReferenceLayer } from './ReferenceLayer';
import { registerFrameElement } from './registry';

interface Props {
  frame: FrameModel;
  zoom: number;
}

/** One device frame: a label above an iframe that renders real NSW markup. */
export const Frame = memo(function Frame({ frame, zoom }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const renameRequest = useStore((s) => s.renameRequest);
  // Sanitising is the costly part of rendering, so only redo it when the document nodes change,
  // not on every store update (hover, selection and drag state change constantly).
  const nodes = useStore((s) => s.doc.nodes);
  const images = useStore((s) => s.doc.images);
  const fitTargets = useMemo(() => collectFitTargets(nodes, frame.root), [nodes, frame.root]);
  const kitSettings = useStore((s) => s.doc.kitSettings[frame.kitId]);
  const html = useMemo(
    () =>
      renderFrameHtml(nodes, frame.root, images, {
        kitId: frame.kitId,
        settings: frame.settings,
        kitSettings,
        layout: frame.layout,
        width: frame.width,
      }),
    [
      nodes,
      frame.root,
      images,
      frame.kitId,
      frame.settings,
      kitSettings,
      frame.layout,
      frame.width,
    ],
  );
  const height = useStore((s) => s.frameHeights[frame.id] ?? DEVICES[frame.device].screenHeight);
  const selected = useStore((s) => s.selectedFrameId === frame.id);
  const interactive = useStore((s) => !s.panning && s.drag === null);
  const mode = useStore((s) => s.mode);
  const store = useStore;
  const kit = getKit(frame.kitId);
  const startFrame = useStore(
    (s) => (s.doc.startFrameId ?? s.doc.frames[0]?.id) === frame.id && s.doc.frames.length > 1,
  );
  const screenHeight = DEVICES[frame.device].screenHeight;

  useEffect(() => {
    registerFrameElement(frame.id, iframeRef.current);
    return () => registerFrameElement(frame.id, null);
  }, [frame.id]);

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
      if (iframe.contentWindow) kit.shell.init(iframe.contentWindow);
    } catch (err) {
      console.error('NSW.initSite failed', err);
    }
    // "Shrink to fit" is redone after every render, and again once fonts have loaded.
    const fit = () => store.getState().setFitWarnings(frame.id, applyTextFit(doc, fitTargets));
    fit();
    void doc.fonts.ready.then(fit);
    // A freeform board is as tall as its lowest item plus room to grow into.
    const board = root.querySelector<HTMLElement>('[data-free-board]');
    const sizeBoard = () => {
      if (!board) return;
      let bottom = 0;
      board.querySelectorAll<HTMLElement>('[data-free]').forEach((el) => {
        bottom = Math.max(bottom, el.offsetTop + el.offsetHeight);
      });
      board.style.height = `${Math.max(screenHeight, bottom + 240)}px`;
    };
    const measure = () => {
      sizeBoard();
      store.getState().setFrameHeight(frame.id, Math.max(screenHeight, root.offsetHeight));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    board?.querySelectorAll('[data-free]').forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [ready, html, mode, fitTargets, frame.id, frame.width, screenHeight, store, kit]);

  // While placing a comment the pointer is a crosshair, inside the frame too.
  const commentTool = useStore((s) => s.commentTool);
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!ready || !doc) return;
    doc.documentElement.style.cursor = commentTool ? 'crosshair' : '';
  }, [ready, commentTool]);

  // A reference "behind" the content needs the page itself see-through (editor affordance only).
  const showRef = mode === 'edit' && !!frame.reference?.visible;
  const behind = showRef && frame.reference?.placement === 'behind';
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!ready || !doc) return;
    doc.getElementById('ref-behind')?.remove();
    if (!behind) return;
    const style = doc.createElement('style');
    style.id = 'ref-behind';
    style.textContent = 'html,body,#root{background:transparent !important}';
    doc.head.appendChild(style);
    return () => style.remove();
  }, [ready, behind]);

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
        onContextMenu={(e) => {
          e.preventDefault();
          store.getState().selectFrame(frame.id);
          store
            .getState()
            .openContextMenu({ x: e.clientX, y: e.clientY, frameId: frame.id, nodeId: null });
        }}
      >
        {renaming ? (
          <input
            className="frame__rename"
            autoFocus
            defaultValue={frame.name}
            aria-label="Page name"
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
        <span className="frame__kit" title={kit.name} data-testid="frame-kit">
          {kit.shortLabel}
        </span>
        {startFrame && (
          <span
            className="frame__kit"
            title="Presenting starts on this page"
            data-testid="frame-start"
          >
            ▶ Start
          </span>
        )}
        {frame.layout === 'free' && (
          <span
            className="frame__kit"
            title="Free layout: components placed anywhere"
            data-testid="frame-free"
          >
            Freeform
          </span>
        )}
        <span className="frame__size">{frame.width}px</span>
      </div>
      <div className="frame__body" style={{ height }}>
        {showRef && behind && <ReferenceLayer frame={frame} />}
        <iframe
          ref={iframeRef}
          className="frame__iframe"
          title={frame.name}
          srcDoc={kit.shell.document}
          onLoad={onLoad}
          style={{
            pointerEvents: interactive ? 'auto' : 'none',
            ...(behind ? { background: 'transparent', position: 'relative', zIndex: 1 } : {}),
          }}
          data-mode={mode}
        />
        {showRef && !behind && <ReferenceLayer frame={frame} />}
        {mode === 'edit' && <CommentPins frameId={frame.id} />}
        <FrameOverlay
          frameId={frame.id}
          layoutKey={`${html.length}:${height}:${frame.width}:${ready}`}
        />
        {height > screenHeight && (
          <div className="frame__fold" style={{ top: screenHeight }}>
            <span>Fold · {screenHeight}px</span>
          </div>
        )}
        {frame.root.length === 0 && ready && (
          <div className="frame__empty">
            <strong>This page is empty</strong>
            <span>Drag a component here from the library, or start from a template.</span>
            <span className="frame__empty-actions">
              <button className="btn" onClick={() => useStore.getState().setLeftTab('templates')}>
                Browse templates
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
