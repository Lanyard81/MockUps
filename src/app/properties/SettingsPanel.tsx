import type { SettingContext, SettingDef, SettingOption } from '../../kits/types';
import { CommitInput, Field, Section, Segmented, Toggle } from './controls';

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
      return (
        <>
          <div className="swatches" role="group" aria-label={def.label}>
            {def.options.map((o) => (
              <button
                key={o.id}
                className={`swatch${current === o.id ? ' is-active' : ''}`}
                style={{ background: o.swatch }}
                aria-pressed={current === o.id}
                aria-label={o.label}
                title={why(o) ?? o.title ?? o.label}
                disabled={disabled || (why(o) !== null && current !== o.id)}
                onClick={() => commit(o.id)}
              />
            ))}
          </div>
          <p className="prop-hint">{def.options.find((o) => o.id === current)?.label}</p>
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
            value={asString(value, String(def.default ?? '#000000'))}
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
  /** Everything but `values`: the frame's settings, the kit's settings and the frame's top-level nodes. */
  context: Omit<SettingContext, 'values'>;
  onChange: (key: string, value: unknown) => void;
}) {
  const ctx: SettingContext = { ...context, values };
  const groups: { title: string; hint?: string; defs: SettingDef[] }[] = [];
  for (const def of defs) {
    let g = groups.find((x) => x.title === def.group);
    if (!g) groups.push((g = { title: def.group, defs: [] }));
    g.hint ??= def.hint;
    g.defs.push(def);
  }
  return (
    <>
      {groups.map((g) => (
        <Section key={g.title} title={g.title} hint={g.hint}>
          {g.defs.map((def) => {
            const reason = def.unavailable?.(ctx) ?? null;
            return (
              <div key={def.key}>
                <Control
                  def={def}
                  value={values[def.key]}
                  disabled={reason !== null}
                  ctx={ctx}
                  onChange={(v) => onChange(def.key, v)}
                />
                {reason && <p className="prop-hint prop-hint--warn">{reason}</p>}
              </div>
            );
          })}
        </Section>
      ))}
    </>
  );
}
