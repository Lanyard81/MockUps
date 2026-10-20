import type { OptionDef } from '../../../catalogue/types';

/** Hand-curated data the markup can't express (see the NSW kit's `overrides.ts`). */
export interface Override {
  category?: string;
  keywords?: string[];
  optionalLabels?: Record<string, string>;
  options?: OptionDef[];
  defaultVariant?: string;
}

export const overrides: Record<string, Override> = {
  'sp-text': { keywords: ['paragraph', 'heading', 'body', 'rich text'] },
};
