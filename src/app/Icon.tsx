/**
 * The editor's one icon set: simple outline shapes on a 16px grid, drawn in the current text colour.
 * Use these instead of text glyphs (▶ × ▾) so every icon has the same weight and size.
 */
const PATHS = {
  plus: 'M8 3v10M3 8h10',
  minus: 'M3 8h10',
  close: 'M4 4l8 8M12 4l-8 8',
  'chevron-right': 'M6 3.5L10.5 8 6 12.5',
  'chevron-down': 'M3.5 6L8 10.5 12.5 6',
  'arrow-up': 'M8 13V3M3.5 7.5L8 3l4.5 4.5',
  'arrow-down': 'M8 3v10M3.5 8.5L8 13l4.5-4.5',
  'arrow-left': 'M13 8H3M7.5 3.5L3 8l4.5 4.5',
  'arrows-vertical': 'M8 2v12M4.5 5.5L8 2l3.5 3.5M4.5 10.5L8 14l3.5-3.5',
  play: 'M5 3l8 5-8 5z',
  warning: 'M8 2.5l6 10.5H2zM8 7v3M8 11.6v.4',
  eye: 'M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8zM8 6.2a1.8 1.8 0 100 3.6 1.8 1.8 0 000-3.6z',
  'eye-off':
    'M2 2l12 12M6.4 4a6 6 0 011.6-.5c4 0 6.5 4.5 6.5 4.5a11 11 0 01-2 2.6M9.6 9.6A1.8 1.8 0 016.4 6.4M4 5.2A11 11 0 001.5 8S4 12.5 8 12.5a6 6 0 002-.4',
  section: 'M2.5 4h11v8h-11z',
  container: 'M4.5 2.5h7v11h-7z',
  grid: 'M2.5 2.5h11v11h-11zM8 2.5v11M2.5 8h11',
  column: 'M5 2.5h6v11H5zM8 2.5v11',
  component: 'M8 2l5 6-5 6-5-6z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 14 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={name === 'play' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
