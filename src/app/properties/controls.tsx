import { useState, type ReactNode } from 'react';

/** Shared building blocks for the properties panel. */

export function Section({
  title,
  children,
  hint,
}: {
  title: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <section className="prop-section">
      <h3 className="prop-section__title">{title}</h3>
      {hint && <p className="prop-hint">{hint}</p>}
      {children}
    </section>
  );
}

export function Field({
  label,
  children,
  htmlFor,
}: {
  label: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="prop-field">
      <label className="prop-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

/** A text box that changes the document once, when the user finishes (Enter or leaving it). Esc undoes typing. */
export function CommitInput({
  id,
  value,
  onCommit,
  multiline = false,
  placeholder,
  label,
}: {
  id?: string;
  value: string;
  onCommit: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  label?: string;
}) {
  // Remount when the stored value changes elsewhere (undo, another control), so the box shows it.
  const [draftKey, setDraftKey] = useState(0);
  const common = {
    id,
    key: `${value}:${draftKey}`,
    defaultValue: value,
    placeholder,
    'aria-label': label,
    onBlur: (e: React.FocusEvent<HTMLInputElement & HTMLTextAreaElement>) => {
      if (e.currentTarget.value !== value) onCommit(e.currentTarget.value);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement & HTMLTextAreaElement>) => {
      e.stopPropagation(); // typing in a field must not trigger canvas shortcuts
      if (e.key === 'Enter' && (!multiline || !e.shiftKey)) {
        e.preventDefault();
        e.currentTarget.blur();
      } else if (e.key === 'Escape') {
        e.currentTarget.value = value;
        setDraftKey((k) => k + 1);
        e.currentTarget.blur();
      }
    },
  };
  return multiline ? <textarea rows={3} {...common} /> : <input type="text" {...common} />;
}

export function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="prop-toggle">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented segmented--block" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          className={value === o.id ? 'is-active' : ''}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function titleCase(key: string): string {
  return key
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}
