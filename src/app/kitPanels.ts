import type { ComponentType } from 'react';
import type { KitId, LayerType } from '../kits/types';
import { ColumnProps, GridProps } from '../kits/nsw/panels';
import { SpFramePanel, SpSectionPanel } from './sharepointPanels';

/**
 * Custom Properties panels for what a kit's settings data can't express (e.g. the NSW grid's
 * column widths, the SharePoint menu editor). Kept out of the kit data so kits stay free of UI and
 * store imports.
 */
interface KitPanelSet {
  /** Extra panels for a layout node, by node type. */
  node?: Partial<Record<LayerType, ComponentType<{ nodeId: string }>>>;
  /** Extra panel for a frame of the kit, shown with its settings. */
  frame?: ComponentType<{ frameId: string }>;
}

export const KIT_PANELS: Record<KitId, KitPanelSet> = {
  nsw: { node: { grid: GridProps, column: ColumnProps } },
  sharepoint: { node: { section: SpSectionPanel }, frame: SpFramePanel },
};
