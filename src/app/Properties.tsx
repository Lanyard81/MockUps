import { nodeLabel } from '../layout/labels';
import { useStore } from '../store/store';
import { ComponentProps } from './properties/ComponentProps';
import { FrameProps } from './properties/FrameProps';
import { ColumnProps, ContainerProps, GridProps, SectionProps } from './properties/LayoutProps';

/** Right-hand panel: options for whatever is selected. */
export function Properties() {
  const frameId = useStore((s) => s.selectedFrameId);
  const node = useStore((s) => (s.selectedNodeId ? s.doc.nodes[s.selectedNodeId] : undefined));

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
    title = nodeLabel(node);
    switch (node.type) {
      case 'section':
        body = <SectionProps nodeId={node.id} />;
        break;
      case 'container':
        body = <ContainerProps nodeId={node.id} />;
        break;
      case 'grid':
        body = <GridProps nodeId={node.id} />;
        break;
      case 'column':
        body = <ColumnProps nodeId={node.id} />;
        break;
      case 'component':
        body = <ComponentProps nodeId={node.id} frameId={frameId} />;
        break;
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
