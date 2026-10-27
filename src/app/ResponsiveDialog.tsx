import { useMemo, useRef, useState } from 'react';
import { getKit } from '../kits';
import { nodeLabel } from '../layout/labels';
import { renderFrameHtml } from '../layout/render';
import {
  RESPONSIVE_SIZES,
  findIssues,
  smallTargets,
  type Box,
  type ResponsiveIssue,
} from '../lib/responsive';
import { useStore } from '../store/store';
import { Modal } from './Modal';

/** One frame's page at phone, tablet and desktop widths side by side, with layout problems listed. */
export function ResponsiveDialog() {
  const open = useStore((s) => s.dialog === 'responsive');
  const frameId = useStore((s) => s.dialogFrameId);
  const frame = useStore((s) => s.doc.frames.find((f) => f.id === frameId));
  if (!open || !frame) return null;
  return <Inner frameId={frame.id} />;
}

function Inner({ frameId }: { frameId: string }) {
  const frame = useStore((s) => s.doc.frames.find((f) => f.id === frameId))!;
  const doc = useStore((s) => s.doc);
  const free = frame.layout === 'free';
  const close = () => useStore.getState().setDialog(null);
  return (
    <Modal title={`Responsive view: ${frame.name}`} width={1180} onClose={close}>
      {free ? (
        <p className="modal__text" data-testid="responsive-free">
          A free-layout page has a fixed width, so it doesn’t reflow. Switch it to Stacked to see
          how the page adapts to a phone, a tablet and a desktop.
        </p>
      ) : (
        <>
          <p className="modal__text">
            The same page at three widths, drawn the way each device would. Problems found are
            listed under each; click one to select it in the editor.
          </p>
          <div className="responsive" data-testid="responsive">
            {RESPONSIVE_SIZES.map((size) => (
              <Pane key={size.id} frameId={frameId} size={size} doc={doc} onPick={close} />
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}

type Doc = ReturnType<typeof useStore.getState>['doc'];

function Pane({
  frameId,
  size,
  doc,
  onPick,
}: {
  frameId: string;
  size: (typeof RESPONSIVE_SIZES)[number];
  doc: Doc;
  onPick: () => void;
}) {
  const frame = doc.frames.find((f) => f.id === frameId)!;
  const kit = getKit(frame.kitId);
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(900);
  const [issues, setIssues] = useState<ResponsiveIssue[] | null>(null);
  const html = useMemo(
    () =>
      renderFrameHtml(doc.nodes, frame.root, doc.images, {
        kitId: frame.kitId,
        settings: frame.settings,
        kitSettings: doc.kitSettings[frame.kitId],
        width: size.width,
      }),
    [doc, frame, size.width],
  );

  const onLoad = () => {
    const iframe = ref.current;
    const idoc = iframe?.contentDocument;
    const root = idoc?.getElementById('root');
    if (!iframe || !idoc || !root) return;
    root.innerHTML = html;
    try {
      if (iframe.contentWindow) kit.shell.init(iframe.contentWindow);
    } catch {
      /* the page still draws without its scripts */
    }
    // Wait for fonts and layout, then measure.
    void idoc.fonts.ready.then(() =>
      requestAnimationFrame(() => {
        // Name the component (not the section or column around it) that a measurement belongs to.
        const nodeOf = (el: Element) => {
          const id = el.closest('[data-node]')?.getAttribute('data-node') ?? null;
          return id && doc.nodes[id]?.type === 'component' ? id : null;
        };
        const box = (el: Element): Box => {
          const r = el.getBoundingClientRect();
          // An element's contents can stick out past its own box (a long word in a narrow column).
          const reach = r.left + Math.max(r.width, (el as HTMLElement).scrollWidth || 0);
          return { nodeId: nodeOf(el), right: reach, width: r.width, height: r.height };
        };
        const all = [...root.querySelectorAll('[data-node] *')].map(box);
        const targets = [...root.querySelectorAll('a[href], button, input, select')].map(box);
        const scrollWidth = Math.max(idoc.documentElement.scrollWidth, idoc.body.scrollWidth);
        setIssues([
          ...findIssues(size.width, scrollWidth, all),
          ...smallTargets(size.width, targets),
        ]);
        setHeight(Math.min(2400, Math.max(300, Math.ceil(root.offsetHeight))));
      }),
    );
  };

  const k = size.shown / size.width;
  const st = useStore.getState;
  return (
    <section className="responsive__pane" aria-label={`${size.label} (${size.width}px)`}>
      <h3 className="responsive__title">
        {size.label} <span>{size.width}px</span>
      </h3>
      <div
        className="responsive__view"
        style={{ width: size.shown, height: Math.min(520, height * k) }}
      >
        <iframe
          ref={ref}
          title={`${size.label} view`}
          srcDoc={kit.shell.document}
          onLoad={onLoad}
          style={{
            width: size.width,
            height,
            transform: `scale(${k})`,
            transformOrigin: 'top left',
          }}
        />
      </div>
      <div className="responsive__issues" data-testid={`issues-${size.id}`}>
        {issues === null ? (
          <p className="prop-hint">Checking…</p>
        ) : issues.length === 0 ? (
          <p className="prop-hint responsive__ok">
            {frame.root.length === 0 ? 'There is nothing to check yet.' : 'No problems found.'}
          </p>
        ) : (
          <ul>
            {issues.map((issue) => (
              <li key={issue.kind}>
                <p className="responsive__issue">{issue.text}</p>
                {issue.nodeIds.map((id) => (
                  <button
                    key={id}
                    className="btn"
                    onClick={() => {
                      st().selectNode(frameId, id);
                      onPick();
                    }}
                  >
                    {nodeLabel(doc.nodes[id], frame.kitId)}
                  </button>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
