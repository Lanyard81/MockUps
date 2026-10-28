import type { SettingContext, SettingDef, SettingOption } from '../../kits/types';
import { CommitInput, Field, Section, Segmented, Toggle } from './controls';

const COLOUR_INPUT_DEFAULT = '#000000'; // token-ok: the colour input's own starting value, not a style
const asString = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);

/** One kit setting, drawn from its definition. A setting that can't apply says why and is disabled. */
function Control({
  def,
  value,
  disabled,
  ctx,
  onChange,
}: {
  def: SettingDef;
  value: unknown;
  disabled: boolean;
  ctx: SettingContext;
  onChange: (v: unknown) => void;
}) {
  /** Why an option can't be chosen here, or null. A chosen option that became unavailable stays visible. */
  const why = (o: SettingOption) => o.unavailable?.(ctx) ?? null;
  // A value equal to the default is stored as "not set", so documents stay small and defaults can change.
  const commit = (v: unknown) =>
    onChange(v === def.default && !('keepDefault' in def && def.keepDefault) ? undefined : v);
  switch (def.type) {
    case 'swatches': {
      const current = asString(value, String(def.default ?? def.options[0]?.id));
      // A few choices get their names written under them; a long row shows just the chosen name.
      const named = def.options.length <= 5;
      return (
        <>
          <div
            className={`swatches${named ? ' swatches--named' : ''}`}
            role="group"
            aria-label={def.label}
          >
            {def.options.map((o) => {
              const button = (
                <button
                  key={o.id}
                  className={`swatch${current === o.id ? ' is-active' : ''}`}
                  style={{ background: typeof o.swatch === 'function' ? o.swatch(ctx) : o.swatch }}
                  aria-pressed={current === o.id}
                  aria-label={o.label}
                  title={why(o) ?? o.title ?? o.label}
                  disabled={disabled || (why(o) !== null && current !== o.id)}
                  onClick={() => commit(o.id)}
                />
              );
              return named ? (
                <div key={o.id} className="swatch-cell">
                  {button}
                  <span className="swatch-cell__name" aria-hidden="true">
                    {o.label}
                  </span>
                </div>
              ) : (
                button
              );
            })}
          </div>
          {!named && (
            <p className="prop-hint">{def.options.find((o) => o.id === current)?.label}</p>
          )}
        </>
      );
    }
    case 'segmented':
      return (
        <Segmented
          label={def.label}
          value={asString(value, String(def.default ?? def.options[0]?.id))}
          options={def.options.map((o) => ({
            id: o.id,
            label: o.label,
            title: why(o) ?? o.title,
            disabled: why(o) !== null,
          }))}
          onChange={disabled ? () => undefined : commit}
        />
      );
    case 'select':
      return (
        <Field label={def.label}>
          <select
            aria-label={def.label}
            disabled={disabled}
            value={asString(value, String(def.default ?? def.options[0]?.id))}
            onChange={(e) => commit(e.target.value)}
          >
            {def.options.map((o) => (
              <option key={o.id} value={o.id} disabled={why(o) !== null} title={why(o) ?? o.title}>
                {o.label}
                {why(o) ? ` (${why(o)})` : ''}
              </option>
            ))}
          </select>
        </Field>
      );
    case 'toggle':
      return (
        <Toggle
          label={def.label}
          checked={typeof value === 'boolean' ? value : def.default === true}
          disabled={disabled}
          onChange={(v) => commit(v)}
        />
      );
    case 'text':
      return (
        <Field label={def.label}>
          <CommitInput
            label={def.label}
            value={asString(value, String(def.default ?? ''))}
            placeholder={def.placeholder}
            multiline={def.multiline}
            onCommit={(v) => onChange(v.trim() === '' ? undefined : v)}
          />
        </Field>
      );
    case 'color':
      return (
        <Field label={def.label}>
          <input
            type="color"
            aria-label={def.label}
            disabled={disabled}
            value={asString(value, String(def.default ?? COLOUR_INPUT_DEFAULT))}
            onChange={(e) => commit(e.target.value)}
          />
        </Field>
      );
    case 'number':
      return (
        <Field label={def.label}>
          <input
            type="number"
            aria-label={def.label}
            disabled={disabled}
            min={def.min}
            max={def.max}
            step={def.step ?? 1}
            value={typeof value === 'number' ? value : Number(def.default ?? def.min)}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) commit(Math.min(def.max, Math.max(def.min, n)));
            }}
          />
        </Field>
      );
  }
}

/** The Properties panel for a set of kit settings: grouped, with the reason shown when one is unavailable. */
export function SettingsPanel({
  defs,
  values,
  context,
  onChange,
}: {
  defs: SettingDef[];
  values: Record<string, unknown>;
  /** Everything but `values`: the frame's settings, the kit's settings and the page's top-level nodes. */
  context: Omit<SettingContext, 'values'>;
  onChange: (key: string, value: unknown, def: SettingDef) => void;
}) {
  const ctx: SettingContext = { ...context, values };
  const groups: { title: string; defs: SettingDef[] }[] = [];
  for (const def of defs) {
    let g = groups.find((x) => x.title === def.group);
    if (!g) groups.push((g = { title: def.group, defs: [] }));
    g.defs.push(def);
  }
  return (
    <>
      {groups.map((g) => {
        const rows = g.defs.map((def) => ({ def, reason: def.unavailable?.(ctx) ?? null }));
        // A group where nothing can be changed says why once, in a line, instead of a wall of disabled controls.
        if (rows.every((r) => r.reason)) {
          const reasons = [...new Set(rows.map((r) => r.reason))];
          return (
            <Section key={g.title} title={g.title}>
              {reasons.map((r) => (
                <p key={r} className="prop-hint prop-hint--warn">
                  {r}
                </p>
              ))}
            </Section>
          );
        }
        // Several controls in a row with the same reason share one line of it.
        const shown: ((typeof rows)[number] | { collapsed: string })[] = [];
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i]!;
          let j = i;
          while (j + 1 < rows.length && r.reason && rows[j + 1]!.reason === r.reason) j++;
          if (r.reason && j > i) {
            shown.push({ collapsed: r.reason });
            i = j;
          } else shown.push(r);
        }
        return (
          <Section key={g.title} title={g.title}>
            {shown.map((item) => {
              if ('collapsed' in item)
                return (
                  <p key={item.collapsed} className="prop-hint prop-hint--warn">
                    {item.collapsed}
                  </p>
                );
              const { def, reason } = item;
              if (reason && def.hideWhenUnavailable) return null;
              return (
                <div key={def.key}>
                  <Control
                    def={def}
                    value={def.current ? def.current(ctx) : values[def.key]}
                    disabled={reason !== null}
                    ctx={ctx}
                    onChange={(v) => onChange(def.key, v, def)}
                  />
                  {def.hint && <p className="prop-hint">{def.hint}</p>}
                  {reason && <p className="prop-hint prop-hint--warn">{reason}</p>}
                </div>
              );
            })}
          </Section>
        );
      })}
    </>
  );
}
