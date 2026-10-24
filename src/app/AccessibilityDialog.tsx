import { useMemo, useRef, useState } from 'react';
import { getKit } from '../kits';
import { nodeLabel } from '../layout/labels';
import { renderFrameHtml } from '../layout/render';
import { checkContrast, checkImages, checkStructure, type A11yIssue } from '../lib/a11y';
import { useStore } from '../store/store';
import { Modal } from './Modal';

/** Accessibility problems in one frame's page: headings, names, labels, picture descriptions, contrast. */
export function AccessibilityDialog() {
  const open = useStore((s) => s.dialog === 'accessibility');
  const frameId = useStore((s) => s.dialogFrameId);
  const frame = useStore((s) => s.doc.frames.find((f) => f.id === frameId));
  if (!open || !frame) return null;
  return <Inner frameId={frame.id} />;
}

function Inner({ frameId }: { frameId: string }) {
  const doc = useStore((s) => s.doc);
  const frame = doc.frames.find((f) => f.id === frameId)!;
  const kit = getKit(frame.kitId);
  const ref = useRef<HTMLIFrameElement>(null);
  const [found, setFound] = useState<{ html: string; list: A11yIssue[] } | null>(null);
  const close = () => useStore.getState().setDialog(null);
  const html = useMemo(
    () =>
      renderFrameHtml(doc.nodes, frame.root, doc.images, {
        kitId: frame.kitId,
        settings: frame.settings,
        kitSettings: doc.kitSettings[frame.kitId],
        width: frame.width,
      }),
    [doc, frame],
  );
  const issues = found && found.html === html ? found.list : null;
  const nodeIds = useMemo(() => {
    const out: string[] = [];
    const walk = (id: string) => {
      out.push(id);
      doc.nodes[id]?.children?.forEach(walk);
    };
    frame.root.forEach(walk);
    return out;
  }, [doc.nodes, frame.root]);

  const onLoad = () => {
    const iframe = ref.current;
    const idoc = iframe?.contentDocument;
    const root = idoc?.getElementById('root');
    if (!iframe || !idoc || !root) return;
    root.innerHTML = html;
    void idoc.fonts.ready.then(() =>
      requestAnimationFrame(() =>
        setFound({
          html,
          list: [
            ...checkStructure(root),
            ...checkImages(doc.nodes, nodeIds),
            ...checkContrast(root),
          ],
        }),
      ),
    );
  };

  const st = useStore.getState;
  const errors = issues?.filter((i) => i.severity === 'error').length ?? 0;
  return (
    <Modal title={`Accessibility: ${frame.name}`} width={640} onClose={close}>
      <p className="modal__text">
        Checks this page for the basics people using screen readers or low vision need. It can’t
        replace testing with real people.
      </p>
      <iframe
        ref={ref}
        title="Accessibility check"
        srcDoc={kit.shell.document}
        onLoad={onLoad}
        className="a11y__probe"
        style={{ width: frame.width }}
      />
      <div data-testid="a11y-results">
        {issues === null ? (
          <p className="prop-hint">Checking…</p>
        ) : issues.length === 0 ? (
          <p className="prop-hint responsive__ok">No problems found.</p>
        ) : (
          <>
            <p className="prop-hint">
              {issues.length} {issues.length === 1 ? 'thing' : 'things'} to look at
              {errors > 0 ? ` (${errors} to fix)` : ''}.
            </p>
            <ul className="a11y__list">
              {issues.map((issue, i) => (
                <li key={i} data-severity={issue.severity}>
                  <p className="responsive__issue">{issue.message}</p>
                  {issue.nodeId && doc.nodes[issue.nodeId] && (
                    <button
                      className="btn"
                      onClick={() => {
                        st().selectNode(frameId, issue.nodeId!);
                        close();
                      }}
                    >
                      {nodeLabel(doc.nodes[issue.nodeId], frame.kitId)}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Modal>
  );
}
