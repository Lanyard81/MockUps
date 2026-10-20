/** NSW section backgrounds (the `nsw-section--*` classes), and whether text should be inverted on them. */
export const SECTION_BACKGROUNDS = [
  { id: 'white', label: 'White', swatch: '#ffffff', invert: false },
  { id: 'off-white', label: 'Off-white', swatch: '#f2f2f2', invert: false },
  { id: 'brand-light', label: 'Brand light', swatch: '#cbedfd', invert: false },
  { id: 'brand-dark', label: 'Brand dark', swatch: '#002664', invert: true },
  { id: 'brand-supplementary', label: 'Brand supplementary', swatch: '#146cfd', invert: true },
  { id: 'grey-01', label: 'Grey 1', swatch: '#22272b', invert: true },
  { id: 'grey-02', label: 'Grey 2', swatch: '#495054', invert: true },
  { id: 'grey-03', label: 'Grey 3', swatch: '#cdd3d6', invert: false },
  { id: 'grey-04', label: 'Grey 4', swatch: '#ebebeb', invert: false },
  { id: 'black', label: 'Black', swatch: '#000000', invert: true },
] as const;

export const SECTION_PADDINGS = [
  { id: 'default', label: 'Standard', cls: '' },
  { id: 'half', label: 'Compact', cls: 'nsw-section--half-padding' },
  { id: 'none', label: 'None', cls: 'nsw-section--no-padding' },
] as const;

export type SectionBackground = (typeof SECTION_BACKGROUNDS)[number]['id'];
export type SectionPadding = (typeof SECTION_PADDINGS)[number]['id'];
