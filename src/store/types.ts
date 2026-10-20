import type { View } from '../lib/geometry';
import type { KitId } from '../kits/types';

export type DeviceId = 'iphone' | 'android' | 'tablet' | 'desktop' | 'custom';

export interface DevicePreset {
  id: DeviceId;
  label: string;
  width: number;
  /** Screen height, used for the dashed "fold" line. */
  screenHeight: number;
}

export const DEVICES: Record<DeviceId, DevicePreset> = {
  iphone: { id: 'iphone', label: 'iPhone', width: 393, screenHeight: 852 },
  android: { id: 'android', label: 'Android', width: 412, screenHeight: 915 },
  tablet: { id: 'tablet', label: 'Tablet', width: 820, screenHeight: 1180 },
  desktop: { id: 'desktop', label: 'Desktop', width: 1440, screenHeight: 900 },
  custom: { id: 'custom', label: 'Custom', width: 600, screenHeight: 800 },
};

export type NodeType = 'section' | 'container' | 'grid' | 'column' | 'component';

export interface DocNode {
  id: string;
  type: NodeType;
  props?: Record<string, unknown>;
  children?: string[];
  componentId?: string;
  variant?: string;
  text?: Record<string, string>;
  textFit?: Record<string, 'natural' | 'shrink'>;
  hidden?: boolean;
  /** A name the user gave this layer. Shown in the Layers panel instead of the default label. */
  name?: string;
}

export interface Frame {
  id: string;
  name: string;
  /** The style kit this frame is built with (NSW, SharePoint...). */
  kitId: KitId;
  /** This frame's kit-specific settings (e.g. SharePoint site type, header and navigation). */
  settings?: Record<string, unknown>;
  device: DeviceId;
  width: number;
  x: number;
  y: number;
  /** Ids of top-level sections, top to bottom. */
  root: string[];
}

export interface MockupDoc {
  version: 2;
  id: string;
  name: string;
  /** The kit used for the first frame of the mockup, and a new frame's starting choice. */
  defaultKitId: KitId;
  /** The design-system version each kit's markup was written against, for kits in use. */
  kitVersions: Record<KitId, string>;
  /** Document-wide settings per kit (e.g. the SharePoint theme). */
  kitSettings: Record<KitId, Record<string, unknown>>;
  view: View;
  frames: Frame[];
  nodes: Record<string, DocNode>;
  /** Uploaded images by content-derived id. Each use (and its alt text) is in the node's `props.images`. */
  images: Record<string, { dataUrl: string; name?: string }>;
}

// ---- UI-only types (never saved) ----

/** What is being dragged. */
export type DragPayload =
  | { kind: 'new-component'; componentId: string; variantId: string; label: string }
  | { kind: 'new-layout'; block: string; columns?: number; label: string }
  | { kind: 'move'; nodeId: string; label: string }
  | { kind: 'template'; source: 'official' | 'mine'; templateId: string; label: string };

export interface IndicatorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A position in the tree: a frame, a parent (null = the frame root) and an index in its children. */
export interface Placement {
  frameId: string;
  parentId: string | null;
  index: number;
  /** When set, create the missing layers from this depth down (see `buildChain`). */
  chainFrom: number | null;
}

/** Where a drop would land, with the geometry to draw it (in frame coordinates). */
export interface DropTarget extends Placement {
  /** A line between items, or a box over an empty container. */
  indicator: { kind: 'line' | 'box'; rect: IndicatorRect; parent?: IndicatorRect };
}

export interface Clipboard {
  nodes: Record<string, DocNode>;
  rootId: string;
}

/** A right-click menu: where it is, and what it is about. */
export interface ContextMenuState {
  x: number;
  y: number;
  frameId: string;
  /** The node it applies to, or null for the frame itself. */
  nodeId: string | null;
  /** The text region that was right-clicked, so "Edit text" edits that one. */
  textKey?: string;
}

/** A frame saved as the user's own template (Milestone 7). */
export interface SavedTemplate {
  id: string;
  name: string;
  createdAt: number;
  device: DeviceId;
  width: number;
  /** The kit the frame was built with. Missing in older saves, which were all NSW. */
  kitId?: KitId;
  settings?: Record<string, unknown>;
  root: string[];
  nodes: Record<string, DocNode>;
  images: MockupDoc['images'];
  /** Small PNG data URL for the Templates tab. */
  thumbnail?: string;
}

/** A "Are you sure?" dialog, asked by something that can't be undone. */
export interface ConfirmRequest {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
}
