import type { ComponentSource } from '../../../../catalogue/types';
import { actions } from './actions';
import { content } from './content';
import { forms } from './forms';
import { media } from './media';
import { nav } from './nav';
import { text } from './text';

export const sources: ComponentSource[] = [
  ...text,
  ...actions,
  ...content,
  ...forms,
  ...nav,
  ...media,
];
