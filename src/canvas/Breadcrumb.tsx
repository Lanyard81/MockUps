import { pathTo } from '../layout/ops';
import { nodeLabel } from '../layout/labels';
import { useStore } from '../store/store';

/** Frame › Section › Grid › Column › Component. Click a crumb to select that level. */
export function Breadcrumb() {
  const frame = useStore((s) => s.doc.frames.find((f) => f.id === s.selectedFrameId));
  const doc = useStore((s) => s.doc);
  const nodeId = useStore((s) => s.selectedNodeId);
  const select = useStore((s) => s.selectNode);
  const selectFrame = useStore((s) => s.selectFrame);
  const showStructure = useStore((s) => s.showStructure);
  if (!frame) return null;
  // Containers, grids and columns are layout plumbing: hidden here unless "Show layout details" is on (or selected).
  const path = (nodeId && doc.nodes[nodeId] ? pathTo(doc, nodeId) : []).filter(
    (id) =>
      showStructure ||
      id === nodeId ||
      !['container', 'grid', 'column'].includes(doc.nodes[id]?.type ?? ''),
  );

  return (
    <nav className="breadcrumb" aria-label="Selection" onPointerDown={(e) => e.stopPropagation()}>
      <button
        className={`breadcrumb__crumb${path.length === 0 ? ' is-current' : ''}`}
        onClick={() => selectFrame(frame.id)}
      >
        {frame.name}
      </button>
      {path.map((id, i) => (
        <span key={id} className="breadcrumb__part">
          <span className="breadcrumb__sep" aria-hidden="true">
            ›
          </span>
          <button
            className={`breadcrumb__crumb${i === path.length - 1 ? ' is-current' : ''}`}
            aria-current={i === path.length - 1 ? 'true' : undefined}
            onClick={() => select(frame.id, id)}
          >
            {nodeLabel(doc.nodes[id])}
          </button>
        </span>
      ))}
    </nav>
  );
}
