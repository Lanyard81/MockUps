import type { KitId } from '../kits/types';
import type { DeviceId, DocNode } from '../store/types';

/** The `format` field every page spec file carries, and the version of this format. */
export const SPEC_FORMAT = 'mockup-page-spec';
export const SPEC_VERSION = 1;

/** Limits on what an imported spec may contain. A spec is untrusted: anything beyond these is dropped. */
export const LIMITS = {
  /** Characters in the JSON text. */
  chars: 2_000_000,
  pages: 20,
  components: 1000,
  /** Sections or top-level items on a page. */
  blocks: 200,
  columns: 12,
  nameChars: 100,
};

/** What an import did to one page, for the report the person can expand. */
export interface PageImportReport {
  /** The frame it created. */
  frameName: string;
  kitId: KitId;
  /** Components placed (not counting placeholders). */
  components: number;
  /** Components with no match, by the name the spec gave them. */
  placeholders: { name: string; count: number }[];
  /** Variants that didn't exist, replaced by the component's default. */
  unknownVariants: number;
  /** Text keys, options, optional parts and settings that don't exist and were dropped. */
  dropped: number;
  /** Items put in the nearest place the rules allow. */
  moved: number;
  notes: string[];
}

/** A page ready to become a frame. */
export interface ImportedPage {
  name: string;
  kitId: KitId;
  device: DeviceId;
  width: number;
  settings?: Record<string, unknown>;
  root: string[];
  nodes: Record<string, DocNode>;
  report: PageImportReport;
}

/** The report of a whole import, shown once it is done. */
export interface ImportSummary {
  /** The frames created, with their reports, in order. */
  pages: (PageImportReport & { frameId: string })[];
}

export class SpecError extends Error {}
