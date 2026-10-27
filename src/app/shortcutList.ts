import { ALT, MOD, SHIFT } from './platform';

export interface ShortcutGroup {
  title: string;
  items: { keys: string; action: string }[];
}

/** Everything shown in the shortcuts sheet (press ?). Keep in step with `canvas/shortcuts.ts`. */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Build',
    items: [
      { keys: 'Drag', action: 'Drag a component from the library onto a page' },
      { keys: 'Click a tile', action: 'Add it next to the selection' },
      { keys: 'Drag an item', action: 'Move it, or move it to another page' },
      {
        keys: 'Free-layout page',
        action:
          'Drop or drag components anywhere; Shift locks one direction; drag the side handles to resize',
      },
      { keys: 'Right-click', action: 'Actions for the item under the pointer' },
      {
        keys: 'Comments tab',
        action: 'Add a comment, then click a spot on a page to pin a note (Esc cancels)',
      },
    ],
  },
  {
    title: 'Preview',
    items: [
      { keys: 'Click a link', action: 'Follow a “go to page” link (set in Properties)' },
      { keys: 'Esc', action: 'Close the full-screen presentation' },
    ],
  },
  {
    title: 'Select and edit',
    items: [
      { keys: 'Click', action: 'Select what is under the pointer' },
      { keys: 'Esc', action: 'Select the parent, then the page, then nothing' },
      { keys: 'Double-click', action: 'Edit text in place' },
      { keys: 'Enter or F2', action: 'Edit the selected component’s text' },
      { keys: 'Enter', action: 'Finish editing text' },
      { keys: `${SHIFT}Enter`, action: 'New line (in text that allows it)' },
      { keys: 'Tab', action: 'Finish and move to the next text in the component' },
      { keys: 'Esc', action: 'Cancel editing' },
    ],
  },
  {
    title: 'Arrange',
    items: [
      { keys: 'Delete', action: 'Delete the selected item or page' },
      { keys: `${MOD}D`, action: 'Duplicate' },
      { keys: `${MOD}C  ${MOD}V`, action: 'Copy and paste, including between pages' },
      {
        keys: `${ALT}↑  ${ALT}↓`,
        action: 'Move up or down (on a free-layout page: forward or back)',
      },
      {
        keys: `Alt while dragging`,
        action: 'On a free-layout page, ignore grid and guide snapping for that drag',
      },
      { keys: '←  ↑  →  ↓', action: 'Nudge an item on a free-layout page 1 pixel (Shift: 10)' },
      { keys: `${MOD}Z`, action: 'Undo' },
      { keys: `${SHIFT}${MOD}Z`, action: 'Redo' },
    ],
  },
  {
    title: 'Canvas',
    items: [
      { keys: 'Space + drag', action: 'Pan (or middle mouse button, or scroll)' },
      { keys: 'H', action: 'Hand tool: switch panning on or off' },
      { keys: `${MOD}scroll`, action: 'Zoom (or pinch)' },
      { keys: `${MOD}+  ${MOD}−`, action: 'Zoom in and out' },
      { keys: `${MOD}0`, action: 'Zoom to fit' },
      { keys: `${MOD}${SHIFT}R`, action: 'Show or hide the selected page’s reference image' },
      { keys: `${MOD}V`, action: 'With only a page selected, paste an image as its reference' },
      { keys: `${MOD}V`, action: 'Pasting a page description (JSON) adds its pages' },
      { keys: `${MOD}K`, action: 'Search everything: actions, pages, components, templates' },
      { keys: '?', action: 'Show or hide this sheet' },
    ],
  },
];
