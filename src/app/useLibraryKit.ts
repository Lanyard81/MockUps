import { getKit } from '../kits';
import type { Kit } from '../kits/types';
import { useStore } from '../store/store';
import type { Frame } from '../store/types';

/** The frame that "click to add" would use: the selected frame, else the first. */
export function useTargetFrame(): Frame | undefined {
  return useStore((s) => s.doc.frames.find((f) => f.id === s.selectedFrameId) ?? s.doc.frames[0]);
}

/**
 * The kit the library and templates show. It follows the target frame's kit; if the user switched
 * to the other kit for this frame it stays there until another frame is selected.
 */
export function useLibraryKit(): { kit: Kit; target: Frame | undefined; mismatch: boolean } {
  const target = useTargetFrame();
  const override = useStore((s) => s.libraryKit);
  const frameKit = getKit(target?.kitId);
  const kit =
    override && override.frameId === (target?.id ?? null) ? getKit(override.kitId) : frameKit;
  return { kit, target, mismatch: kit.id !== frameKit.id };
}
