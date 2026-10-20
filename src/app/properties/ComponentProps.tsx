import { getComponent } from '../../catalogue';
import type { OptionDef } from '../../catalogue/types';
import { getFrameElement } from '../../canvas/registry';
import { copySelectionHtml } from '../../export/copy';
import { describeVariant } from '../../layout/component';
import { measureFitBox } from '../../lib/textFit';
import { useStore } from '../../store/store';
import { ImageField } from './ImageField';
import { NodeSettings } from './NodeSettings';
import { IconPicker, type IconValue } from './IconPicker';
import { CommitInput, Field, Section, Toggle, titleCase } from './controls';

/** A stable empty list: a selector must not return a fresh array each time, or React loops forever. */
const NO_KEYS: string[] = [];

/** A link's destination: another frame in this mockup (click-through in Preview) or an address. */
function LinkControl({
  nodeId,
  opt,
  value,
  set,
}: {
  nodeId: string;
  opt: OptionDef;
  value: unknown;
  set: (v: unknown) => void;
}) {
  const goto = useStore((s) => s.doc.nodes[nodeId]?.props?.goto);
  const frames = useStore((s) => s.doc.frames);
  const target = typeof goto === 'string' ? goto : '';
  const exists = frames.some((f) => f.id === target);
  return (
    <>
      <Field label="Go to frame">
        <select
          aria-label="Go to frame"
          value={exists ? target : ''}
          onChange={(e) =>
            useStore.getState().setNodeProps(nodeId, { goto: e.target.value || undefined })
          }
        >
          <option value="">None (use the address)</option>
          {frames.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </Field>
      {!exists && (
        <Field label={opt.label}>
          <CommitInput
            label={opt.label}
            value={typeof value === 'string' ? value : ''}
            placeholder="https://… or #"
            onCommit={(v) => set(v.trim() || undefined)}
          />
        </Field>
      )}
    </>
  );
}

function OptionControl({ nodeId, opt }: { nodeId: string; opt: OptionDef }) {
  const value = useStore((s) => s.doc.nodes[nodeId]?.props?.[opt.key]);
  const set = (v: unknown) => useStore.getState().setNodeProps(nodeId, { [opt.key]: v });
  switch (opt.type) {
    case 'toggleClass':
    case 'toggleAttr':
      return (
        <Toggle
          label={opt.label}
          checked={value === true}
          onChange={(v) => set(v ? true : undefined)}
        />
      );
    case 'href':
      return <LinkControl nodeId={nodeId} opt={opt} value={value} set={set} />;
    case 'headingLevel':
      return (
        <Field label={opt.label}>
          <select
            aria-label={opt.label}
            value={Number(value ?? opt.default)}
            onChange={(e) =>
              set(Number(e.target.value) === opt.default ? undefined : Number(e.target.value))
            }
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                Heading {n}
                {n === opt.default ? ' (default)' : ''}
              </option>
            ))}
          </select>
        </Field>
      );
    case 'icon':
      return (
        <Field label={opt.label}>
          <IconPicker
            value={(value as IconValue | undefined) ?? null}
            onChange={(v) => set(v ?? undefined)}
          />
        </Field>
      );
  }
}

function TextField({
  nodeId,
  frameId,
  textKey,
  def,
}: {
  nodeId: string;
  frameId: string;
  textKey: string;
  def: { default: string; multiline: boolean };
}) {
  const text = useStore((s) => s.doc.nodes[nodeId]?.text?.[textKey]);
  const fit = useStore((s) => s.doc.nodes[nodeId]?.textFit?.[textKey]);
  const truncated = useStore((s) =>
    (s.fitWarnings[frameId] ?? []).some((w) => w.nodeId === nodeId && w.key === textKey),
  );
  const st = useStore.getState;
  const current = text ?? def.default;

  const toggleFit = (on: boolean) => {
    if (!on) return st().setTextFit(nodeId, textKey, 'natural');
    // Record the element's present size: that is the box the text will be fitted into.
    const el = getFrameElement(frameId)?.contentDocument?.querySelector<HTMLElement>(
      `[data-node="${nodeId}"] [data-edit="${textKey}"]`,
    );
    const rect = el ? measureFitBox(el) : null;
    if (!rect || rect.width < 1 || rect.height < 1)
      return st().setNotice('That text isn’t visible, so its size can’t be measured.');
    st().setTextFit(nodeId, textKey, 'shrink', { width: rect.width, height: rect.height });
  };

  return (
    <div className="text-field">
      <Field label={titleCase(textKey)}>
        <CommitInput
          label={titleCase(textKey)}
          value={current}
          multiline={def.multiline}
          onCommit={(v) =>
            st().setText(nodeId, textKey, def.multiline ? v : v.replace(/\s*\n+\s*/g, ' ').trim())
          }
        />
      </Field>
      <div className="text-field__fit">
        <Toggle label="Shrink text to fit" checked={fit === 'shrink'} onChange={toggleFit} />
        {truncated && (
          <span
            className="warn-badge"
            role="status"
            title="Even at the smallest size this text doesn’t fit, so it is cut off with an ellipsis."
          >
            ⚠ Text is cut off
          </span>
        )}
      </div>
    </div>
  );
}

export function ComponentProps({ nodeId, frameId }: { nodeId: string; frameId: string }) {
  const node = useStore((s) => s.doc.nodes[nodeId]);
  const hidden =
    useStore((s) => s.doc.nodes[nodeId]?.props?.hiddenParts as string[] | undefined) ?? NO_KEYS;
  const comp = node?.componentId ? getComponent(node.componentId) : undefined;
  const variantId = node?.variant ?? comp?.defaultVariant;
  const variant = comp?.variants.find((v) => v.id === variantId) ?? comp?.variants[0];
  const parts = variant ? describeVariant(variant.html) : null;
  const st = useStore.getState;
  if (!node || !comp || !variant || !parts) return null;

  const partLabel = (key: string) =>
    comp.optional.find((o) => o.key === key)?.label ?? titleCase(key);

  return (
    <>
      <Section title={comp.name} hint={comp.fidelity !== 'full' ? comp.note : undefined}>
        {comp.variants.length > 1 && (
          <div className="variant-list" role="group" aria-label="Variant">
            {comp.variants.map((v) => (
              <button
                key={v.id}
                className={`chip${v.id === variant.id ? ' is-active' : ''}`}
                aria-pressed={v.id === variant.id}
                onClick={() => st().setVariant(nodeId, v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </Section>

      <NodeSettings nodeId={nodeId} frameId={frameId} />

      {comp.options.length > 0 && (
        <Section title="Options">
          {comp.options.map((opt) => (
            <OptionControl key={opt.key} nodeId={nodeId} opt={opt} />
          ))}
        </Section>
      )}

      {parts.optional.length > 0 && (
        <Section title="Show or hide">
          {parts.optional.map((key) => (
            <Toggle
              key={key}
              label={partLabel(key)}
              checked={!hidden.includes(key)}
              onChange={(show) =>
                st().setNodeProps(nodeId, {
                  hiddenParts: show ? hidden.filter((k) => k !== key) : [...hidden, key],
                })
              }
            />
          ))}
        </Section>
      )}

      {parts.editable.length > 0 && (
        <Section
          title="Text"
          hint="Double-click text on the canvas to edit it in place, or edit it here."
        >
          {parts.editable.map((f) => (
            <TextField key={f.key} nodeId={nodeId} frameId={frameId} textKey={f.key} def={f} />
          ))}
        </Section>
      )}

      {parts.images.length > 0 && (
        <Section
          title="Images"
          hint="Drop an image file onto the picture on the canvas, or onto a box below."
        >
          {parts.images.map((key) => (
            <ImageField key={key} nodeId={nodeId} imageKey={key} label={titleCase(key)} />
          ))}
        </Section>
      )}

      <div className="prop-actions">
        <button
          className="btn"
          onClick={() => st().duplicateNode(nodeId)}
          title="Duplicate (Ctrl/⌘ D)"
        >
          Duplicate
        </button>
        <button
          className="btn"
          onClick={() => void copySelectionHtml(nodeId)}
          title="Copy the HTML for developers"
        >
          Copy HTML
        </button>
        <button
          className="btn btn--danger"
          onClick={() => st().deleteNode(nodeId)}
          title="Delete (Delete key). Undo brings it back."
        >
          Delete
        </button>
      </div>
    </>
  );
}
