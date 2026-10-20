import type { ComponentSource } from '../types';
import { content } from './content';
import { feedback } from './feedback';
import { forms } from './forms';
import { layout } from './layout';
import { media } from './media';
import { navigation } from './navigation';
import { text } from './text';

export const sources: ComponentSource[] = [
  ...layout,
  ...navigation,
  ...text,
  ...content,
  ...forms,
  ...feedback,
  ...media,
];
