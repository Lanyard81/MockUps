import { getComponent, kitOfComponent } from '../../catalogue';
import { KIT_PANELS } from '../kitPanels';
import type { OptionDef } from '../../catalogue/types';
import { getFrameElement } from '../../canvas/registry';
import { copySelectionHtml } from '../../export/copy';
import { describeVariant, optionsForVariant } from '../../layout/component';
import { measureFitBox } from '../../lib/textFit';
import { sideBySideChoices } from '../../layout/ops';
import { getKit } from '../../kits';
import { useStore } from '../../store/store';
import { FreePosition } from './FreeProps';
import { ImageField } from './ImageField';
import { NodeSettings } from './NodeSettings';
import { IconPicker, type IconValue } from './IconPicker';
import { SlotIconPicker } from './SlotIconPicker';
import { CommitInput, Field, Section, Segmented, Toggle, titleCase } from './controls';
import { Icon } from '../Icon';

/** A stable empty list: a selector must not return a fresh array each time, or React loops forever. */
const NO_KEYS: string[] = [];
const NO_OPTIONS: OptionDef[] = [];

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
  const transition = useStore((s) => s.doc.nodes[nodeId]?.props?.transition);
  const frames = useStore((s) => s.doc.frames);
  const target = typeof goto === 'string' ? goto : '';
  const exists = frames.some((f) => f.id === target);
  return (
    <>
      <Field label="Go to page">
        <select
          aria-label="Go to page"
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
      {exists && (
        <Field label="Transition">
          <select
            aria-label="Transition"
            value={typeof transition === 'string' ? transition : ''}
            onChange={(e) =>
              useStore.getState().setNodeProps(nodeId, { transition: e.target.value || undefined })
            }
          >
            <option value="">None</option>
            <option value="fade">Fade</option>
            <option value="slide">Slide in</option>
            <option value="rise">Rise</option>
          </select>
        </Field>
      )}
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
    case 'choice':
      return (
        <Field label={opt.label}>
          <select
            aria-label={opt.label}
            value={typeof value === 'string' ? value : opt.choices[0]!.id}
            onChange={(e) =>
              set(e.target.value === opt.choices[0]!.id ? undefined : e.target.value)
            }
          >
            {opt.choices.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      );
    case 'iconSlot':
      return (
        <Field label={opt.label}>
          <SlotIconPicker
            nodeId={nodeId}
            label={opt.label}
            value={typeof value === 'string' ? value : null}
            onChange={(v) => set(v ?? undefined)}
          />
        </Field>
      );
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
  const truncated = useStore((s) =>
    (s.fitWarnings[frameId] ?? []).some((w) => w.nodeId === nodeId && w.key === textKey),
  );
  const st = useStore.getState;
  const current = text ?? def.default;

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
      {truncated && (
        <span
          className="warn-badge"
          role="status"
          title="Even at the smallest size this text doesn’t fit, so it is cut off with an ellipsis."
        >
          <Icon name="warning" size={12} /> Text is cut off
        </span>
      )}
    </div>
  );
}

/** One switch for the whole component: every text part shrinks to stay inside the space it has now. */
function ShrinkToFit({
  nodeId,
  frameId,
  keys,
}: {
  nodeId: string;
  frameId: string;
  keys: string[];
}) {
  const on = useStore((s) => keys.every((k) => s.doc.nodes[nodeId]?.textFit?.[k] === 'shrink'));
  const toggle = (next: boolean) => {
    const st = useStore.getState();
    const parts: Record<string, { width: number; height: number } | null> = {};
    for (const key of keys) {
      if (!next) {
        parts[key] = null;
        continue;
      }
      // Record each element's present size: that is the box its text will be fitted into.
      const el = getFrameElement(frameId)?.contentDocument?.querySelector<HTMLElement>(
        `[data-node="${nodeId}"] [data-edit="${key}"]`,
      );
      const rect = el ? measureFitBox(el) : null;
      if (rect && rect.width >= 1 && rect.height >= 1) parts[key] = rect;
    }
    if (Object.keys(parts).length === 0)
      return st.setNotice('That text isn’t visible, so its size can’t be measured.');
    st.setTextFitMany(nodeId, parts);
  };
  return (
    <div className="text-field__fit">
      <Toggle label="Shrink text to fit" checked={on} onChange={toggle} />
    </div>
  );
}

/** "Space above": how far this item sits below the one before it, using the kit's own spacing classes. */
function SpaceAbove({ nodeId, frameId }: { nodeId: string; frameId: string }) {
  const kitId = useStore((s) => s.doc.frames.find((f) => f.id === frameId)?.kitId);
  const free = useStore((s) => s.doc.frames.find((f) => f.id === frameId)?.layout === 'free');
  const value = useStore((s) => s.doc.nodes[nodeId]?.props?.spaceAbove);
  const spacing = getKit(kitId).spacing;
  if (!spacing || free) return null;
  const current =
    typeof value === 'string' && spacing.options.some((o) => o.id === value) ? value : 'auto';
  return (
    <Section
      title="Space above"
      hint="Automatic gives section headings room above them. Choose a size to set it yourself."
    >
      <Segmented
        label="Space above"
        value={current}
        options={[
          { id: 'auto', label: 'Auto' },
          ...spacing.options.map((o) => ({ id: o.id, label: o.label })),
        ]}
        onChange={(v) =>
          useStore.getState().setNodeProps(nodeId, { spaceAbove: v === 'auto' ? undefined : v })
        }
      />
    </Section>
  );
}

/** "Side by side": put this item and the next ones in its column across the page. */
function SideBySide({ nodeId }: { nodeId: string }) {
  const doc = useStore((s) => s.doc);
  const choices = sideBySideChoices(doc, nodeId);
  if (choices.length === 0) return null;
  return (
    <Section
      title="Side by side"
      collapsible
      hint="Put this item and the ones after it in this column next to each other, across the page."
    >
      <div className="segmented segmented--block" role="group" aria-label="Items across">
        {choices.map((n) => (
          <button key={n} onClick={() => useStore.getState().arrangeInRow(nodeId, n)}>
            {n} across
          </button>
        ))}
      </div>
    </Section>
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
  const options = variant && comp ? optionsForVariant(variant.html, comp.options) : NO_OPTIONS;
  const st = useStore.getState;
  if (!node || !comp || !variant || !parts) return null;
  const KitPanel = KIT_PANELS[kitOfComponent(comp.id) ?? '']?.component?.[comp.id];

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

      {parts.editable.length > 0 && (
        <Section
          title="Text"
          hint="Double-click text on the canvas to edit it in place, or edit it here."
        >
          {parts.editable.map((f) => (
            <TextField key={f.key} nodeId={nodeId} frameId={frameId} textKey={f.key} def={f} />
          ))}
          <ShrinkToFit nodeId={nodeId} frameId={frameId} keys={parts.editable.map((f) => f.key)} />
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

      <NodeSettings nodeId={nodeId} frameId={frameId} />
      {KitPanel && <KitPanel nodeId={nodeId} />}

      {options.length > 0 && (
        <Section title="Options">
          {options.map((opt) => (
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

      <SpaceAbove nodeId={nodeId} frameId={frameId} />
      <FreePosition nodeId={nodeId} />
      <SideBySide nodeId={nodeId} />
      <div className="prop-actions">
        <button
          className="btn"
          title="Keep this to add to any page later"
          onClick={() => st().setDialog('saveComponent', frameId, nodeId)}
        >
          Save as component…
        </button>
      </div>
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
