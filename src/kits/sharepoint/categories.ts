/** Library filter tabs for the SharePoint kit. */
export const SP_CATEGORIES = [
  'Sections',
  'Text and media',
  'Navigation and links',
  'Content',
  'Data',
] as const;
export type SpCategory = (typeof SP_CATEGORIES)[number];
