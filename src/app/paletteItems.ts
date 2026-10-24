import { copyPageSpecInstructions } from '../export/pageSpec';
import { KITS, getKit } from '../kits';
import { fitView } from '../lib/geometry';
import { commentsOf } from '../lib/comments';
import type { RankItem } from '../lib/rank';
import { loadSample, pickMockupFile, saveToFile } from '../persistence/file';
import { useSavedComponents } from '../store/savedComponents';
import { useStore } from '../store/store';
import { DEVICES } from '../store/types';
import { OFFICIAL_TEMPLATES } from '../templates';
import { templateAsNewFrame } from '../templates/use';
import { useTemplates } from '../store/templates';
import { switchFrameLayout } from './frameLayout';
import { applyTheme, readTheme } from './theme';

export interface PaletteItem extends RankItem {
  hint?: string;
  run: () => void;
}

/** Bring one frame into view and select it. */
export function focusFrame(frameId: string): void {
  const s = useStore.getState();
  const f = s.doc.frames.find((x) => x.id === frameId);
  if (!f) return;
  s.selectFrame(frameId);
  s.setView(
    fitView(
      { x: f.x, y: f.y - 28, width: f.width, height: (s.frameHeights[f.id] ?? 600) + 28 },
      s.viewport.width,
      s.viewport.height,
    ),
  );
}

/**
 * Everything the palette offers right now: actions, frames, components and templates for the kit of the
 * selected frame, saved components and templates, samples and comments. Built when the palette opens.
 */
export function buildPaletteItems(): PaletteItem[] {
  const s = useStore.getState();
  const frame = s.doc.frames.find((f) => f.id === s.selectedFrameId) ?? s.doc.frames[0];
  const kit = getKit(frame?.kitId ?? s.doc.defaultKitId);
  const items: PaletteItem[] = [];
  const add = (item: PaletteItem) => items.push(item);

  // Actions
  const act = (id: string, label: string, run: () => void, hint?: string, keywords?: string) =>
    add({ id: `act:${id}`, label, group: 'Action', run, hint, keywords });
  act('undo', 'Undo', () => useStore.getState().undo(), '⌘Z');
  act('redo', 'Redo', () => useStore.getState().redo(), '⇧⌘Z');
  act('fit', 'Zoom to fit', () => useStore.getState().zoomToFit(), '⌘0', 'zoom view all');
  act(
    'preview',
    'Preview',
    () => useStore.getState().setMode('preview'),
    undefined,
    'click through',
  );
  act(
    'play',
    'Play the click-through',
    () => useStore.getState().playPrototype(),
    undefined,
    'prototype preview start',
  );
  act('edit', 'Edit mode', () => useStore.getState().setMode('edit'));
  act('new', 'New mockup', () => useStore.getState().newDoc());
  act(
    'mockups',
    'My mockups…',
    () => useStore.getState().setDialog('mockups'),
    undefined,
    'open saved',
  );
  act(
    'history',
    'Version history…',
    () => useStore.getState().setDialog('history'),
    undefined,
    'save version restore snapshot',
  );
  act('open', 'Open file…', pickMockupFile, undefined, 'mockup.json');
  act('save', 'Save to file', saveToFile, undefined, 'download mockup.json');
  act(
    'export',
    'Export…',
    () => useStore.getState().setDialog('export'),
    undefined,
    'png html viewer share',
  );
  act(
    'import',
    'Import page spec…',
    () => useStore.getState().setDialog('importSpec'),
    undefined,
    'json paste',
  );
  for (const k of KITS)
    act(
      `spec-${k.id}`,
      `Copy page spec instructions (${k.shortLabel})`,
      () => void copyPageSpecInstructions(k.id),
      undefined,
      'claude screenshot',
    );
  act(
    'comment',
    'Add a comment',
    () => useStore.getState().setCommentTool(true),
    undefined,
    'note pin',
  );
  act('shortcuts', 'Keyboard shortcuts', () => useStore.getState().setHelpOpen(true), '?');
  act(
    'theme',
    readTheme() === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme',
    () => applyTheme(readTheme() === 'dark' ? 'light' : 'dark'),
    undefined,
    'dark light appearance',
  );
  for (const d of kit.devices)
    act(
      `frame-${d}`,
      `Add a ${DEVICES[d].label} frame`,
      () => useStore.getState().addFrame(d, kit.id, useStore.getState().newFrameLayout),
      d === 'custom' ? undefined : `${DEVICES[d].width}px`,
      'new frame',
    );
  if (frame) {
    act(
      'layout-free',
      'Make this frame Freeform',
      () => switchFrameLayout(frame.id, 'free'),
      undefined,
      'layout',
    );
    act(
      'layout-flow',
      'Make this frame Flow',
      () => switchFrameLayout(frame.id, 'flow'),
      undefined,
      'layout',
    );
    act('duplicate-frame', 'Duplicate this frame', () =>
      useStore.getState().duplicateFrame(frame.id),
    );
  }

  // Frames
  for (const f of s.doc.frames)
    add({
      id: `frame:${f.id}`,
      label: `Go to ${f.name}`,
      group: 'Frame',
      hint: getKit(f.kitId).shortLabel,
      keywords: 'frame jump select',
      run: () => focusFrame(f.id),
    });

  // Components of the current kit, one entry per variant
  if (frame)
    for (const c of kit.catalogue.components)
      for (const v of c.variants)
        add({
          id: `comp:${c.id}:${v.id}`,
          label: c.variants.length > 1 ? `${c.name}: ${v.label}` : c.name,
          group: 'Add component',
          hint: c.category,
          keywords: c.keywords.join(' '),
          run: () => useStore.getState().addComponent(frame.id, c.id, v.id),
        });

  // Saved components
  if (frame)
    for (const c of useSavedComponents.getState().components)
      if (getKit(c.kitId).id === kit.id)
        add({
          id: `mine:${c.id}`,
          label: c.name,
          group: 'My component',
          run: () => useStore.getState().insertSaved(frame.id, c.id),
        });

  // Templates
  for (const t of OFFICIAL_TEMPLATES.filter((x) => x.kitId === kit.id))
    add({
      id: `tpl:${t.id}`,
      label: t.name,
      group: 'Template',
      hint: 'new frame',
      run: () => templateAsNewFrame({ source: 'official', templateId: t.id }),
    });
  for (const t of useTemplates.getState().templates)
    add({
      id: `mytpl:${t.id}`,
      label: t.name,
      group: 'My template',
      hint: 'new frame',
      run: () => templateAsNewFrame({ source: 'mine', templateId: t.id }),
    });

  // Samples
  for (const d of KITS.flatMap((k) => k.samples))
    add({
      id: `sample:${d.id}`,
      label: `Sample: ${d.name}`,
      group: 'Sample',
      run: () => loadSample(d.id),
    });

  // Comments
  commentsOf(s.doc).forEach((c, i) =>
    add({
      id: `comment:${c.id}`,
      label: `Comment ${i + 1}: ${c.text.trim().slice(0, 60) || '(empty note)'}`,
      group: 'Comment',
      hint: c.resolved ? 'done' : undefined,
      run: () => {
        focusFrame(c.frameId);
        useStore.getState().setActiveComment(c.id);
      },
    }),
  );
  return items;
}
