import type { DocNode } from '../../store/types';
import type { SectionLayout } from '../types';

/** How a section's columns are arranged. */
export const sectionLayoutOf = (n: DocNode | undefined): string =>
  typeof n?.props?.layout === 'string' ? n.props.layout : 'one-column';

export const SECTION_LAYOUTS: readonly SectionLayout[] = [
  { id: 'one-column', label: 'One column', columns: 1 },
  { id: 'two-columns', label: 'Two columns', columns: 2 },
  { id: 'three-columns', label: 'Three columns', columns: 3 },
  {
    id: 'sidebar-left',
    label: 'Narrow left, wide right',
    columns: 2,
    title: 'A narrow column on the left and a wide one on the right',
  },
  {
    id: 'sidebar-right',
    label: 'Wide left, narrow right',
    columns: 2,
    title: 'A wide column on the left and a narrow one on the right',
  },
];
