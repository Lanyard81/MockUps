import type { ComponentType } from 'react';
import type { KitId, LayerType } from '../kits/types';
import { ColumnProps, GridProps } from '../kits/nsw/panels';

/**
 * Custom Properties panels for what a kit's settings data can't express (e.g. the NSW grid's
 * column widths). Kept out of the kit data so kits stay free of UI and store imports.
 */
export const KIT_PANELS: Record<
  KitId,
  Partial<Record<LayerType, ComponentType<{ nodeId: string }>>>
> = {
  nsw: { grid: GridProps, column: ColumnProps },
};
