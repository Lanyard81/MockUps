/** Page sizes beyond the device presets (Milestone G10): paper, social cards and slides, in CSS pixels. */
export interface FrameSize {
  id: string;
  label: string;
  width: number;
  hint: string;
}

export const FRAME_SIZES: FrameSize[] = [
  { id: 'a4', label: 'A4 page', width: 794, hint: '794px, 210mm wide' },
  { id: 'social-square', label: 'Social post', width: 1080, hint: '1080px square or portrait' },
  { id: 'social-card', label: 'Social card', width: 1200, hint: '1200px wide, link previews' },
  { id: 'slide', label: 'Slide (16:9)', width: 1280, hint: '1280px wide' },
  { id: 'slide-43', label: 'Slide (4:3)', width: 1024, hint: '1024px wide' },
];
