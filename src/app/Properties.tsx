import { nodeLabel } from '../layout/labels';
import { useStore } from '../store/store';
import { ComponentProps } from './properties/ComponentProps';
import { FrameProps } from './properties/FrameProps';
import { getKit } from '../kits';
import { KIT_PANELS } from './kitPanels';
import { NodeSettings } from './properties/NodeSettings';

/** Right-hand panel: options for whatever is selected. */
export function Properties() {
  const frameId = useStore((s) => s.selectedFrameId);
  const node = useStore((s) => (s.selectedNodeId ? s.doc.nodes[s.selectedNodeId] : undefined));
  const frameKit = useStore((s) => s.doc.frames.find((f) => f.id === s.selectedFrameId)?.kitId);

  let body: React.ReactNode;
  let title = 'Properties';
  if (!frameId) {
    body = (
      <div className="prop-empty">
        <p>
          <strong>Nothing selected</strong>
        </p>
        <p>Click a page name, or click something inside a page, to see its options here.</p>
      </div>
    );
  } else if (!node) {
    title = 'Page';
    body = <FrameProps frameId={frameId} />;
  } else {
    title = nodeLabel(node, frameKit);
    if (node.type === 'component') {
      body = <ComponentProps nodeId={node.id} frameId={frameId} />;
    } else {
      body = <LayoutNodeProps nodeId={node.id} frameId={frameId} />;
    }
  }

  return (
    <aside className="properties" id="properties-panel" tabIndex={-1} aria-label="Properties">
      <header className="properties__head">
        <h2 className="properties__title">{title}</h2>
      </header>
      <div className="properties__body" data-testid="properties-body">
        {body}
      </div>
    </aside>
  );
}

/** Options for a section, column or other layout node: the kit's settings, and its custom panel if it has one. */
function LayoutNodeProps({ nodeId, frameId }: { nodeId: string; frameId: string }) {
  const node = useStore((s) => s.doc.nodes[nodeId]);
  const kitId = useStore((s) => getKit(s.doc.frames.find((f) => f.id === frameId)?.kitId).id);
  if (!node || node.type === 'component') return null;
  const Panel = KIT_PANELS[kitId]?.node?.[node.type];
  return (
    <>
      <NodeSettings nodeId={nodeId} frameId={frameId} />
      {Panel && <Panel nodeId={nodeId} />}
    </>
  );
}
