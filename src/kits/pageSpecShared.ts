import type { DocNode } from '../store/types';

/** A component node as a page spec entry: only what differs from the defaults. Pictures can't be carried. */
export function componentToSpecEntry(node: DocNode): Record<string, unknown> {
  const out: Record<string, unknown> = { component: node.componentId };
  if (node.variant) out.variant = node.variant;
  const text = Object.fromEntries(
    Object.entries(node.text ?? {}).filter(([, v]) => typeof v === 'string'),
  );
  if (Object.keys(text).length) out.text = text;
  const { hiddenParts, images: _images, goto: _goto, ...rest } = node.props ?? {}; // eslint-disable-line @typescript-eslint/no-unused-vars
  const props = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined && v !== false && v !== ''),
  );
  if (Object.keys(props).length) out.props = props;
  if (Array.isArray(hiddenParts) && hiddenParts.length) out.hide = hiddenParts;
  if (node.textFit && Object.keys(node.textFit).length) out.fit = node.textFit;
  if (node.name) out.name = node.name;
  if (node.hidden) out.hidden = true;
  return out;
}
