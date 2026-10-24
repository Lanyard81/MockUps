import { useMemo } from 'react';
import { copyFrameSpec, downloadFrameSpec } from '../../export/pageSpec';
import { copyBuildNotes, downloadBuildNotes } from '../../export/buildNotes';
import { getKit } from '../../kits';
import { conversionTargets } from '../../layout/convert';
import { useStore } from '../../store/store';
import { DEVICES, type DeviceId, type DocNode } from '../../store/types';
import { KIT_PANELS } from '../kitPanels';
import { switchFrameLayout } from '../frameLayout';
import { PageParts } from '../PageParts';
import { isFreeFrame } from '../../layout/free';
import { ImportReportView } from '../ImportReportView';
import { FreeFrameSettings } from './FreeProps';
import { ReferenceProps } from './ReferenceProps';
import { CommitInput, Field, Section, Segmented, Toggle } from './controls';
import { SettingsPanel } from './SettingsPanel';

const NO_VALUES: Record<string, unknown> = {};

export function FrameProps({ frameId }: { frameId: string }) {
  const frame = useStore((s) => s.doc.frames.find((f) => f.id === frameId));
  const kitSettings = useStore((s) => s.doc.kitSettings[frame?.kitId ?? '']) ?? NO_VALUES;
  const nodes = useStore((s) => s.doc.nodes);
  const topLevel = useMemo(
    () => (frame?.root ?? []).map((id) => nodes[id]).filter((n): n is DocNode => !!n),
    [frame?.root, nodes],
  );
  const importReport = useStore((s) => s.importReports[frameId]);
  const doc = useStore((s) => s.doc);
  const st = useStore.getState;
  if (!frame) return null;
  const kit = getKit(frame.kitId);
  const KitFramePanel = KIT_PANELS[kit.id]?.frame;
  const free = isFreeFrame(frame);
  const targets = free ? [] : conversionTargets(kit.id);
  const context = { frame: frame.settings ?? NO_VALUES, kit: kitSettings, topLevel };
  return (
    <>
      <Section title="Frame">
        <p className="prop-kit" data-testid="frame-kit-info">
          <span className="badge">{kit.shortLabel}</span> {kit.name}
        </p>
        {kit.fidelityNote && <p className="prop-hint">{kit.fidelityNote}</p>}
        <Field label="Name" htmlFor="frame-name">
          <CommitInput
            id="frame-name"
            value={frame.name}
            onCommit={(v) => st().renameFrame(frame.id, v)}
          />
        </Field>
        <Field label="Device" htmlFor="frame-device">
          <select
            id="frame-device"
            value={frame.device}
            onChange={(e) => st().setFrameDevice(frame.id, e.target.value as DeviceId)}
          >
            {Object.values(DEVICES).map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
                {d.id === 'custom' ? '' : ` (${d.width})`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Width" htmlFor="frame-width">
          <input
            id="frame-width"
            type="number"
            min={240}
            max={3000}
            key={`${frame.id}-${frame.width}`}
            defaultValue={frame.width}
            onBlur={(e) => st().setFrameWidth(frame.id, Number(e.target.value) || frame.width)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
          />
        </Field>
        <p className="prop-hint">
          The width decides which {kit.shortLabel} layout is used, just as on a real device.
        </p>
        <Segmented
          label="Layout"
          value={free ? 'free' : 'flow'}
          options={[
            {
              id: 'flow',
              label: 'Flow',
              title: 'Sections, grids and columns, like a real page',
            },
            {
              id: 'free',
              label: 'Freeform',
              title: 'Drag components anywhere, with no grid. Good for sketching ideas.',
            },
          ]}
          onChange={(layout) => switchFrameLayout(frame.id, layout)}
        />
        {free && (
          <p className="prop-hint">
            Components sit exactly where you put them. Drag to move (Shift locks one direction),
            drag the side handles to resize, arrow keys nudge, Alt+↑/↓ changes what is in front.
          </p>
        )}
      </Section>
      <Section
        title="Click-through"
        hint="Play starts here. Links set to “Go to frame” move between frames, with the transition you choose."
      >
        <Toggle
          label="Start frame"
          checked={(doc.startFrameId ?? doc.frames[0]?.id) === frame.id}
          disabled={(doc.startFrameId ?? doc.frames[0]?.id) === frame.id && !doc.startFrameId}
          onChange={(on) => st().setStartFrame(on ? frame.id : null)}
        />
      </Section>
      {importReport && (
        <Section
          title="Import report"
          hint="From the page spec this frame was made from. Check the placeholders."
        >
          <ImportReportView report={importReport} />
          <div className="prop-actions">
            <button className="btn" onClick={() => st().dismissImportReport(frame.id)}>
              Dismiss report
            </button>
          </div>
        </Section>
      )}
      <FreeFrameSettings frameId={frame.id} />
      <ReferenceProps frameId={frame.id} />
      {!free && kit.pageParts.length > 0 && (
        <Section
          title="Page parts"
          hint={`Start a page with the standard ${kit.shortLabel} furniture.`}
        >
          <PageParts frameId={frame.id} kitId={kit.id} />
        </Section>
      )}
      {!free && kit.settings.frame.length > 0 && (
        <SettingsPanel
          defs={kit.settings.frame}
          values={frame.settings ?? NO_VALUES}
          context={context}
          onChange={(key, value) => st().setFrameSettings(frame.id, { [key]: value })}
        />
      )}
      {!free && KitFramePanel && <KitFramePanel frameId={frame.id} />}
      {kit.settings.kit.length > 0 && (
        <SettingsPanel
          defs={kit.settings.kit}
          values={kitSettings}
          context={context}
          onChange={(key, value) => st().setKitSettings(kit.id, { [key]: value })}
        />
      )}
      {targets.length > 0 && (
        <Section
          title="Convert"
          hint="Makes a converted copy next to this frame. Anything with no equivalent becomes a labelled placeholder. The original is never changed."
        >
          <div className="prop-actions">
            {targets.map((id) => (
              <button
                key={id}
                className="btn"
                disabled={frame.root.length === 0}
                onClick={() => st().convertFrame(frame.id, id)}
              >
                Convert to {getKit(id).shortLabel}
              </button>
            ))}
          </div>
        </Section>
      )}
      {!free && (
        <Section
          title="Page spec"
          hint="The page as compact JSON: paste it into a Claude chat to change it, then import the answer (File, Import page spec)."
        >
          <div className="prop-actions">
            <button className="btn" onClick={() => void copyFrameSpec(frame.id)}>
              Copy as page spec
            </button>
            <button className="btn" onClick={() => downloadFrameSpec(frame.id)}>
              Download (.page.json)
            </button>
          </div>
        </Section>
      )}
      {!free && kit.buildNotes && (
        <Section
          title={kit.buildNotes.label}
          hint="A plain-English spec you can follow in SharePoint: site settings, then each section and web part."
        >
          <div className="prop-actions">
            <button className="btn" onClick={() => void copyBuildNotes(frame.id)}>
              Copy as {kit.buildNotes.label}
            </button>
            <button className="btn" onClick={() => downloadBuildNotes(frame.id)}>
              Download (.md)
            </button>
          </div>
        </Section>
      )}
      <div className="prop-actions">
        <button
          className="btn"
          disabled={free || frame.root.length === 0}
          onClick={() => st().setDialog('saveTemplate', frame.id)}
          title="Keep this frame to start new frames from later"
        >
          Save as template…
        </button>
        <button
          className="btn"
          onClick={() => st().duplicateFrame(frame.id)}
          title="Duplicate (Ctrl/⌘ D)"
        >
          Duplicate frame
        </button>
        <button
          className="btn btn--danger"
          onClick={() => st().deleteFrame(frame.id)}
          title="Delete (Delete key). Undo brings it back."
        >
          Delete frame
        </button>
      </div>
    </>
  );
}
