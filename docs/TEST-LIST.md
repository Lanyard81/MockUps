# What to test by hand (Milestones 0–8)

Open the Pages site or `dist-single/pagewright.html` (try the single file with Wi-Fi off).

**Building**

1. Drag components from Library onto a frame: blue line shows where it lands; one Undo removes it. Click a tile adds it after the selection.
2. Drag layout blocks (Section, Container, 1–4 columns). Drop a component on empty frame space: the section, container, grid and column are created for you.
3. Full-width components (masthead, header, hero banner, footer) go at the top level.
4. Drag an item to move it (also between frames and in Layers). Esc mid-drag cancels.

**Editing** 5. Double-click text to edit in place; Enter finishes; Shift+Enter new line; Tab moves to the next text. Esc cancels. 6. Properties: variant chips, options, show/hide parts, "Shrink text to fit" (⚠ appears if even the smallest size is cut off). 7. Drop an image file on a picture. Check alt text. 8. Right-click an item and a frame; check the shortcuts sheet (?) matches what the keys do. Ctrl/⌘ Z / Shift Z. 9. Layers tab: rename, hide, reorder, drag. First-run tour appears once.

**Templates and samples (M7)** 10. Templates tab: search; click makes a frame; drag onto a frame asks "Replace…" and Undo restores; drag onto empty canvas makes a new frame. 11. Right-click frame label > Save as template…; it appears under My templates; rename, delete (asks first); it comes back after Save/Open file. 12. File > Sample: … opens three samples; empty frames offer "Browse templates".

**Click-through (M8)** 13. Select a button or link, choose "Go to frame". Switch to Preview, click it: viewer opens the frame; Back, Close, Esc work. Export HTML: the pages link to each other.

**Saving and export (M6)** 14. Refresh: your work returns (autosave). My mockups: open, rename, duplicate, delete (confirms). 15. Save to file / Open file (images included). Export: PNG, HTML (self-contained, CDN, several frames as zip), Copy HTML.

**Known limits**: official templates were written from knowledge (docs site unreachable): Easy Read is approximate, maps are placeholders. Shrink-to-fit isn't in HTML export. Canvas doesn't auto-scroll while dragging. Edge/Safari storage untested.

**Style kits (S1, S2)** 16. Add frame: choose NSW or SharePoint (the choice is remembered); the frame label shows a kit badge; Undo removes the frame. 17. Select a SharePoint frame: the library switches to SharePoint. Select an NSW frame: it switches back. Click the other kit in the switcher to browse it: the tiles go grey with a warning, and dragging one onto the frame says why nothing happened. 18. Open a mockup saved before kits existed (any earlier `.mockup.json`): it opens, every frame is NSW.

**SharePoint kit foundations (S3)** 19. Add a SharePoint frame, then in Properties try: Site type (Team site loses the footer and gets a left menu; the footer toggle and Mega menu explain why they're off), Header layout and background, Theme (Teal, a custom colour, Dark blue), "Use a different theme on this frame". 20. Library > Sections: add Two columns, put web parts in both, then change Section layout to One column: content stacks; Undo puts it back. Try Full-width on a team site, a second Vertical section, and Flexible: each says why it can't. 21. Double-click the site title, a menu label, a footer link or the page title on the canvas to edit it. Edit the menu in Properties (add, reorder, nest to three levels, remove). 22. Switch to Preview: menus open, collapsible sections collapse. On an iPhone-width SharePoint frame the menu is behind a button and columns stack.

**SharePoint web parts (S4)** 23. In a SharePoint frame, add each web part from the library (Text, Image, Image gallery, Hero, Quick links, News, Events, Highlighted content, People, Document library, List, Countdown, Page properties, Button, Call to action, Link, Divider, Spacer) and switch between their layouts with the variant chips. 24. Quick links: choose another icon for a link (search “rocket”), centre them, hide links 4 to 6. News: Show title and commands off, Compact view on. Hero: hide items down to one. 25. Preview: carousel arrows change the slide; filmstrip arrows scroll. Double-click any text to edit it. Upload a picture for an Image.

**More web parts, templates and build notes (S5)** 26. SharePoint frame, Library: add Quick chart (edit its labels and values in Properties; switch Column and Pie), and a few of the static previews (Weather, Planner, Maps, Code snippet). Each says it is a static preview. 27. Templates tab with a SharePoint frame selected: the seven SharePoint templates. Click Intranet home page and check the vertical section, hero and chrome. Check that NSW templates appear again when an NSW frame is selected. 28. Right-click a SharePoint frame label > Copy as SharePoint build notes, then paste into a document and read it as if you were building the page. Also Download build notes (.md), and File > Export (PNG and HTML) for a SharePoint frame.

**Converting between kits (S6)** 29. Build a small NSW page (masthead and header, a heading, a paragraph, a button, a link list, an accordion, a form), right-click the frame label > Convert to SharePoint. Read the summary, then check the copy: site title and menu from the NSW header and menu, web parts for the content, collapsible sections for the accordion, a labelled placeholder for the form. The original must be unchanged; Undo removes the copy. 30. Convert a SharePoint frame to NSW (try a Quick chart or People web part, a vertical section and a collapsible section) and read the summary and notes. Open a converted frame in Preview and check that links between frames still work.

**Reference image (R1)** 31. Take a screenshot of a page (or use any image), click a frame's label to select the frame, and paste (Ctrl/⌘ V). It appears faint over the frame. Accept the offer to match the frame width. Try a 2× (retina) screenshot: the width offered should be half. 32. In Properties > Reference image: move Opacity; switch Over, Behind and Beside; Fit to width and Actual size; nudge the offset; hide and show it (Ctrl/⌘ Shift R). Drag a component onto the frame and select things through the screenshot: it must not get in the way. 33. Switch to Preview and export a PNG and HTML: the screenshot must not appear. Undo after each change; reload the page and check it is still there.

**Page specs (R2)** 34. File → Copy page spec instructions (NSW), paste into a Claude chat with a screenshot of an NSW page, and paste the JSON answer back with Ctrl/⌘ V on the canvas. A new frame appears; read the summary and open Details. Try the same with SharePoint. 35. Right-click a frame label → Copy as page spec; ask Claude to change something ("add a contact section"), paste the result: it comes back as a new frame. 36. File → Import page spec… with a `.page.json` file, and drop one on the editor. Try a spec with a made-up component (it should become a clearly labelled placeholder) and Undo (one step removes the frame). Check the import report in the frame's Properties and dismiss it.

**Freeform frames (F1)** 37. Add frame → choose Freeform → Desktop. Drag a few components from the library onto the frame: each lands where you drop it. Drag them around (Shift locks a direction), drag the side handles to resize, nudge with the arrow keys, and overlap two items then use Alt+↑/↓ or right-click → Bring to front. Undo each step. 38. Properties → Layout: on a normal page with several sections choose Freeform (each component stays put), rearrange, then choose Flow again (components return in reading order, each in a section). Try both kits. 39. In a freeform frame try a section from Layout, Add masthead + header, Convert and Save as template: each should explain why not. Preview and export a PNG to check the arrangement is kept.

**DevDan Startup look** 40. Open the app: dark glass panels over an aurora backdrop, a floating pill toolbar, mono uppercase section labels. Open the File menu, a right-click menu and the Export dialog and check they are readable over a white mockup. 41. Click the sun/moon button to switch to light, reload (it should stay), switch back. Check that mockup frames, library thumbnails and PNG/HTML exports look exactly as before in both themes.

**Freeform alignment (G1)** 42. On a freeform frame drag one item so its edge or middle lines up with another's or the frame's: a pink line appears. In Properties turn on Snap to guides, or pick a grid (8, 16, 24), and drag again; hold Alt to ignore it. 43. Select an item: use Position to type X, Y and width and to align it left, centre or right.

**My components (G2)** 44. Build a card or a section the way you like it, right-click → Save as component…, give it a name. It appears under My components at the top of the Library. Click it to add a copy, drag it onto a frame (try a freeform frame), then Undo. Reload: it is still there. Delete it and check pages that use it are unchanged. 45. File → Save to file, then open that file in a private window: your components come with it.

**Comments (G3)** 46. Click Comment in the toolbar, click a spot on a frame, type a note and Close. A numbered pin appears. Add two more, then open the Comments tab: open one, mark it Done, show done notes, delete one, Undo. 47. Preview: no pins. Export a PNG with and without "Mark open comments on the image". Copy or download the comments as Markdown and read them.

**Viewer file (G4)** 48. Make a mockup with two frames, a button that goes to the second (Properties → Go to frame) and a comment. File → Export… → Viewer file. Open the downloaded file with Wi-Fi off: switch frames with the tabs, click the button, press Back, and turn Comments on.

**Search (G5)** 49. Press Ctrl/⌘ K anywhere. Type "card", "dashboard", "export", "light", "go to": add a component, add a template, open Export, switch theme, jump to a frame. Check arrows, Enter and Esc.

**Click-through (G6)** 50. Make two frames with a button on the first set to Go to frame (Properties) and pick a Transition. Press ▶ Play: click the button (the next frame animates in), Back, Esc. Set the second frame as the start (right-click its name) and Play again; export the viewer file and check it opens there too.

**Version history (G7)** 51. File → Version history…, save "Draft 1". Change the page (add, delete, edit text, add a frame). Reopen the history: it says what changed; click "What changed". Restore the version, then Undo. Reload and check it is still listed; Open as new mockup; Delete it.

**Responsive view (G8)** 52. Right-click a frame name → Check responsive layouts…. Check the page at the three widths. Add something wide (a long word in a heading, a wide table) and see it flagged on the phone; click the named component to select it. Try a SharePoint frame too.

**Accessibility (G9)** 53. Right-click a frame name → Check accessibility…. Add a Heading 1 and a Heading 4 and see the skipped level flagged; add a button/image with no description and pale text on a pale background (a Card with a light tint) and see them listed; click a named component to select it. A tidy page says "No problems found".

**Quick wins (G10)** 54. Add frame → A4 page, Slide (16:9). Right-click a frame name → Duplicate as desktop. File → Export… → PDF document (one frame, then All frames) and open the PDF. With a blank mockup, look at the Properties panel for the welcome and the sample buttons.

**Simple kit (K3)** 55. Add frame → choose Simple → Desktop. In the Library (Simple tab) add a few parts: hero, card with picture, form, header bar. Try Templates → Simple (landing page, dashboard). Change the accent colour (Properties on the frame, and in the kit colours), section background and spacing. Export a PNG and an HTML page; import a page spec with `"kit": "simple"`.

**Keyboard (M1)** 56. Put the mouse away. Tab to "Skip to the library", press Enter. Use ← → on the tabs, open Layers, arrow down to an item, Enter to select it, F2 to rename, Alt+↓ to move it, Delete then Ctrl+Z. Press `]` to step through the page, Enter to edit text. Focus File and press ↓, then Esc. Focus a page name and press Enter, then F2.

**Safety (M2)** 57. Edit something and reload straight away: it is still there. Open the same mockup in two tabs, edit in one, and see the other pause with a choice. File → New mockup asks first. Delete a page: "Bring it back" restores it. Delete a saved version: it asks.

**Adding things (M4)** 58. Add masthead + header, then a heading, three cards and a footer by clicking: header on top, footer last. Watch the line under the Library search say where the next click adds. Select the first card and choose "3 across" (Properties or right-click), then Undo. Press Esc from a card: Section, then the page. Settings → "Show layout details" brings containers, grids and columns back.

**Hand-off (M5)** 59. Click Share: read what each choice is for, export a PDF on A4 sheets, a page description, and (on a SharePoint page) build notes. Right-click a page → Convert: the summary lists what each part became, and the copy sits clear of the original.

**First run (M6)** 60. Open the app fresh: the empty page offers Choose a template, Try a sample and Import a page description. Pick a template: it replaces the empty page. Help → Replay the tour: tips sit beside what they describe and move on as you act. Press Present on an empty mockup: it says why not.

**Library (M7)** 61. Select a SharePoint page, switch the Library to NSW: the notice offers "Add an NSW page" and "Convert this page". Search "expandable rows": Accordion appears. Ctrl+K "mega menu" jumps to the SharePoint navigation setting; Ctrl+K "layers" opens Layers.

**Properties (M8)** 62. Select a Card: its panel starts with Text, then appearance, then show/hide. There is one "Shrink text to fit" switch; turn it on and Undo once. On a page, "Checks" and "Prototype links" are folded away until opened. Select a footer: labels read "Group 1 link 1". Select one item, then another: the panel starts at the top.

**Small windows and touch (M9)** 63. Press Alt 1 and Alt 2 (or the two panel buttons): the side panels hide and show, and the canvas grows. Make the window narrow (under 900px, or zoom the browser to 200

**Small windows and touch (M9)** 63. Press Alt 1 and Alt 2 (or the two panel buttons): the side panels hide and show, and the canvas grows. Make the window narrow (under 900px, or zoom the browser to 200%): panels become drawers and the canvas fills the window. On a tablet: drag empty canvas to pan, pinch to zoom, press and hold an item for its menu.

**Look (M10)** 64. Settings → Editor look → Flat: panels sit edge to edge with thin lines, no blur or colour wash. Switch Dark/Light in each look; menus never show the page through them. Zoom far out: the dots thin out and vanish. Every icon (close, expand arrows, eye, play) looks like the same family.

**Canvas (M11)** 65. Zoom to 100%, add three desktop pages: each slides into view. Drag a library tile to the bottom edge of the canvas and hold: the canvas scrolls. Hover a spot and press Ctrl/⌘ + : it zooms around that spot. Zoom far out: page names shorten, never overlap. Present, click inside the page, press Esc: it closes.

**Kits (M12)** 66. Templates → NSW → Application: work dashboard: each group heading has clear space above it. Select a paragraph below a heading in an NSW page: Properties has "Space above" (try Large, then Auto). Simple → Landing page: the last button is centred under its heading. Simple page: the "Accent colour on this page" swatches appear only after ticking "Use a different accent".
