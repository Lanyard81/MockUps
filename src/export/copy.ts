import { renderNodeHtml } from '../layout/render';
import { useStore } from '../store/store';
import { cleanForExport, formatHtml } from './clean';

/** Put text on the clipboard, falling back to the old way where the modern one is unavailable. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

/** The clean, indented markup of a component or section, as handed to developers. */
export function htmlForNode(nodeId: string): string | null {
  const { doc } = useStore.getState();
  if (!doc.nodes[nodeId]) return null;
  return formatHtml(
    cleanForExport(renderNodeHtml(doc.nodes, nodeId, doc.images), { unwrap: true }),
  );
}

/** Copy the selection's HTML and say so. */
export async function copySelectionHtml(nodeId?: string | null): Promise<void> {
  const s = useStore.getState();
  const id = nodeId ?? s.selectedNodeId;
  const html = id ? htmlForNode(id) : null;
  if (!html) {
    s.setNotice('Select a component or section first, then copy its HTML.');
    return;
  }
  s.setNotice(
    (await copyText(html))
      ? 'HTML copied. Paste it into your code.'
      : 'The browser blocked copying. Allow clipboard access and try again.',
  );
}
