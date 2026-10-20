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
      { keys: 'Drag', action: 'Drag a component from the library onto a frame' },
      { keys: 'Click a tile', action: 'Add it next to the selection' },
      { keys: 'Drag an item', action: 'Move it, or move it to another frame' },
      { keys: 'Right-click', action: 'Actions for the item under the pointer' },
    ],
  },
  {
    title: 'Preview',
    items: [
      { keys: 'Click a link', action: 'Follow a “go to frame” link (set in Properties)' },
      { keys: 'Esc', action: 'Close the click-through' },
    ],
  },
  {
    title: 'Select and edit',
    items: [
      { keys: 'Click', action: 'Select what is under the pointer' },
      { keys: 'Esc', action: 'Select the parent, then the frame, then nothing' },
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
      { keys: 'Delete', action: 'Delete the selected item or frame' },
      { keys: `${MOD}D`, action: 'Duplicate' },
      { keys: `${MOD}C  ${MOD}V`, action: 'Copy and paste, including between frames' },
      { keys: `${ALT}↑  ${ALT}↓`, action: 'Move up or down' },
      { keys: `${MOD}Z`, action: 'Undo' },
      { keys: `${SHIFT}${MOD}Z`, action: 'Redo' },
    ],
  },
  {
    title: 'Canvas',
    items: [
      { keys: 'Space + drag', action: 'Pan (or middle mouse button, or scroll)' },
      { keys: `${MOD}scroll`, action: 'Zoom (or pinch)' },
      { keys: `${MOD}+  ${MOD}−`, action: 'Zoom in and out' },
      { keys: `${MOD}0`, action: 'Zoom to fit' },
      { keys: `${MOD}${SHIFT}R`, action: 'Show or hide the selected frame’s reference image' },
      { keys: `${MOD}V`, action: 'With only a frame selected, paste an image as its reference' },
      { keys: `${MOD}V`, action: 'Pasting page spec JSON adds its pages as new frames' },
      { keys: '?', action: 'Show or hide this sheet' },
    ],
  },
];
