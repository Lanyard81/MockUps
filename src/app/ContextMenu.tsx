import { useEffect, useRef } from 'react';
import { startFirstTextEdit, startTextEdit } from '../canvas/textEdit';
import { copyFrameSpec, downloadFrameSpec } from '../export/pageSpec';
import { copyBuildNotes, downloadBuildNotes } from '../export/buildNotes';
import { copySelectionHtml } from '../export/copy';
import { getKit } from '../kits';
import { conversionTargets } from '../layout/convert';
import { getComponent } from '../catalogue';
import { isFreeFrame } from '../layout/free';
import { parentOf } from '../layout/ops';
import { useStore } from '../store/store';
import { ALT, MOD, SHIFT } from './platform';

interface Item {
  label: string;
  shortcut?: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
  separatorBefore?: boolean;
}

const WIDTH = 232;
const ROW = 30;

/** The right-click menu for canvas items, layers and frames. */
export function ContextMenu() {
  const menu = useStore((s) => s.contextMenu);
  const doc = useStore((s) => s.doc);
  const clipboard = useStore((s) => s.clipboard);
  const ref = useRef<HTMLDivElement>(null);

  // Close on anything that would make the menu stale.
  useEffect(() => {
    if (!menu) return;
    const close = () => useStore.getState().openContextMenu(null);
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener('pointerdown', away, true);
    window.addEventListener('keydown', esc, true);
    window.addEventListener('blur', close);
    window.addEventListener('resize', close);
    window.addEventListener('wheel', close, { passive: true });
    ref.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    return () => {
      window.removeEventListener('pointerdown', away, true);
      window.removeEventListener('keydown', esc, true);
      window.removeEventListener('blur', close);
      window.removeEventListener('resize', close);
      window.removeEventListener('wheel', close);
    };
  }, [menu]);

  if (!menu) return null;
  const st = useStore.getState;
  const { frameId, nodeId } = menu;
  const node = nodeId ? doc.nodes[nodeId] : undefined;
  if (nodeId && !node) return null;

  let items: Item[];
  if (node && nodeId) {
    const loc = parentOf(doc, nodeId);
    const parent = loc?.parentId ? doc.nodes[loc.parentId] : null;
    const count = parent
      ? (parent.children?.length ?? 0)
      : (doc.frames.find((f) => f.id === frameId)?.root.length ?? 0);
    const comp = node.componentId ? getComponent(node.componentId) : undefined;
    const editable = node.type === 'component' && !!comp && comp.editable.length > 0;
    const movable = node.type !== 'column';
    items = [
      ...(editable
        ? [
            {
              label: 'Edit text',
              shortcut: 'Enter',
              onSelect: () => {
                if (!(menu.textKey && startTextEdit(frameId, nodeId, menu.textKey)))
                  startFirstTextEdit(frameId, nodeId);
              },
            },
          ]
        : []),
      {
        label: 'Duplicate',
        shortcut: `${MOD}D`,
        disabled: !movable,
        separatorBefore: editable,
        onSelect: () => st().duplicateNode(nodeId),
      },
      {
        label: 'Copy',
        shortcut: `${MOD}C`,
        disabled: !movable,
        onSelect: () => st().copyNode(nodeId),
      },
      {
        label: 'Paste',
        shortcut: `${MOD}V`,
        disabled: !clipboard,
        onSelect: () => st().pasteClipboard(),
      },
      { label: 'Copy HTML', onSelect: () => void copySelectionHtml(nodeId) },
      ...(node.type === 'component' || node.type === 'section'
        ? [
            {
              label: 'Save as component…',
              onSelect: () => st().setDialog('saveComponent', frameId, nodeId),
            },
          ]
        : []),
      ...(isFreeFrame(doc.frames.find((f) => f.id === frameId))
        ? [
            {
              label: 'Bring to front',
              separatorBefore: true,
              onSelect: () => st().reorderFree(nodeId, 'front'),
            },
            { label: 'Send to back', onSelect: () => st().reorderFree(nodeId, 'back') },
          ]
        : []),
      ...(isFreeFrame(doc.frames.find((f) => f.id === frameId))
        ? []
        : [
            {
              label: 'Move up',
              shortcut: `${ALT}↑`,
              disabled: !loc || loc.index === 0,
              separatorBefore: true,
              onSelect: () => st().moveSelected(-1),
            },
            {
              label: 'Move down',
              shortcut: `${ALT}↓`,
              disabled: !loc || loc.index >= count - 1,
              onSelect: () => st().moveSelected(1),
            },
          ]),
      {
        label: 'Select parent',
        shortcut: 'Esc',
        disabled: !loc || loc.parentId === null,
        onSelect: () => st().selectParent(),
      },
      {
        label: node.hidden ? 'Show' : 'Hide',
        separatorBefore: true,
        onSelect: () => st().setHidden(nodeId, !node.hidden),
      },
      {
        label: node.type === 'column' ? 'Empty column' : 'Delete',
        shortcut: 'Del',
        danger: true,
        separatorBefore: true,
        onSelect: () => st().deleteNode(nodeId),
      },
    ];
  } else {
    const frameKit = getKit(doc.frames.find((f) => f.id === frameId)?.kitId);
    const reference = doc.frames.find((f) => f.id === frameId)?.reference;
    items = [
      { label: 'Rename frame', onSelect: () => st().requestRename(frameId) },
      {
        label: 'Duplicate frame',
        shortcut: `${MOD}D`,
        onSelect: () => st().duplicateFrame(frameId),
      },
      {
        label: 'Save as template…',
        disabled: (doc.frames.find((f) => f.id === frameId)?.root.length ?? 0) === 0,
        onSelect: () => st().setDialog('saveTemplate', frameId),
      },
      ...(reference
        ? [
            {
              label: reference.visible ? 'Hide reference image' : 'Show reference image',
              shortcut: `${MOD}${SHIFT}R`,
              onSelect: () => st().updateFrameReference(frameId, { visible: !reference.visible }),
            },
          ]
        : []),
      {
        label: 'Check accessibility…',
        onSelect: () => st().setDialog('accessibility', frameId),
      },
      {
        label: 'Check responsive layouts…',
        onSelect: () => st().setDialog('responsive', frameId),
      },
      {
        label: doc.startFrameId === frameId ? 'Clear start frame' : 'Set as start frame',
        separatorBefore: true,
        onSelect: () => st().setStartFrame(doc.startFrameId === frameId ? null : frameId),
      },
      ...frameKit.pageParts.map((part, i) => ({
        label: part.label,
        separatorBefore: i === 0,
        onSelect: () => st().addPageParts(frameId, part.id),
      })),
      {
        label: 'Paste',
        shortcut: `${MOD}V`,
        disabled: !clipboard,
        separatorBefore: true,
        onSelect: () => st().pasteClipboard(),
      },
      ...conversionTargets(frameKit.id).map((id, i) => ({
        label: `Convert to ${getKit(id).shortLabel}`,
        separatorBefore: i === 0,
        disabled: (doc.frames.find((f) => f.id === frameId)?.root.length ?? 0) === 0,
        onSelect: () => st().convertFrame(frameId, id),
      })),
      {
        label: 'Copy as page spec',
        separatorBefore: true,
        onSelect: () => void copyFrameSpec(frameId),
      },
      { label: 'Download page spec (.page.json)', onSelect: () => downloadFrameSpec(frameId) },
      ...(frameKit.buildNotes
        ? [
            {
              label: `Copy as ${frameKit.buildNotes.label}`,
              separatorBefore: true,
              onSelect: () => void copyBuildNotes(frameId),
            },
            { label: 'Download build notes (.md)', onSelect: () => downloadBuildNotes(frameId) },
          ]
        : []),
      {
        label: 'Delete frame',
        shortcut: 'Del',
        danger: true,
        separatorBefore: true,
        onSelect: () => st().deleteFrame(frameId),
      },
    ];
  }

  const height = items.length * ROW + items.filter((i) => i.separatorBefore).length * 9 + 12;
  const left = Math.max(8, Math.min(menu.x, window.innerWidth - WIDTH - 8));
  const top = Math.max(8, Math.min(menu.y, window.innerHeight - height - 8));

  const onKeyDown = (e: React.KeyboardEvent) => {
    const buttons = [
      ...(ref.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []),
    ];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') buttons[(i + 1) % buttons.length]?.focus();
    else if (e.key === 'ArrowUp') buttons[(i - 1 + buttons.length) % buttons.length]?.focus();
    else if (e.key === 'Tab') st().openContextMenu(null);
    else return;
    e.preventDefault();
  };

  return (
    <div
      ref={ref}
      className="context-menu"
      role="menu"
      aria-label="Actions"
      style={{ left, top, width: WIDTH }}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) => (
        <div key={item.label} role="none">
          {item.separatorBefore && <div className="context-menu__sep" role="separator" />}
          <button
            role="menuitem"
            className={`context-menu__item${item.danger ? ' is-danger' : ''}`}
            disabled={item.disabled}
            onClick={() => {
              st().openContextMenu(null);
              item.onSelect();
            }}
          >
            <span>{item.label}</span>
            {item.shortcut && <span className="context-menu__key">{item.shortcut}</span>}
          </button>
        </div>
      ))}
    </div>
  );
}
