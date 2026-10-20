/** Library filter tabs for the NSW kit. */
export const NSW_CATEGORIES = [
  'Layout',
  'Navigation',
  'Content',
  'Forms',
  'Feedback',
  'Media',
] as const;
export type NswCategory = (typeof NSW_CATEGORIES)[number];
