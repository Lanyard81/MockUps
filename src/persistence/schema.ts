import { hasKit } from '../kits';
import type { KitId } from '../kits/types';
import { FREE_DEFAULT_WIDTH, clampBox } from '../layout/free';
import { canContain, schemaOfKit } from '../layout/ops';
import { DOC_VERSION, migrateDoc } from './migrate';
import {
  DEVICES,
  type DeviceId,
  type Comment,
  type DocNode,
  type Frame,
  type FrameReference,
  type MockupDoc,
  type NodeType,
  type SavedComponent,
  type SavedTemplate,
} from '../store/types';

/**
 * Everything that comes from outside (a saved file, a stored mockup, a template) is untrusted.
 * This module turns such data into a fresh, well-formed document or throws a `FileError` whose
 * message is fit to show the user. Nothing here trusts the input's shape: values are copied field
 * by field, limits are enforced, and the tree rules are checked.
 */
export class FileError extends Error {}

export const FILE_VERSION = 1;
export const FILE_APP = 'mockmaker';
/** The name files were saved under before the app was called MockMaker; still opened. */
const OLD_FILE_APP = 'nsw-mockup-builder';
const isOurFile = (app: unknown) => app === FILE_APP || app === OLD_FILE_APP;
export const MAX_FILE_BYTES = 200 * 1024 * 1024;
const MAX_NODES = 20_000;
const MAX_FRAMES = 200;
const MAX_IMAGE_CHARS = 28 * 1024 * 1024; // a 20 MB image as base64
const MAX_NAME = 200;
const NODE_TYPES: NodeType[] = ['section', 'container', 'grid', 'column', 'component'];
const FIT_MODES = ['natural', 'shrink'];
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const IMAGE_URL = /^data:image\/(png|jpeg|gif|webp|svg\+xml)[;,]/;

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, max = MAX_NAME): string | undefined =>
  typeof v === 'string' ? v.slice(0, max) : undefined;
const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** JSON.parse that refuses keys used for prototype pollution, at any depth. */
export function safeJsonParse(text: string): unknown {
  return JSON.parse(text, (key, value) => {
    if (FORBIDDEN_KEYS.has(key))
      throw new FileError('The file contains data this app will not open.');
    return value;
  });
}

/** Plain-JSON copy of a props-like object (no functions, no forbidden keys, bounded depth). */
function cleanJson(value: unknown, depth = 0): unknown {
  if (depth > 8) return undefined;
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return typeof value === 'string' ? value.slice(0, 100_000) : value;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (Array.isArray(value))
    return value
      .slice(0, 1000)
      .map((v) => cleanJson(v, depth + 1))
      .filter((v) => v !== undefined);
  if (isObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(k)) continue;
      const c = cleanJson(v, depth + 1);
      if (c !== undefined) out[k] = c;
    }
    return out;
  }
  return undefined;
}

function cleanNode(key: string, raw: unknown): DocNode {
  if (!isObject(raw))
    throw new FileError('The file’s layout is damaged (a layer is not an object).');
  const type = raw.type as NodeType;
  if (!NODE_TYPES.includes(type))
    throw new FileError(
      `The file’s layout is damaged (unknown layer type “${String(raw.type).slice(0, 30)}”).`,
    );
  const node: DocNode = { id: key, type };
  if (Array.isArray(raw.children) && type !== 'component')
    node.children = raw.children.filter((c): c is string => typeof c === 'string');
  const props = cleanJson(raw.props);
  if (isObject(props)) node.props = props;
  if (type === 'component') {
    node.componentId = str(raw.componentId, 100) ?? '';
    const variant = str(raw.variant, 100);
    if (variant) node.variant = variant;
    if (isObject(raw.text)) {
      node.text = {};
      for (const [k, v] of Object.entries(raw.text))
        if (!FORBIDDEN_KEYS.has(k) && typeof v === 'string') node.text[k] = v.slice(0, 20_000);
    }
    if (isObject(raw.textFit)) {
      node.textFit = {};
      for (const [k, v] of Object.entries(raw.textFit)) {
        if (!FORBIDDEN_KEYS.has(k) && typeof v === 'string' && FIT_MODES.includes(v))
          node.textFit[k] = v as 'natural' | 'shrink';
      }
    }
  }
  if (typeof raw.hidden === 'boolean') node.hidden = raw.hidden;
  if (type === 'component' && isObject(raw.free))
    node.free = clampBox({
      x: num(raw.free.x, 0),
      y: num(raw.free.y, 0),
      width: num(raw.free.width, FREE_DEFAULT_WIDTH),
    });
  const name = str(raw.name);
  if (name) node.name = name;
  return node;
}

function cleanImages(raw: unknown): MockupDoc['images'] {
  const out: MockupDoc['images'] = {};
  if (!isObject(raw)) return out;
  for (const [id, v] of Object.entries(raw)) {
    if (FORBIDDEN_KEYS.has(id) || !isObject(v)) continue;
    const dataUrl = v.dataUrl;
    if (typeof dataUrl !== 'string' || dataUrl.length > MAX_IMAGE_CHARS || !IMAGE_URL.test(dataUrl))
      continue;
    out[id.slice(0, 100)] = { dataUrl, ...(str(v.name) ? { name: str(v.name)! } : {}) };
  }
  return out;
}

/**
 * Check a set of nodes against the frame roots that use them: every node must be real, used at most
 * once, and sit where the tree rules allow. Nodes nothing uses are dropped. Returns the cleaned nodes.
 */
export function cleanTree(
  rawNodes: unknown,
  roots: string[][],
  /** The kit of each root list, in the same order (NSW when omitted). */
  kitIds: (KitId | undefined)[] = [],
  /** Which root lists belong to freeform frames, in the same order: they hold components only. */
  freeRoots: boolean[] = [],
): Record<string, DocNode> {
  if (!isObject(rawNodes)) throw new FileError('The file has no layout.');
  const keys = Object.keys(rawNodes).filter((k) => !FORBIDDEN_KEYS.has(k));
  if (keys.length > MAX_NODES)
    throw new FileError('The file is too large to open (too many layers).');
  const nodes: Record<string, DocNode> = {};
  for (const k of keys) nodes[k] = cleanNode(k, rawNodes[k]);

  const seen = new Set<string>();
  const visit = (id: string, parent: DocNode | null, schema: ReturnType<typeof schemaOfKit>) => {
    const node = nodes[id];
    if (!node)
      throw new FileError('The file’s layout is damaged (it refers to a layer that is missing).');
    if (seen.has(id)) throw new FileError('The file’s layout is damaged (a layer is used twice).');
    seen.add(id);
    if (!canContain(parent, node, schema)) {
      throw new FileError(
        `The file’s layout breaks the rules (a ${node.type} can’t go inside ${parent ? `a ${parent.type}` : 'a frame'}).`,
      );
    }
    for (const c of node.children ?? []) visit(c, node, schema);
  };
  roots.forEach((list, i) => {
    const schema = schemaOfKit(kitIds[i]);
    for (const id of list) {
      if (!freeRoots[i]) {
        visit(id, null, schema);
        continue;
      }
      // A freeform frame holds components directly, with no layers around them.
      const node = nodes[id];
      if (!node)
        throw new FileError('The file’s layout is damaged (it refers to a layer that is missing).');
      if (seen.has(id))
        throw new FileError('The file’s layout is damaged (a layer is used twice).');
      if (node.type !== 'component')
        throw new FileError(
          'The file’s layout breaks the rules (a freeform frame holds components only).',
        );
      seen.add(id);
    }
  });

  // Anything not reachable from a frame is leftover: drop it.
  return Object.fromEntries(Object.entries(nodes).filter(([id]) => seen.has(id)));
}

/**
 * Kit settings are plain data (strings, numbers, booleans, lists and nested objects) of limited
 * size and depth. Anything else, and any key used for prototype pollution, is dropped.
 */
export function cleanSettings(raw: unknown, depth = 0): Record<string, unknown> | undefined {
  if (!isObject(raw) || depth > 5) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw).slice(0, 200)) {
    if (FORBIDDEN_KEYS.has(k)) continue;
    const clean = cleanSettingValue(v, depth + 1);
    if (clean !== undefined) out[k] = clean;
  }
  return out;
}

function cleanSettingValue(v: unknown, depth: number): unknown {
  if (typeof v === 'string') return v.slice(0, 2000);
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'boolean') return v;
  if (Array.isArray(v) && depth <= 5)
    return v
      .slice(0, 200)
      .map((x) => cleanSettingValue(x, depth + 1))
      .filter((x) => x !== undefined);
  if (isObject(v)) return cleanSettings(v, depth);
  return undefined;
}

function cleanFrame(raw: unknown, index: number): Frame {
  if (!isObject(raw)) throw new FileError('The file’s frames are damaged.');
  const device = (
    typeof raw.device === 'string' && raw.device in DEVICES ? raw.device : 'custom'
  ) as DeviceId;
  const kitId = str(raw.kitId, 40) ?? 'nsw';
  if (!hasKit(kitId))
    throw new FileError(
      'This mockup uses a style kit this version of the app doesn’t have. Open it with the latest version.',
    );
  const settings = cleanSettings(raw.settings);
  const reference = cleanReference(raw.reference);
  const layout = raw.layout === 'free' ? ('free' as const) : undefined;
  const freeGrid =
    layout && [8, 16, 24].includes(raw.freeGrid as number) ? (raw.freeGrid as number) : undefined;
  const freeSnap = layout && raw.freeSnap === true ? true : undefined;
  return {
    id: str(raw.id, 100) || `f_${index}`,
    name: str(raw.name) || `Frame ${index + 1}`,
    kitId,
    ...(settings ? { settings } : {}),
    device,
    width: Math.round(clamp(num(raw.width, DEVICES[device].width), 240, 3000)),
    x: num(raw.x, 0),
    y: num(raw.y, 0),
    root: Array.isArray(raw.root) ? raw.root.filter((c): c is string => typeof c === 'string') : [],
    ...(layout ? { layout } : {}),
    ...(freeGrid ? { freeGrid } : {}),
    ...(freeSnap ? { freeSnap } : {}),
    ...(reference ? { reference } : {}),
  };
}

const PLACEMENTS = ['over', 'behind', 'beside'] as const;

/** A frame's reference image settings, or undefined when missing or damaged. The image itself is checked later. */
function cleanReference(raw: unknown): FrameReference | undefined {
  if (!isObject(raw)) return undefined;
  const imageId = str(raw.imageId, 100);
  if (!imageId || FORBIDDEN_KEYS.has(imageId)) return undefined;
  const placement = PLACEMENTS.find((p) => p === raw.placement) ?? 'over';
  return {
    imageId,
    opacity: clamp(num(raw.opacity, 0.4), 0, 1),
    placement,
    fit: raw.fit === 'actual' ? 'actual' : 'width',
    offsetX: clamp(num(raw.offsetX, 0), -20000, 20000),
    offsetY: clamp(num(raw.offsetY, 0), -20000, 20000),
    visible: raw.visible !== false,
    pixelRatio: clamp(num(raw.pixelRatio, 1), 0.1, 8),
  };
}

/** Turn untrusted data into a document, or throw a `FileError`. */
export function validateDoc(raw: unknown): MockupDoc {
  if (!isObject(raw)) throw new FileError('This isn’t a mockup file.');
  if (typeof raw.version === 'number' && raw.version > DOC_VERSION) {
    throw new FileError(
      'This file was made with a newer version of the app. Open it with the latest version.',
    );
  }
  if (typeof raw.version !== 'number')
    throw new FileError('This isn’t a mockup file (it has no version).');
  const doc = migrateDoc(raw) as Record<string, unknown>;
  if (doc.version !== DOC_VERSION)
    throw new FileError('This isn’t a mockup file (it has an unknown version).');
  return validateCurrent(doc);
}

const MAX_COMMENTS = 500;

/** Pinned notes: only those on a frame that exists, with sane positions and text. */
function cleanComments(raw: unknown, frameIds: Set<string>): Comment[] {
  if (!Array.isArray(raw)) return [];
  const out: Comment[] = [];
  const seen = new Set<string>();
  for (const c of raw.slice(0, MAX_COMMENTS)) {
    if (!isObject(c)) continue;
    const id = str(c.id, 100);
    const frameId = str(c.frameId, 100);
    if (!id || !frameId || seen.has(id) || FORBIDDEN_KEYS.has(id) || !frameIds.has(frameId))
      continue;
    seen.add(id);
    out.push({
      id,
      frameId,
      x: clamp(num(c.x, 0), -20000, 20000),
      y: clamp(num(c.y, 0), -20000, 20000),
      text: typeof c.text === 'string' ? c.text.slice(0, 2000) : '',
      resolved: c.resolved === true,
      createdAt: num(c.createdAt, 0),
    });
  }
  return out;
}

function validateCurrent(raw: Record<string, unknown>): MockupDoc {
  if (!Array.isArray(raw.frames)) throw new FileError('This mockup has no frames.');
  if (raw.frames.length > MAX_FRAMES)
    throw new FileError('This mockup has too many frames to open.');

  const images = cleanImages(raw.images);
  // A reference whose image is missing is dropped, not left pointing at nothing.
  const frames = raw.frames.map(cleanFrame).map((f) => {
    if (!f.reference || images[f.reference.imageId]) return f;
    const { reference: _gone, ...rest } = f; // eslint-disable-line @typescript-eslint/no-unused-vars
    return rest;
  });
  if (new Set(frames.map((f) => f.id)).size !== frames.length)
    throw new FileError('The file’s frames are damaged (two share an id).');
  const nodes = cleanTree(
    raw.nodes,
    frames.map((f) => f.root),
    frames.map((f) => f.kitId),
    frames.map((f) => f.layout === 'free'),
  );
  const comments = cleanComments(raw.comments, new Set(frames.map((f) => f.id)));
  const view = isObject(raw.view) ? raw.view : {};
  const defaultKitId = hasKit(str(raw.defaultKitId, 40) ?? '') ? str(raw.defaultKitId, 40)! : 'nsw';
  const kitVersions: Record<string, string> = {};
  if (isObject(raw.kitVersions))
    for (const [k, v] of Object.entries(raw.kitVersions))
      if (!FORBIDDEN_KEYS.has(k) && typeof v === 'string')
        kitVersions[k.slice(0, 40)] = v.slice(0, 40);
  const kitSettings: Record<string, Record<string, unknown>> = {};
  if (isObject(raw.kitSettings))
    for (const [k, v] of Object.entries(raw.kitSettings)) {
      const clean = FORBIDDEN_KEYS.has(k) ? undefined : cleanSettings(v);
      if (clean) kitSettings[k.slice(0, 40)] = clean;
    }

  return {
    version: DOC_VERSION,
    id: str(raw.id, 100) || `doc_${Date.now().toString(36)}`,
    name: str(raw.name) || 'Untitled mockup',
    defaultKitId,
    kitVersions,
    kitSettings,
    view: { x: num(view.x, 80), y: num(view.y, 80), zoom: clamp(num(view.zoom, 1), 0.1, 4) },
    frames,
    nodes,
    ...(comments.length ? { comments } : {}),
    ...(typeof raw.startFrameId === 'string' && frames.some((f) => f.id === raw.startFrameId)
      ? { startFrameId: raw.startFrameId as string }
      : {}),
    images,
  };
}

export function validateTemplate(raw: unknown): SavedTemplate {
  if (!isObject(raw)) throw new FileError('A saved template is damaged.');
  const frame = cleanFrame({ ...raw, id: 'template', name: raw.name }, 0);
  const nodes = cleanTree(raw.nodes, [frame.root], [frame.kitId]);
  return {
    id: str(raw.id, 100) || `tpl_${Date.now().toString(36)}`,
    name: str(raw.name) || 'Untitled template',
    createdAt: num(raw.createdAt, Date.now()),
    device: frame.device,
    width: frame.width,
    kitId: frame.kitId,
    ...(frame.settings ? { settings: frame.settings } : {}),
    root: frame.root,
    nodes,
    images: cleanImages(raw.images),
    ...(typeof raw.thumbnail === 'string' &&
    raw.thumbnail.startsWith('data:image/png;base64,') &&
    raw.thumbnail.length < 400_000
      ? { thumbnail: raw.thumbnail }
      : {}),
  };
}

export interface MockupFile {
  doc: MockupDoc;
  templates: SavedTemplate[];
  /** The user's saved components (Milestone G2). */
  components: SavedComponent[];
}

/** Check a saved component read from storage or an opened file. */
export function validateSavedComponent(raw: unknown): SavedComponent {
  if (!isObject(raw)) throw new FileError('A saved component is damaged.');
  const kitId = str(raw.kitId, 40) ?? 'nsw';
  if (!hasKit(kitId)) throw new FileError('A saved component uses an unknown style kit.');
  const rootId = str(raw.rootId, 100);
  if (!rootId || !isObject(raw.nodes) || !isObject(raw.nodes[rootId]))
    throw new FileError('A saved component has no content.');
  const isComponent = raw.nodes[rootId].type === 'component';
  // A component sits on its own (as on a freeform frame); a section is checked against the kit's layers.
  const nodes = cleanTree(raw.nodes, [[rootId]], [kitId], [isComponent]);
  const top = nodes[rootId]!;
  if (top.type !== 'component' && top.type !== 'section')
    throw new FileError('A saved component must be a component or a section.');
  return {
    id: str(raw.id, 100) || `cmp_${Date.now().toString(36)}`,
    name: str(raw.name) || 'Untitled component',
    createdAt: num(raw.createdAt, Date.now()),
    kitId,
    rootId,
    nodes,
    images: cleanImages(raw.images),
  };
}

/** The on-disk format of a `.mockup.json`: the document, with images embedded, plus the user's templates. */
export function serialiseMockupFile(
  doc: MockupDoc,
  templates: SavedTemplate[] = [],
  savedAt: string = new Date().toISOString(),
  components: SavedComponent[] = [],
): string {
  return JSON.stringify(
    { app: FILE_APP, fileVersion: FILE_VERSION, savedAt, doc, templates, components },
    null,
    1,
  );
}

export function parseMockupFile(text: string): MockupFile {
  if (text.length > MAX_FILE_BYTES) throw new FileError('That file is too large to open.');
  let raw: unknown;
  try {
    raw = safeJsonParse(text);
  } catch (err) {
    if (err instanceof FileError) throw err;
    throw new FileError('That file isn’t a mockup file (it isn’t valid JSON).');
  }
  if (!isObject(raw)) throw new FileError('That file isn’t a mockup file.');
  // Accept both the envelope and a bare document.
  const docRaw = isOurFile(raw.app) ? raw.doc : raw;
  const doc = validateDoc(docRaw);
  const templates: SavedTemplate[] = [];
  if (isOurFile(raw.app) && Array.isArray(raw.templates)) {
    for (const t of raw.templates.slice(0, 500)) {
      try {
        templates.push(validateTemplate(t));
      } catch {
        /* skip a damaged template rather than refuse the whole file */
      }
    }
  }
  const components: SavedComponent[] = [];
  if (isOurFile(raw.app) && Array.isArray(raw.components)) {
    for (const c of raw.components.slice(0, 500)) {
      try {
        components.push(validateSavedComponent(c));
      } catch {
        /* skip a damaged component */
      }
    }
  }
  return { doc, templates, components };
}
