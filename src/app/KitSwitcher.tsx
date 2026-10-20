import { KITS } from '../kits';
import { useStore } from '../store/store';
import { useLibraryKit } from './useLibraryKit';

/** NSW | SharePoint: which kit the library shows. It follows the selected frame; click to browse the other. */
export function KitSwitcher() {
  const { kit } = useLibraryKit();
  if (KITS.length < 2) return null;
  return (
    <div className="segmented segmented--block kit-switcher" role="group" aria-label="Style kit">
      {KITS.map((k) => (
        <button
          key={k.id}
          className={k.id === kit.id ? 'is-active' : ''}
          aria-pressed={k.id === kit.id}
          title={k.name}
          onClick={() => useStore.getState().setLibraryKit(k.id)}
        >
          {k.shortLabel}
        </button>
      ))}
    </div>
  );
}
