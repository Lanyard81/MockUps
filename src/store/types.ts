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

/** Where a component sits on a freeform frame, in the frame's own pixels. Height follows the content. */
export interface FreeBox {
  x: number;
  y: number;
  width: number;
}

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
  /** Position on a freeform frame (Milestone F1). Only components directly in a freeform frame's root have one. */
  free?: FreeBox;
}

/** A screenshot shown on a frame as a tracing guide. Edit mode only: never in Preview, exports or templates. */
export interface FrameReference {
  /** The image, in `doc.images`. */
  imageId: string;
  /** 0 to 1. */
  opacity: number;
  /** Over the content, behind it, or at full opacity beside the frame for comparing. */
  placement: 'over' | 'behind' | 'beside';
  /** Scale to the frame's width, or show at its actual size. */
  fit: 'width' | 'actual';
  offsetX: number;
  offsetY: number;
  visible: boolean;
  /** Pixels in the stored image per CSS pixel (2 for a 2× screenshot). Used by "Actual size". */
  pixelRatio: number;
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
  /**
   * How the frame is laid out: `flow` (sections, grids and columns, the default) or `free` (components
   * placed anywhere, Milestone F1). A freeform frame's root holds components only, back to front.
   */
  layout?: 'flow' | 'free';
  /** Freeform frames: draw and snap to a grid of this many pixels (8, 16 or 24). Missing means no grid. */
  freeGrid?: number;
  /** Freeform frames: snap a moved item to the alignment guides (other items, the frame's edges and middle). */
  freeSnap?: boolean;
  /** A screenshot to trace over (Milestone R1). */
  reference?: FrameReference;
}

/** A note pinned to a point on a frame, in the frame's own pixels. */
export interface Comment {
  id: string;
  frameId: string;
  x: number;
  y: number;
  text: string;
  resolved: boolean;
  createdAt: number;
}

export interface MockupDoc {
  version: 6;
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
  /** Notes pinned to spots on frames (Milestone G3). Edit mode only; never in Preview or HTML export. */
  comments?: Comment[];
  /** Uploaded images by content-derived id. Each use (and its alt text) is in the node's `props.images`. */
  images: Record<string, { dataUrl: string; name?: string }>;
}

// ---- UI-only types (never saved) ----

/** What is being dragged. */
export type DragPayload =
  | { kind: 'new-component'; componentId: string; variantId: string; label: string }
  | { kind: 'new-layout'; kitId: KitId; block: string; columns?: number; label: string }
  | { kind: 'move'; nodeId: string; label: string }
  | { kind: 'template'; source: 'official' | 'mine'; templateId: string; label: string }
  | { kind: 'saved'; savedId: string; label: string };

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
  /** Set when the frame is freeform: where in the frame (its pixels) the pointer is. */
  free?: { x: number; y: number };
}

/** Where a drop would land, with the geometry to draw it (in frame coordinates). */
export interface DropTarget extends Placement {
  /** A line between items, or a box over an empty container. */
  indicator: { kind: 'line' | 'box'; rect: IndicatorRect; parent?: IndicatorRect };
}

export interface Clipboard {
  nodes: Record<string, DocNode>;
  rootId: string;
  /** The kit of the frame it was copied from. */
  kitId?: KitId;
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

/** A component or section saved for reuse (Milestone G2): a subtree with its images. Lives in browser storage, not in a mockup. */
export interface SavedComponent {
  id: string;
  name: string;
  createdAt: number;
  kitId: KitId;
  /** The top node: a component, or a section of a flow frame. */
  rootId: string;
  nodes: Record<string, DocNode>;
  images: MockupDoc['images'];
}
