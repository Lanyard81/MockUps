import { BREAKPOINTS, effectiveSpan, readSpans, type BreakpointId } from '../../layout/spans';
import { SECTION_BACKGROUNDS, SECTION_PADDINGS, type SectionPadding } from '../../layout/sections';
import { useStore } from '../../store/store';
import { Section, Segmented, Toggle } from './controls';

/** A stable empty list: a selector must not return a fresh array each time, or React loops forever. */
const NO_IDS: string[] = [];

export function SectionProps({ nodeId }: { nodeId: string }) {
  const props = useStore((s) => s.doc.nodes[nodeId]?.props);
  const st = useStore.getState;
  const bg = (props?.background as string | undefined) ?? 'white';
  const padding = ((props?.padding as SectionPadding | undefined) ?? 'default') as SectionPadding;
  return (
    <>
      <Section
        title="Background"
        hint="NSW section backgrounds. Text colours adjust on dark backgrounds."
      >
        <div className="swatches" role="group" aria-label="Section background">
          {SECTION_BACKGROUNDS.map((b) => (
            <button
              key={b.id}
              className={`swatch${bg === b.id ? ' is-active' : ''}`}
              style={{ background: b.swatch }}
              aria-pressed={bg === b.id}
              aria-label={b.label}
              title={b.label}
              onClick={() => st().setNodeProps(nodeId, { background: b.id })}
            />
          ))}
        </div>
        <p className="prop-hint">{SECTION_BACKGROUNDS.find((b) => b.id === bg)?.label}</p>
      </Section>
      <Section title="Padding">
        <Segmented
          label="Section padding"
          value={padding}
          options={SECTION_PADDINGS.map((p) => ({ id: p.id, label: p.label }))}
          onChange={(v) => st().setNodeProps(nodeId, { padding: v === 'default' ? undefined : v })}
        />
      </Section>
    </>
  );
}

export function ContainerProps({ nodeId }: { nodeId: string }) {
  const flush = useStore((s) => s.doc.nodes[nodeId]?.props?.flush === true);
  return (
    <Section title="Container">
      <Toggle
        label="Edge to edge (no side padding)"
        checked={flush}
        onChange={(v) => useStore.getState().setNodeProps(nodeId, { flush: v ? true : undefined })}
      />
    </Section>
  );
}

/** Rows are columns, columns are breakpoints. A dash means "same as the smaller screen". */
function WidthTable({ columnIds }: { columnIds: string[] }) {
  const nodes = useStore((s) => s.doc.nodes);
  const set = useStore.getState().setColumnSpan;
  return (
    <div className="width-table" role="table" aria-label="Column widths">
      <div className="width-table__row width-table__head" role="row">
        <span role="columnheader" />
        {BREAKPOINTS.map((b) => (
          <span
            key={b.id}
            role="columnheader"
            title={b.id === 'base' ? 'Phone and up' : `${b.label} screens and up`}
          >
            {b.label}
          </span>
        ))}
      </div>
      {columnIds.map((id, i) => {
        const spans = readSpans(nodes[id]?.props);
        return (
          <div key={id} className="width-table__row" role="row">
            <span role="rowheader">Col {i + 1}</span>
            {BREAKPOINTS.map((b) => {
              const own = spans[b.id];
              return (
                <select
                  key={b.id}
                  aria-label={`Column ${i + 1} width at ${b.label}`}
                  value={own ?? ''}
                  onChange={(e) =>
                    set(
                      id,
                      b.id as BreakpointId,
                      e.target.value === '' ? null : Number(e.target.value),
                    )
                  }
                >
                  {b.id !== 'base' && <option value="">— {effectiveSpan(spans, b.id)}</option>}
                  {Array.from({ length: 12 }, (_, n) => n + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export function GridProps({ nodeId }: { nodeId: string }) {
  const columns = useStore((s) => s.doc.nodes[nodeId]?.children) ?? NO_IDS;
  const nodes = useStore((s) => s.doc.nodes);
  const st = useStore.getState;
  const medium = columns.reduce(
    (sum, id) => sum + effectiveSpan(readSpans(nodes[id]?.props), 'md'),
    0,
  );
  return (
    <>
      <Section title="Columns">
        <div className="stepper">
          <button
            className="btn btn--icon"
            aria-label="Fewer columns"
            disabled={columns.length <= 1}
            onClick={() => st().setGridColumns(nodeId, columns.length - 1)}
          >
            −
          </button>
          <output aria-live="polite" aria-label="Number of columns">
            {columns.length}
          </output>
          <button
            className="btn btn--icon"
            aria-label="More columns"
            disabled={columns.length >= 6}
            onClick={() => st().setGridColumns(nodeId, columns.length + 1)}
          >
            +
          </button>
          <button
            className="btn"
            onClick={() => st().setGridColumns(nodeId, columns.length)}
            title="Reset all widths to equal"
          >
            Equal widths
          </button>
        </div>
        <p className="prop-hint">
          Removing a column moves its content into the last column that stays.
        </p>
      </Section>
      <Section
        title="Column widths"
        hint="Out of 12, per screen size. Columns stack on phones unless a phone width is set."
      >
        <WidthTable columnIds={columns} />
        {medium !== 12 && (
          <p className="prop-hint prop-hint--warn">Medium widths add up to {medium}, not 12.</p>
        )}
      </Section>
    </>
  );
}

export function ColumnProps({ nodeId }: { nodeId: string }) {
  return (
    <Section title="Column width" hint="Out of 12, per screen size.">
      <WidthTable columnIds={[nodeId]} />
    </Section>
  );
}
