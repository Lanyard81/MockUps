import { nodeLabel } from '../layout/labels';
import { useStore } from '../store/store';
import { ComponentProps } from './properties/ComponentProps';
import { FrameProps } from './properties/FrameProps';
import { useMemo } from 'react';
import { getKit } from '../kits';
import type { DocNode } from '../store/types';
import { KIT_PANELS } from './kitPanels';
import { SettingsPanel } from './properties/SettingsPanel';

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
        <p>Click a frame name, or click something inside a frame, to see its options here.</p>
      </div>
    );
  } else if (!node) {
    title = 'Frame';
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
    <aside className="properties" aria-label="Properties">
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
  const frame = useStore((s) => s.doc.frames.find((f) => f.id === frameId));
  const kitSettings = useStore((s) => s.doc.kitSettings[frame?.kitId ?? '']);
  const nodes = useStore((s) => s.doc.nodes);
  const topLevel = useMemo(
    () => (frame?.root ?? []).map((id) => nodes[id]).filter((n): n is DocNode => !!n),
    [frame?.root, nodes],
  );
  const kit = getKit(frame?.kitId);
  if (!node || node.type === 'component') return null;
  const context = { frame: frame?.settings ?? NO_VALUES, kit: kitSettings ?? NO_VALUES, topLevel };
  const defs = kit.settings.node[node.type] ?? NO_DEFS;
  const Panel = KIT_PANELS[kit.id]?.[node.type];
  return (
    <>
      {defs.length > 0 && (
        <SettingsPanel
          defs={defs}
          values={node.props ?? NO_VALUES}
          context={context}
          onChange={(key, value) => useStore.getState().setNodeProps(nodeId, { [key]: value })}
        />
      )}
      {Panel && <Panel nodeId={nodeId} />}
    </>
  );
}

/** Stable empty values: a selector or prop must not be a fresh object each render. */
const NO_DEFS: never[] = [];
const NO_VALUES: Record<string, unknown> = {};
