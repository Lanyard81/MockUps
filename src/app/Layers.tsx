import { useEffect, useMemo, useRef, useState } from 'react';
import { describeVariant } from '../layout/component';
import { getComponent, getVariant } from '../catalogue';
import { defaultNodeLabel, nodeLabel } from '../layout/labels';
import { placementForFrame, placementForRow, zoneForPointer, type RowZone } from '../layout/layers';
import { isDraggable, pathTo } from '../layout/ops';
import { useStore } from '../store/store';
import type { DocNode, Frame } from '../store/types';

/** One-line preview of a component's text, so layers are recognisable. */
function snippet(node: DocNode): string {
  if (node.type !== 'component' || !node.componentId) return '';
  const own = Object.values(node.text ?? {}).find((t) => t.trim());
  if (own) return own.trim();
  const comp = getComponent(node.componentId);
  const variant = comp ? getVariant(comp.id, node.variant) : undefined;
  return variant ? (describeVariant(variant.html).editable[0]?.default ?? '') : '';
}

const TYPE_ICON: Record<DocNode['type'], string> = {
  section: '▭',
  container: '▯',
  grid: '▦',
  column: '▥',
  component: '◆',
};

interface DropState {
  /** Row the pointer is over (a node id, or `frame:<id>` for a frame row). */
  rowKey: string;
  zone: RowZone;
  valid: boolean;
}

export function Layers() {
  const doc = useStore((s) => s.doc);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const selectedFrameId = useStore((s) => s.selectedFrameId);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [renaming, setRenaming] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<DropState | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  // One row is in the Tab order (the one last focused, else the selection, else the first page).
  const tabKey =
    focusKey ??
    (selectedNodeId ? selectedNodeId : selectedFrameId ? `frame:${selectedFrameId}` : null) ??
    (doc.frames[0] ? `frame:${doc.frames[0].id}` : null);

  // The path to the selection is always open, so the selected layer can always be seen.
  const forcedOpen = useMemo(
    () =>
      new Set(
        selectedNodeId && doc.nodes[selectedNodeId] ? pathTo(doc, selectedNodeId).slice(0, -1) : [],
      ),
    [doc, selectedNodeId],
  );

  useEffect(() => {
    treeRef.current?.querySelector('.layer-row.is-selected')?.scrollIntoView({ block: 'nearest' });
  }, [selectedNodeId, selectedFrameId]);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /** Press and move on a row to pick the layer up; drop on another row to move it. */
  const startDrag = (e: React.PointerEvent, nodeId: string) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button, input')) return;
    const node = useStore.getState().doc.nodes[nodeId];
    if (!node || !isDraggable(node)) return;
    const origin = { x: e.clientX, y: e.clientY };
    let started = false;

    const rowAt = (x: number, y: number) =>
      (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>(
        '[data-layer-key]',
      ) ?? null;
    const compute = (ev: PointerEvent): DropState | null => {
      const row = rowAt(ev.clientX, ev.clientY);
      if (!row) return null;
      const key = row.dataset.layerKey!;
      const d = useStore.getState().doc;
      if (key.startsWith('frame:')) {
        return { rowKey: key, zone: 'inside', valid: !!placementForFrame(d, nodeId, key.slice(6)) };
      }
      const rect = row.getBoundingClientRect();
      const zone = zoneForPointer(ev.clientY, rect.top, rect.height);
      const fraction = (ev.clientY - rect.top) / rect.height;
      return { rowKey: key, zone, valid: !!placementForRow(d, nodeId, key, zone, fraction) };
    };

    const move = (ev: PointerEvent) => {
      if (!started) {
        if (Math.hypot(ev.clientX - origin.x, ev.clientY - origin.y) < 4) return;
        started = true;
        setDragId(nodeId);
        document.body.classList.add('is-dragging');
      }
      setDrop(compute(ev));
    };
    const end = (commit: boolean, ev?: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', key, true);
      document.body.classList.remove('is-dragging');
      setDragId(null);
      setDrop(null);
      if (!started || !commit || !ev) return;
      const state = compute(ev);
      const d = useStore.getState().doc;
      if (!state?.valid) return;
      const row = rowAt(ev.clientX, ev.clientY)!;
      const target = state.rowKey.startsWith('frame:')
        ? placementForFrame(d, nodeId, state.rowKey.slice(6))
        : placementForRow(
            d,
            nodeId,
            state.rowKey,
            state.zone,
            (ev.clientY - row.getBoundingClientRect().top) / row.getBoundingClientRect().height,
          );
      if (target) useStore.getState().moveNode(nodeId, target);
    };
    const up = (ev: PointerEvent) => end(true, ev);
    const cancel = () => end(false);
    const key = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.stopPropagation();
        end(false);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key, true);
  };

  const ownerOf = (id: string) => doc.frames.find((f) => f.root.includes(pathTo(doc, id)[0] ?? ''));
  const selectRow = (id: string) => {
    const frameId = useStore.getState().selectedFrameId;
    useStore.getState().selectNode(ownerOf(id)?.id ?? frameId ?? doc.frames[0]!.id, id);
  };

  /** Keyboard for a Layers row: arrows move and open or close, Enter selects, F2 renames, Delete deletes, Alt+arrows reorder. */
  const rowKeyDown = (e: React.KeyboardEvent<HTMLElement>, key: string) => {
    if (e.target !== e.currentTarget) return;
    const row = e.currentTarget;
    const isFrame = key.startsWith('frame:');
    const rows = Array.from(
      treeRef.current?.querySelectorAll<HTMLElement>('[role="treeitem"]') ?? [],
    );
    const i = rows.indexOf(row);
    const focusRow = (el: HTMLElement | undefined) => {
      if (!el) return;
      setFocusKey(el.dataset.layerKey ?? null);
      el.focus();
    };
    const expanded = row.getAttribute('aria-expanded');
    const st = useStore.getState();
    const handled = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && !isFrame) {
      handled();
      selectRow(key);
      st.moveSelected(e.key === 'ArrowUp' ? -1 : 1);
      return;
    }
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    switch (e.key) {
      case 'ArrowDown':
        handled();
        focusRow(rows[i + 1]);
        break;
      case 'ArrowUp':
        handled();
        focusRow(rows[i - 1]);
        break;
      case 'Home':
        handled();
        focusRow(rows[0]);
        break;
      case 'End':
        handled();
        focusRow(rows[rows.length - 1]);
        break;
      case 'ArrowRight':
        handled();
        if (expanded === 'false') toggle(key);
        else if (expanded === 'true') focusRow(rows[i + 1]);
        break;
      case 'ArrowLeft':
        handled();
        if (expanded === 'true' && !forcedOpen.has(key.replace('frame:', ''))) toggle(key);
        else
          focusRow(
            row.parentElement?.parentElement?.previousElementSibling as HTMLElement | undefined,
          );
        break;
      case 'Enter':
      case ' ':
        handled();
        if (isFrame) st.selectFrame(key.slice(6));
        else selectRow(key);
        break;
      case 'F2':
        handled();
        setRenaming(key);
        break;
      case 'Delete':
      case 'Backspace':
        handled();
        if (isFrame) st.deleteFrame(key.slice(6));
        else st.deleteNode(key);
        focusRow(rows[Math.max(0, i - 1)]);
        break;
      case 'ContextMenu': {
        handled();
        const r = row.getBoundingClientRect();
        if (isFrame) {
          st.selectFrame(key.slice(6));
          st.openContextMenu({ x: r.left + 24, y: r.bottom, frameId: key.slice(6), nodeId: null });
        } else {
          const owner = ownerOf(key);
          if (!owner) break;
          st.selectNode(owner.id, key);
          st.openContextMenu({ x: r.left + 24, y: r.bottom, frameId: owner.id, nodeId: key });
        }
        break;
      }
    }
  };

  const dropClass = (rowKey: string) => {
    if (!drop || drop.rowKey !== rowKey) return '';
    return drop.valid ? ` is-drop-${drop.zone}` : ' is-drop-invalid';
  };

  const renderNode = (id: string, depth: number): React.ReactNode => {
    const node = doc.nodes[id];
    if (!node) return null;
    const kids = node.children ?? [];
    const open = kids.length > 0 && (!collapsed.has(id) || forcedOpen.has(id));
    const label = nodeLabel(node);
    const text = node.name ? '' : snippet(node);
    const selected = selectedNodeId === id;
    return (
      <div key={id} role="none">
        <div
          role="treeitem"
          aria-level={depth + 1}
          aria-selected={selected}
          aria-expanded={kids.length ? open : undefined}
          data-layer-key={id}
          tabIndex={tabKey === id ? 0 : -1}
          onKeyDown={(e) => rowKeyDown(e, id)}
          onFocus={(e) => e.target === e.currentTarget && setFocusKey(id)}
          data-testid={`layer-${node.type}`}
          className={`layer-row${selected ? ' is-selected' : ''}${node.hidden ? ' is-hidden' : ''}${dragId === id ? ' is-dragging' : ''}${dropClass(id)}`}
          style={{ paddingLeft: 6 + depth * 14 }}
          onPointerDown={(e) => startDrag(e, id)}
          onClick={() => selectRow(id)}
          onContextMenu={(e) => {
            e.preventDefault();
            const owner = doc.frames.find((f) => f.root.includes(pathTo(doc, id)[0]!));
            if (!owner) return;
            useStore.getState().selectNode(owner.id, id);
            useStore
              .getState()
              .openContextMenu({ x: e.clientX, y: e.clientY, frameId: owner.id, nodeId: id });
          }}
        >
          {kids.length > 0 ? (
            <button
              className="layer-row__twisty"
              aria-label={open ? 'Collapse' : 'Expand'}
              onClick={(e) => {
                e.stopPropagation();
                toggle(id);
              }}
            >
              {open ? '▾' : '▸'}
            </button>
          ) : (
            <span className="layer-row__twisty" aria-hidden="true" />
          )}
          <span className="layer-row__icon" aria-hidden="true">
            {TYPE_ICON[node.type]}
          </span>
          {renaming === id ? (
            <input
              className="layer-row__rename"
              autoFocus
              defaultValue={label}
              aria-label="Layer name"
              onFocus={(e) => e.currentTarget.select()}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => {
                useStore
                  .getState()
                  .setNodeName(
                    id,
                    e.currentTarget.value === defaultNodeLabel(node) ? '' : e.currentTarget.value,
                  );
                setRenaming(null);
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') setRenaming(null);
              }}
            />
          ) : (
            <span
              className="layer-row__name"
              onDoubleClick={() => setRenaming(id)}
              title="Double-click to rename"
            >
              {label}
              {text && <span className="layer-row__text"> {text}</span>}
            </span>
          )}
          <button
            className="layer-row__eye"
            aria-label={node.hidden ? `Show ${label}` : `Hide ${label}`}
            aria-pressed={node.hidden === true}
            title={node.hidden ? 'Show' : 'Hide'}
            onClick={(e) => {
              e.stopPropagation();
              useStore.getState().setHidden(id, !node.hidden);
            }}
          >
            {node.hidden ? '◌' : '●'}
          </button>
        </div>
        {open && <div role="group">{kids.map((k) => renderNode(k, depth + 1))}</div>}
      </div>
    );
  };

  const renderFrame = (frame: Frame) => {
    const key = `frame:${frame.id}`;
    const selected = selectedFrameId === frame.id && !selectedNodeId;
    const isCollapsed = collapsed.has(key) && !forcedOpenFrame(frame);
    return (
      <div key={frame.id} role="none" className="layer-frame">
        <div
          role="treeitem"
          aria-level={1}
          aria-selected={selected}
          aria-expanded={frame.root.length ? !isCollapsed : undefined}
          data-layer-key={key}
          tabIndex={tabKey === key ? 0 : -1}
          onKeyDown={(e) => rowKeyDown(e, key)}
          onFocus={(e) => e.target === e.currentTarget && setFocusKey(key)}
          data-testid="layer-frame"
          className={`layer-row layer-row--frame${selected ? ' is-selected' : ''}${dropClass(key)}`}
          onClick={() => useStore.getState().selectFrame(frame.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            useStore.getState().selectFrame(frame.id);
            useStore
              .getState()
              .openContextMenu({ x: e.clientX, y: e.clientY, frameId: frame.id, nodeId: null });
          }}
        >
          {frame.root.length > 0 ? (
            <button
              className="layer-row__twisty"
              aria-label={isCollapsed ? 'Expand page' : 'Collapse page'}
              onClick={(e) => {
                e.stopPropagation();
                toggle(key);
              }}
            >
              {isCollapsed ? '▸' : '▾'}
            </button>
          ) : (
            <span className="layer-row__twisty" aria-hidden="true" />
          )}
          {renaming === key ? (
            <input
              className="layer-row__rename"
              autoFocus
              defaultValue={frame.name}
              aria-label="Page name"
              onFocus={(e) => e.currentTarget.select()}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => {
                useStore.getState().renameFrame(frame.id, e.currentTarget.value);
                setRenaming(null);
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') setRenaming(null);
              }}
            />
          ) : (
            <span
              className="layer-row__name"
              onDoubleClick={() => setRenaming(key)}
              title="Double-click to rename"
            >
              {frame.name}
              <span className="layer-row__text"> {frame.width}px</span>
            </span>
          )}
        </div>
        {!isCollapsed && frame.root.length > 0 && (
          <div role="group">{frame.root.map((id) => renderNode(id, 1))}</div>
        )}
        {frame.root.length === 0 && <p className="layer-empty">Empty page</p>}
      </div>
    );
  };

  function forcedOpenFrame(frame: Frame) {
    return !!selectedNodeId && frame.root.includes(pathTo(doc, selectedNodeId)[0] ?? '');
  }

  return (
    <div className="layers" ref={treeRef} role="tree" aria-label="Layers" data-testid="layers">
      {doc.frames.length === 0 ? (
        <p className="layer-empty">No pages yet. Add one from the toolbar.</p>
      ) : (
        doc.frames.map(renderFrame)
      )}
    </div>
  );
}
