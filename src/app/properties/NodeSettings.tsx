import { useMemo } from 'react';
import { getKit } from '../../kits';
import type { SettingDef } from '../../kits/types';
import { settingContextFor } from '../../layout/kitContext';
import { useStore } from '../../store/store';
import { SettingsPanel } from './SettingsPanel';

/** Stable empty values: a selector or prop must not be a fresh object each render. */
const NO_DEFS: never[] = [];

/**
 * The kit's settings for one node (a section, a column, a web part...), built from data. Structural
 * ones go through their store action: a section's `layout` also moves content between columns.
 */
export function NodeSettings({ nodeId, frameId }: { nodeId: string; frameId: string }) {
  const node = useStore((s) => s.doc.nodes[nodeId]);
  const doc = useStore((s) => s.doc);
  const frame = doc.frames.find((f) => f.id === frameId);
  const kit = getKit(frame?.kitId);
  const context = useMemo(() => settingContextFor(doc, frameId, nodeId), [doc, frameId, nodeId]);
  const values = useMemo(() => ({ ...node?.props, ...node?.text }), [node?.props, node?.text]);
  if (!node) return null;
  const defs: SettingDef[] = kit.settings.node[node.type] ?? NO_DEFS;
  if (defs.length === 0) return null;
  return (
    <SettingsPanel
      defs={defs}
      values={values}
      context={context}
      onChange={(key, value, def) => {
        const st = useStore.getState();
        if (node.type === 'section' && key === 'layout' && kit.schema.sectionLayouts)
          st.setSectionLayout(nodeId, String(value ?? def.default ?? ''));
        else if (def.store === 'text')
          st.setText(nodeId, key, typeof value === 'string' ? value : '');
        else st.setNodeProps(nodeId, { [key]: value });
      }}
    />
  );
}
