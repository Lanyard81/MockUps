import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getKit } from '../kits';
import { renderFrameHtml } from '../layout/render';
import { useStore } from '../store/store';
import { DEVICES } from '../store/types';

/**
 * Preview's click-through: a frame shown on its own, full height, where "go to frame" links open
 * the next frame. Back returns along the path taken. Nothing here is part of the document.
 */
export function PrototypeViewer() {
  const stack = useStore((s) => s.prototype);
  const frameId = stack ? stack[stack.length - 1] : undefined;
  const frame = useStore((s) => s.doc.frames.find((f) => f.id === frameId));
  if (!stack || !frame) return null;
  return <Viewer key={frame.id} frameId={frame.id} depth={stack.length} />;
}

function Viewer({ frameId, depth }: { frameId: string; depth: number }) {
  const frame = useStore((s) => s.doc.frames.find((f) => f.id === frameId))!;
  const nodes = useStore((s) => s.doc.nodes);
  const images = useStore((s) => s.doc.images);
  const kitSettings = useStore((s) => s.doc.kitSettings[frame.kitId]);
  const frameHeight = useStore((s) => s.frameHeights[frame.id]);
  const motion = useStore((s) => s.prototypeMotion);
  const html = useMemo(
    () =>
      renderFrameHtml(nodes, frame.root, images, {
        kitId: frame.kitId,
        settings: frame.settings,
        kitSettings,
        layout: frame.layout,
        width: frame.width,
        boardHeight: frameHeight,
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
      frameHeight,
    ],
  );
  const kit = getKit(frame.kitId);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        useStore.getState().closePrototype();
      }
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, []);

  const onLoad = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const root = doc?.getElementById('root');
    if (!iframe || !doc || !root) return;
    root.innerHTML = html;
    try {
      if (iframe.contentWindow) kit.shell.init(iframe.contentWindow);
    } catch (err) {
      console.error('NSW.initSite failed', err);
    }
    doc.addEventListener(
      'click',
      (e) => {
        const target = (e.target as Element | null)?.closest?.('[data-goto]');
        if (target) {
          e.preventDefault();
          useStore
            .getState()
            .prototypeGo(target.getAttribute('data-goto')!, target.getAttribute('data-transition'));
          return;
        }
        const a = (e.target as Element | null)?.closest?.('a[href]');
        if (a && !a.getAttribute('href')?.startsWith('#')) e.preventDefault();
      },
      true,
    );
    doc.addEventListener('submit', (e) => e.preventDefault(), true);
  }, [html, kit]);

  // Fit the window. A wide page fills its width (and scrolls down); a phone-sized one fills the height
  // as a phone would. Large screens scale up, to at most 2.5×.
  const stageH = Math.max(200, size.h - 52);
  const wide = frame.width >= 700;
  const screenH = DEVICES[frame.device].screenHeight;
  const scale = Math.min(
    2.5,
    wide ? size.w / frame.width : Math.min(size.w / frame.width, stageH / screenH),
  );

  return (
    <div
      className="prototype"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${frame.name}`}
    >
      <div className="prototype__bar">
        <button
          className="btn"
          disabled={depth < 2}
          onClick={() => useStore.getState().prototypeBack()}
        >
          ← Back
        </button>
        <span className="prototype__title">{frame.name}</span>
        <button className="btn" onClick={() => useStore.getState().closePrototype()}>
          Close
        </button>
      </div>
      <div
        className={`prototype__stage prototype__stage--${motion}`}
        style={{ height: stageH }}
        data-motion={motion}
      >
        <div className="prototype__page" style={{ width: frame.width * scale, height: stageH }}>
          <iframe
            ref={iframeRef}
            title={`Preview of ${frame.name}`}
            srcDoc={kit.shell.document}
            onLoad={onLoad}
            style={{
              width: frame.width,
              height: stageH / scale,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          />
        </div>
      </div>
    </div>
  );
}
