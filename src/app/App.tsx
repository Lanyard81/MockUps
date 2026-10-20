import { useEffect } from 'react';
import { DragGhost } from '../canvas/DragGhost';
import { Viewport } from '../canvas/Viewport';
import { handleKeyDown, handleKeyUp } from '../canvas/shortcuts';
import { openMockupFile } from '../persistence/file';
import { useStore } from '../store/store';
import { ConfirmDialog } from './ConfirmDialog';
import { ContextMenu } from './ContextMenu';
import { ExportDialog } from './ExportDialog';
import { LeftPanel } from './LeftPanel';
import { MyMockups } from './MyMockups';
import { Properties } from './Properties';
import { ConversionSummary } from './ConversionSummary';
import { PrototypeViewer } from './PrototypeViewer';
import { SaveTemplateDialog } from './SaveTemplateDialog';
import { ShortcutsSheet } from './ShortcutsSheet';
import { StorageBanner } from './StorageBanner';
import { Toast } from './Toast';
import { Toolbar } from './Toolbar';
import { Tour } from './Tour';

export function App() {
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Releasing space outside the window would leave the canvas stuck in pan mode.
    const reset = () => useStore.getState().setPanning(false);
    window.addEventListener('blur', reset);
    // A file dropped outside a picture would make the browser open it and lose all unsaved work.
    const stopFileDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
    };
    // ...and a mockup file dropped on the editor is opened.
    const openDropped = (e: DragEvent) => {
      stopFileDrop(e);
      const file = [...(e.dataTransfer?.files ?? [])].find((f) => /\.json$/i.test(f.name));
      if (file) void openMockupFile(file);
    };
    window.addEventListener('dragover', stopFileDrop);
    window.addEventListener('drop', openDropped);
    return () => {
      window.removeEventListener('dragover', stopFileDrop);
      window.removeEventListener('drop', openDropped);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', reset);
    };
  }, []);

  // Fit the frames into view once they have been measured (on load, and after opening a mockup).
  useEffect(() => {
    const check = (state: ReturnType<typeof useStore.getState>) => {
      if (state.fitRequested && state.doc.frames.every((f) => f.id in state.frameHeights)) {
        // Clear the request first: zooming updates the store, which calls this check again.
        state.clearFitRequest();
        state.markFitted();
        state.zoomToFit();
      }
    };
    check(useStore.getState());
    return useStore.subscribe(check);
  }, []);

  return (
    <div className="app">
      <Toolbar />
      <StorageBanner />
      <LeftPanel />
      <Viewport />
      <Properties />
      <DragGhost />
      <ContextMenu />
      <ShortcutsSheet />
      <MyMockups />
      <ExportDialog />
      <SaveTemplateDialog />
      <PrototypeViewer />
      <ConversionSummary />
      <ConfirmDialog />
      <Tour />
      <Toast />
    </div>
  );
}
