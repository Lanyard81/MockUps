import { useState, type ReactNode } from 'react';

/** Shared building blocks for the properties panel. */

/** Which collapsible sections the person has opened, kept for the session so they stay as left. */
const openSections = new Map<string, boolean>();

export function Section({
  title,
  children,
  hint,
  collapsible = false,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  hint?: string;
  /** Specialist groups start closed; the person's choice is remembered. */
  collapsible?: boolean;
  /** Start open (until the person closes it), e.g. when the group already holds something. */
  defaultOpen?: boolean;
}) {
  if (collapsible)
    return (
      <details
        className="prop-section prop-section--collapsible"
        open={openSections.get(title) ?? defaultOpen}
        onToggle={(e) => openSections.set(title, e.currentTarget.open)}
      >
        <summary className="prop-section__title">{title}</summary>
        {hint && <p className="prop-hint">{hint}</p>}
        {children}
      </details>
    );
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
  options: { id: T; label: string; title?: string; disabled?: boolean }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented segmented--block" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          className={value === o.id ? 'is-active' : ''}
          aria-pressed={value === o.id}
          title={o.title}
          disabled={o.disabled && value !== o.id}
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
    .replace(/^g(\d+)/i, 'group $1 ')
    .replace(/([a-z])(\d)/gi, '$1 $2')
    .replace(/(\d)([a-z])/gi, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[-_]/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}
