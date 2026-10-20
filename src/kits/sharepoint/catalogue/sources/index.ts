import type { ComponentSource } from '../../../../catalogue/types';
import { content } from './content';
import { data } from './data';
import { links } from './links';
import { media } from './media';
import { text } from './text';

export const sources: ComponentSource[] = [...text, ...media, ...links, ...content, ...data];
