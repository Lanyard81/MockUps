import { Section } from '../../app/properties/controls';
import { useStore } from '../../store/store';
import { BREAKPOINTS, effectiveSpan, readSpans, type BreakpointId } from './spans';

/** A stable empty list: a selector must not return a fresh array each time, or React loops forever. */
const NO_IDS: string[] = [];

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
