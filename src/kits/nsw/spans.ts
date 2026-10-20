/**
 * Column widths per breakpoint. A column's `props.spans` maps a breakpoint to a width out of 12;
 * a breakpoint left out inherits from the one below it, exactly as the NSW grid classes do
 * (`nsw-col-N`, `nsw-col-sm-N`, `nsw-col-md-N`, ...).
 */
export const BREAKPOINTS = [
  { id: 'base', label: 'Phone', cls: 'nsw-col-' },
  { id: 'sm', label: 'Small', cls: 'nsw-col-sm-' },
  { id: 'md', label: 'Medium', cls: 'nsw-col-md-' },
  { id: 'lg', label: 'Large', cls: 'nsw-col-lg-' },
  { id: 'xl', label: 'Wide', cls: 'nsw-col-xl-' },
] as const;

export type BreakpointId = (typeof BREAKPOINTS)[number]['id'];
export type Spans = Partial<Record<BreakpointId, number>>;

const clamp = (n: number) => Math.min(12, Math.max(1, Math.round(n)));

export function readSpans(props: Record<string, unknown> | undefined): Spans {
  const raw = props?.spans;
  if (!raw || typeof raw !== 'object') return { base: 12 };
  const out: Spans = {};
  for (const bp of BREAKPOINTS) {
    const v = (raw as Record<string, unknown>)[bp.id];
    if (typeof v === 'number' && Number.isFinite(v)) out[bp.id] = clamp(v);
  }
  return { base: 12, ...out };
}

/** NSW class names for a column's spans. */
export function columnClasses(props: Record<string, unknown> | undefined): string {
  const spans = readSpans(props);
  const classes = ['nsw-col'];
  for (const bp of BREAKPOINTS) {
    const v = spans[bp.id];
    if (v !== undefined) classes.push(`${bp.cls}${v}`);
  }
  return classes.join(' ');
}

/** The width a column has at a breakpoint, after inheriting from smaller screens. */
export function effectiveSpan(spans: Spans, bp: BreakpointId): number {
  let value = 12;
  for (const b of BREAKPOINTS) {
    if (spans[b.id] !== undefined) value = spans[b.id]!;
    if (b.id === bp) break;
  }
  return value;
}

/** Equal widths for `count` columns from the medium breakpoint up. */
export function equalSpans(count: number): Spans {
  return { base: 12, md: Math.max(1, Math.floor(12 / Math.max(1, count))) };
}
