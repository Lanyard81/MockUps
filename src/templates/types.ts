import type { KitId } from '../kits/types';
import type { DeviceId, DocNode, MockupDoc } from '../store/types';

/** A template ready to put in a document: a tree with fresh ids. */
export interface InstantiatedTemplate {
  name: string;
  device: DeviceId;
  width: number;
  /** The kit the frame belongs to. */
  kitId: KitId;
  root: string[];
  nodes: Record<string, DocNode>;
  images: MockupDoc['images'];
  /** Frame settings the template sets (e.g. a SharePoint header layout). */
  settings?: Record<string, unknown>;
}

export type MakeId = (prefix: string) => string;

/** An official template, written as data and built with a kit's template helpers. */
export interface TemplateDef {
  id: string;
  name: string;
  group: string;
  description: string;
  device: DeviceId;
  width: number;
  kitId: KitId;
  /** Build the frame's tree. */
  build: (makeId: MakeId) => {
    root: string[];
    nodes: Record<string, DocNode>;
    settings?: Record<string, unknown>;
  };
}
