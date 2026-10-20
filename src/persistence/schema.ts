import { canContain } from '../layout/ops';
import {
  DEVICES,
  type DeviceId,
  type DocNode,
  type Frame,
  type MockupDoc,
  type NodeType,
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
export const FILE_APP = 'nsw-mockup-builder';
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
export function cleanTree(rawNodes: unknown, roots: string[][]): Record<string, DocNode> {
  if (!isObject(rawNodes)) throw new FileError('The file has no layout.');
  const keys = Object.keys(rawNodes).filter((k) => !FORBIDDEN_KEYS.has(k));
  if (keys.length > MAX_NODES)
    throw new FileError('The file is too large to open (too many layers).');
  const nodes: Record<string, DocNode> = {};
  for (const k of keys) nodes[k] = cleanNode(k, rawNodes[k]);

  const seen = new Set<string>();
  const visit = (id: string, parent: DocNode | null) => {
    const node = nodes[id];
    if (!node)
      throw new FileError('The file’s layout is damaged (it refers to a layer that is missing).');
    if (seen.has(id)) throw new FileError('The file’s layout is damaged (a layer is used twice).');
    seen.add(id);
    if (!canContain(parent, node)) {
      throw new FileError(
        `The file’s layout breaks the rules (a ${node.type} can’t go inside ${parent ? `a ${parent.type}` : 'a frame'}).`,
      );
    }
    for (const c of node.children ?? []) visit(c, node);
  };
  for (const list of roots) for (const id of list) visit(id, null);

  // Anything not reachable from a frame is leftover: drop it.
  return Object.fromEntries(Object.entries(nodes).filter(([id]) => seen.has(id)));
}

function cleanFrame(raw: unknown, index: number): Frame {
  if (!isObject(raw)) throw new FileError('The file’s frames are damaged.');
  const device = (
    typeof raw.device === 'string' && raw.device in DEVICES ? raw.device : 'custom'
  ) as DeviceId;
  return {
    id: str(raw.id, 100) || `f_${index}`,
    name: str(raw.name) || `Frame ${index + 1}`,
    device,
    width: Math.round(clamp(num(raw.width, DEVICES[device].width), 240, 3000)),
    x: num(raw.x, 0),
    y: num(raw.y, 0),
    root: Array.isArray(raw.root) ? raw.root.filter((c): c is string => typeof c === 'string') : [],
  };
}

/** Turn untrusted data into a document, or throw a `FileError`. */
export function validateDoc(raw: unknown): MockupDoc {
  if (!isObject(raw)) throw new FileError('This isn’t a mockup file.');
  if (typeof raw.version === 'number' && raw.version > FILE_VERSION) {
    throw new FileError(
      'This file was made with a newer version of the app. Open it with the latest version.',
    );
  }
  if (raw.version !== FILE_VERSION)
    throw new FileError('This isn’t a mockup file (it has no version).');
  if (!Array.isArray(raw.frames)) throw new FileError('This mockup has no frames.');
  if (raw.frames.length > MAX_FRAMES)
    throw new FileError('This mockup has too many frames to open.');

  const frames = raw.frames.map(cleanFrame);
  if (new Set(frames.map((f) => f.id)).size !== frames.length)
    throw new FileError('The file’s frames are damaged (two share an id).');
  const nodes = cleanTree(
    raw.nodes,
    frames.map((f) => f.root),
  );
  const view = isObject(raw.view) ? raw.view : {};

  return {
    version: 1,
    id: str(raw.id, 100) || `doc_${Date.now().toString(36)}`,
    name: str(raw.name) || 'Untitled mockup',
    nswVersion: str(raw.nswVersion, 40) ?? '',
    view: { x: num(view.x, 80), y: num(view.y, 80), zoom: clamp(num(view.zoom, 1), 0.25, 4) },
    frames,
    nodes,
    images: cleanImages(raw.images),
  };
}

export function validateTemplate(raw: unknown): SavedTemplate {
  if (!isObject(raw)) throw new FileError('A saved template is damaged.');
  const frame = cleanFrame({ ...raw, id: 'template', name: raw.name }, 0);
  const nodes = cleanTree(raw.nodes, [frame.root]);
  return {
    id: str(raw.id, 100) || `tpl_${Date.now().toString(36)}`,
    name: str(raw.name) || 'Untitled template',
    createdAt: num(raw.createdAt, Date.now()),
    device: frame.device,
    width: frame.width,
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
}

/** The on-disk format of a `.mockup.json`: the document, with images embedded, plus the user's templates. */
export function serialiseMockupFile(doc: MockupDoc, templates: SavedTemplate[] = []): string {
  return JSON.stringify(
    { app: FILE_APP, fileVersion: FILE_VERSION, savedAt: new Date().toISOString(), doc, templates },
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
  const docRaw = raw.app === FILE_APP ? raw.doc : raw;
  const doc = validateDoc(docRaw);
  const templates: SavedTemplate[] = [];
  if (raw.app === FILE_APP && Array.isArray(raw.templates)) {
    for (const t of raw.templates.slice(0, 500)) {
      try {
        templates.push(validateTemplate(t));
      } catch {
        /* skip a damaged template rather than refuse the whole file */
      }
    }
  }
  return { doc, templates };
}
