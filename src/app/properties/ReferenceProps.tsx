import { useRef } from 'react';
import { useStore } from '../../store/store';
import { MOD, SHIFT } from '../platform';
import { addReferenceFromFile } from '../referenceUpload';
import { Field, Section, Segmented, Toggle } from './controls';

/** A number box that commits on Enter or blur, as one undo step. */
function Nudge({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
}) {
  return (
    <Field label={label} htmlFor={`ref-${label}`}>
      <input
        id={`ref-${label}`}
        type="number"
        step={1}
        key={value}
        defaultValue={value}
        onBlur={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n) && n !== value) onCommit(Math.round(n));
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
    </Field>
  );
}

/** The frame's reference screenshot: add, replace, and how it is drawn. */
export function ReferenceProps({ frameId }: { frameId: string }) {
  const reference = useStore((s) => s.doc.frames.find((f) => f.id === frameId)?.reference);
  const name = useStore((s) => (reference ? s.doc.images[reference.imageId]?.name : undefined));
  const input = useRef<HTMLInputElement>(null);
  // A slider drag (or a run of arrow keys) is one undo entry: the first change starts it.
  const gesture = useRef(false);
  const st = useStore.getState;
  const update = (patch: Parameters<ReturnType<typeof st>['updateFrameReference']>[1]) =>
    st().updateFrameReference(frameId, patch);

  return (
    <Section
      title="Reference image"
      hint="A screenshot to trace over. Only shown while editing; never in Preview, exports, build notes or templates."
    >
      <div className="prop-actions">
        <button className="btn" onClick={() => input.current?.click()}>
          {reference ? 'Replace…' : 'Add reference image…'}
        </button>
        {reference && (
          <button className="btn btn--danger" onClick={() => st().removeFrameReference(frameId)}>
            Remove
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        hidden
        aria-label="Reference image file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void addReferenceFromFile(frameId, file);
          e.target.value = '';
        }}
      />
      {!reference && (
        <p className="prop-hint">
          You can also drop an image on the frame, or paste one ({MOD}V) while the frame is
          selected.
        </p>
      )}
      {reference && (
        <>
          {name && <p className="prop-hint">{name}</p>}
          <Toggle
            label={`Show (${MOD}${SHIFT}R)`}
            checked={reference.visible}
            onChange={(visible) => update({ visible })}
          />
          <Segmented
            label="Placement"
            value={reference.placement}
            options={[
              { id: 'over', label: 'Over', title: 'Drawn over the content' },
              { id: 'behind', label: 'Behind', title: 'Drawn behind the content' },
              {
                id: 'beside',
                label: 'Beside',
                title: 'Full opacity next to the page, for comparing',
              },
            ]}
            onChange={(placement) => update({ placement })}
          />
          {reference.placement !== 'beside' && (
            <Field label="Opacity" htmlFor="ref-opacity">
              <input
                id="ref-opacity"
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(reference.opacity * 100)}
                aria-label="Reference opacity"
                onChange={(e) => {
                  if (!gesture.current) {
                    gesture.current = true;
                    st().beginGesture();
                  }
                  st().updateFrameReferenceLive(frameId, { opacity: Number(e.target.value) / 100 });
                }}
                onPointerUp={() => (gesture.current = false)}
                onKeyUp={() => (gesture.current = false)}
                onBlur={() => (gesture.current = false)}
              />
              <span className="prop-hint">{Math.round(reference.opacity * 100)}%</span>
            </Field>
          )}
          <Segmented
            label="Size"
            value={reference.fit}
            options={[
              { id: 'width', label: 'Fit to width', title: 'Scaled to the page’s width' },
              {
                id: 'actual',
                label: 'Actual size',
                title: 'At its own size (a 2× capture is halved)',
              },
            ]}
            onChange={(fit) => update({ fit })}
          />
          {reference.placement !== 'beside' && (
            <div className="prop-row">
              <Nudge
                label="Offset x"
                value={reference.offsetX}
                onCommit={(offsetX) => update({ offsetX })}
              />
              <Nudge
                label="Offset y"
                value={reference.offsetY}
                onCommit={(offsetY) => update({ offsetY })}
              />
            </div>
          )}
        </>
      )}
    </Section>
  );
}
