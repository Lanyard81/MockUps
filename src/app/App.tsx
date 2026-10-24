import { useEffect } from 'react';
import { DragGhost } from '../canvas/DragGhost';
import { Viewport } from '../canvas/Viewport';
import { handleKeyDown, handleKeyUp } from '../canvas/shortcuts';
import { looksLikePageSpec } from '../pagespec';
import { openMockupFile } from '../persistence/file';
import { useStore } from '../store/store';
import { ResponsiveDialog } from './ResponsiveDialog';
import { AccessibilityDialog } from './AccessibilityDialog';
import { HistoryDialog } from './HistoryDialog';
import { CommandPalette } from './CommandPalette';
import { ConfirmDialog } from './ConfirmDialog';
import { ContextMenu } from './ContextMenu';
import { ExportDialog } from './ExportDialog';
import { LeftPanel } from './LeftPanel';
import { MyMockups } from './MyMockups';
import { Properties } from './Properties';
import { ConversionSummary } from './ConversionSummary';
import { PrototypeViewer } from './PrototypeViewer';
import { SaveComponentDialog } from './SaveComponentDialog';
import { SaveTemplateDialog } from './SaveTemplateDialog';
import { ShortcutsSheet } from './ShortcutsSheet';
import { StorageBanner } from './StorageBanner';
import { Toast } from './Toast';
import { Toolbar } from './Toolbar';
import { Tour } from './Tour';
import { ImportPageSpecDialog } from './ImportPageSpecDialog';
import { ImportSummary } from './ImportSummary';
import { addReferenceFromFile, isReferenceFile } from './referenceUpload';

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
    // Pasting an image with only a frame selected makes it that frame's reference image.
    const pasteImage = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      const s = useStore.getState();
      // Pasted page spec JSON (recognised by its format field) is imported as new frames.
      const pasted = e.clipboardData?.getData('text/plain') ?? '';
      if (looksLikePageSpec(pasted)) {
        e.preventDefault();
        s.importPageSpecText(pasted);
        return;
      }
      if (!s.selectedFrameId || s.selectedNodeId) return;
      const file = [...(e.clipboardData?.files ?? [])].find(isReferenceFile);
      if (!file) return;
      e.preventDefault();
      void addReferenceFromFile(s.selectedFrameId, file);
    };
    window.addEventListener('paste', pasteImage);
    window.addEventListener('dragover', stopFileDrop);
    window.addEventListener('drop', openDropped);
    return () => {
      window.removeEventListener('paste', pasteImage);
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
      <SaveComponentDialog />
      <PrototypeViewer />
      <ConversionSummary />
      <ImportPageSpecDialog />
      <CommandPalette />
      <HistoryDialog />
      <ResponsiveDialog />
      <AccessibilityDialog />
      <ImportSummary />
      <ConfirmDialog />
      <Tour />
      <Toast />
    </div>
  );
}
