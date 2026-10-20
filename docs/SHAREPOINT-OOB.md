# SharePoint Online (modern, out of the box): reference for the SharePoint kit

Gathered 20 October 2026 from Microsoft Support and Microsoft Learn (sources at the end). Items marked **(verify)** come from general knowledge rather than the sources read, and must be checked against a real tenant or reference screenshots before being relied on.

## What SharePoint is built on

- Modern SharePoint pages are built with **Fluent UI** (Microsoft's design system). SharePoint's own page HTML and CSS are **not** published as a package, so the kit is a faithful **lookalike**, not real SharePoint markup.
- **Theming** works from a small set of theme colours ("slots") generated from a primary colour; Fluent UI's theme generator reproduces this.
- **Font**: Segoe UI. It is a Microsoft font that can't be redistributed, so it must not be bundled; use a font stack that falls back to the system font.
- **Icons**: use Fluent System Icons (MIT licence, `@fluentui/react-icons` or `@fluentui/svg-icons`). Do **not** use the Fabric MDL2 icon font: its asset licence restricts use to Microsoft products and services.
- Don't use Microsoft or SharePoint logos anywhere in mockups.

## Site types

- **Communication site**: horizontal navigation, optional footer, full-width sections allowed, mega menu available.
- **Team site**: left-hand vertical navigation by default (verify), no footer, no full-width sections.
- **Hub site**: adds hub navigation above the site header (verify).

## Change the look

**Themes**
- Default SharePoint themes, whose main and accent colours can be customised. Company themes appear if an administrator provides them.
- Default theme names (verify): light themes Teal, Blue, Orange, Red, Purple, Green, Grey; dark themes Dark Yellow, Dark Blue.
- Microsoft's main palette colours: Red #A4262C, Orange #CA5010, Gold #986F0B, Green #498205, Teal #007780, Blue #0078D4, Dark Blue #004E8C, Indigo #4F6BED, Plum #881798, Purple #8764B8, Cool Grey #69797E, Warm Grey #7A7574. Dark-theme palette: Red #EF6950, Yellow #FFC83D, Green #00B294, Blue #3A96DD, Purple #9C89E9, Grey #B1ADAB. Lighter and darker shades are generated from the chosen accent.
- Since late 2024, site owners can create their own themes and font packages; organisations can publish them through the brand center.

**Header**
- Layouts: **Minimal**, **Compact** (default for modern sites), **Standard**, **Extended**.
- Background: a theme colour (None, Neutral, Soft, Strong (verify)), or an image with adjustable overlay, opacity and focal point.
- Site title: show or hide, with a selectable font from the site's font package.
- Logo: a square logo thumbnail, plus a site logo (64×64 to 192×64 px). Logo alignment (left, centre, right) on the Extended layout only.

**Navigation**
- Styles: **Mega menu** (communication and hub sites) and **Cascading**. In a mega menu, third-level links show as a single vertical list.
- Orientation: horizontal (communication) or vertical (team sites) (verify); navigation can be hidden (verify).

**Footer** (communication sites only)
- Show or hide; logo (resized automatically); display name (show/hide); up to eight links or labels, one level.
- Layouts: Simple and Extended; background from theme colours (verify).

**Page title area** (verify): layouts Image and title, Plain, Colour block, Overlap; text alignment left or centre; optional topic header, author byline and published date.

## Sections

- **One, two or three columns**, plus **one-third left** and **one-third right** (verify the last two names).
- **Full-width section**: spans the whole page edge to edge. Communication sites only.
- **Vertical section**: a right-hand column for things like quick links, contacts, weather or countdowns. Its length matches the other sections. It can't coexist with a full-width section. Under 1024 px (or in narrow windows) it moves to the bottom, or the top if set.
- **Flexible section**: web parts are placed and resized freely within the section; it can't be changed to another type.
- **Section templates**: preset layouts in the toolbox.
- **Backgrounds**: the first four colours come from the site theme; gradients and images are supported, with an automatic overlay for readability. List, Document library and Quick chart always keep the page background. Some web parts don't support show-through backgrounds (Site activity, Viva Engage conversations and highlights, List properties, Page properties, Group calendar, Power Apps).
- **Collapsible sections**: section title (show/hide, heading level), divider line (show/hide), expand/collapse icon left or right, default expanded or collapsed.
- Reducing columns moves content left; going to one column stacks columns two and three underneath.

## Web parts (current list)

Agent link, Button, Call to action, Code snippet, Connectors, Conversations (Viva Engage), Countdown timer, Divider, Document library, Embed, Events, Feed for Viva Connections, File and media, Group calendar, Hero, Highlighted content, Highlights (Viva Engage), Image, Image gallery, Kindle instant preview, Link, List, List properties, Maps, Markdown, Microsoft Forms, Power Apps, News, Organisation chart, Page properties, People, Planner, Power BI report, Quick chart, Quick links, Recent documents, Saved for later, Site activity, Sites, Spacer, Stream (classic), Text, Weather, World clock, YouTube.

**Retired**: My feed (no new instances since March 2025). Assignments is for education tenants only.

### Layouts and options for the main web parts

| Web part | Layouts | Options |
|---|---|---|
| **Quick links** | Compact, Filmstrip, Grid, Button, List, Tiles | Compact: 48×48 icons, show image. Filmstrip: 9:16 images. Button and List: show descriptions. Per link: image or icon, description, alt text. Icon size, alignment and button style (verify). |
| **News** | Top story, List, Side-by-side, Hub news, Carousel, Tiles, Filmstrip | Number of items (List, Carousel, Tiles), auto-cycle (Carousel), show title and commands ("See all"), compact view, hide if empty, pinned positions. |
| **Hero** | Tiles, Layers (verify) | 1–5 tiles or layers; image, title, link, call to action per item. Typically full width. |
| **Events** | Filmstrip, Compact (verify) | Number of items, date range, category, show title and commands. |
| **Highlighted content** | Cards, List, Carousel, Filmstrip (verify) | Number of items, show title and commands. |
| **People** | Compact, Descriptive (verify) | Names, titles, photos or initials. |
| **Image gallery** | Brick, Grid, Carousel (verify) | Captions. |
| **Text** | — | Heading 1–4 (verify current set), paragraph, pull quote, bullet and numbered lists, tables with styles, highlight and font colours, alignment, links. |
| **Button** | — | Label, link, alignment. |
| **Call to action** | — | Background image, text, button label and link, alignment. |
| **Countdown timer** | — | Count down to or up from a date, background image, button. |
| **Page properties** | — | Shows chosen page metadata. |

## Sources

- https://support.microsoft.com/en-au/sharepoint/web-parts-and-apps-in-sharepoint/using-web-parts-on-sharepoint-pages
- https://support.microsoft.com/en-us/topic/fc491eb4-f733-4825-8fe2-e1ed80bd0899 (sections and columns)
- https://support.microsoft.com/office/change-the-look-of-your-sharepoint-site-06bbadc3-6b04-4a60-9d14-894f6a170818
- https://support.microsoft.com/office/use-the-quick-links-web-part-e1df7561-209d-4362-96d4-469f85ab2a82
- https://support.microsoft.com/en-us/office/c2dcee50-f5d7-434b-8cb9-a7feefd9f165 (News web part)
- https://learn.microsoft.com/en-us/sharepoint/dev/design/themes-colors
- https://mc.merill.net/message/MC905757 (custom fonts and themes for site owners)
- https://www.beyondintranet.com/blog/how-to-customise-theme-header-footer-and-navigation-on-modern-communication-sites/ (navigation and footer)

## Build notes: how the kit differs from real SharePoint (Milestone S3)

Added while building the kit; nothing here has been compared with a tenant yet. No reference screenshots were in `docs/sharepoint-reference/` when this was written, so every item below is a question for the first screenshots.

- **Look**: lookalike, not SharePoint's code. Segoe UI is not bundled; the font stack falls back to the system font, so text widths differ from a real site.
- **Themes**: Blue is SharePoint's default theme as Microsoft tuned it (Fluent default palette). The other presets (Teal, Orange, Red, Purple, Green, Grey, Dark yellow, Dark blue) use the palette colours listed above and are *generated* from that colour with Fluent UI's shade tables, so their tints may differ slightly from SharePoint's own. Dark themes use a `#1b1a19` background (assumed). Custom and Organisation themes are generated the same way. **Verify** names and colours.
- **Header**: the four layouts differ in height (48, 56, 80, 128 px; assumed), and the menu is a row below the title except on Minimal, where it shares the row. Header background looks (None, Neutral, Soft, Strong) use themeLighter / neutralLighter / themePrimary; **verify**. Image backgrounds have an overlay percentage but no focal point.
- **Menu**: Mega menu shows up to three levels in a wide panel (level two as headings, level three listed under them); Cascading opens panels to the side. Team sites always get the left-hand cascading menu. Hub navigation above the header is not built.
- **Footer**: Simple (one row) and Extended (brand row, then links in four columns); the background uses the same four looks. Up to eight links, one level.
- **Page title area**: the four layouts are approximations of Image and title, Plain, Colour block and Overlap.
- **Section layouts**: one, two, three columns, one-third left and right, full width (communication sites), vertical (one per page, not with a full-width section, moves under the content below 1024 px), flexible (**approximation**: web parts wrap and share the row; no free placement or resizing). Columns stack below 640 px (**assumed**).
- **Section backgrounds**: None, Neutral, Soft, Strong (from the theme), Gradient and Image (with an automatic dark overlay). "Web parts that keep the page background" are not modelled until the web parts exist (S4).
- **Collapsible sections**: title, heading level (2 to 4), divider, icon side, collapsed by default; they work in Preview and expand in Edit so content can be edited.
- **Suite bar**: generic and unbranded (app launcher, search, settings, help, initials), always shown in the theme's dark-alt colour.
- **Icons**: Fluent System Icons (MIT, `@fluentui/svg-icons`), a curated 191 of them, generated into `icons.generated.ts`.

### Web parts (Milestone S4): notes and open questions

Eighteen web parts so far: Text (paragraph, headings 1 to 4, pull quote, bulleted and numbered lists, table with four styles), Image (four aspect ratios, caption), Image gallery (Brick, Grid, Carousel), Button, Call to action, Link (preview card, inline), Divider, Spacer, Hero (Tiles, Layers; 1 to 5 items), Quick links (Compact, Filmstrip, Grid, Button, List, Tiles; per-link Fluent icon), News (Top story, List, Side-by-side, Hub news, Carousel, Tiles, Filmstrip; compact view), Events (Compact, Filmstrip), Highlighted content (Cards, List, Carousel, Filmstrip), People (Compact, Descriptive), Document library, List, Countdown timer, Page properties.

- **Sample content** is made up (names, dates, headlines) and pictures are generated gradients, never real photos. Everything is editable; pictures can be replaced by uploading.
- **Static previews**: Events, Highlighted content, Document library, List and Countdown timer show fixed sample data (SharePoint shows live data). They are marked "Static" in the library. Their editable text is the sample content.
- **Heading set**: Heading 1 to 4 (the OOB note says to verify the current set). Text colours are limited to the theme colour and a highlight; the full font and highlight colour palettes aren't modelled.
- **Quick links**: item pictures and icons follow the chosen layout (Grid and Filmstrip use pictures; the others use icons). Icon size and button style options are not modelled (OOB notes say to verify).
- **Hero**: Layers is an approximation (stacked bands). Hero is meant for a full-width section; the library notes this but doesn't force it.
- **Highlighted content, Events, People** option names follow the OOB list (marked verify there).
- **Carousels** change slide and **filmstrips** scroll in Preview; auto-cycling isn't modelled.
- Web parts SharePoint keeps on the page background (List, Document library, Quick chart) are not given a background of their own yet.
- Not built yet (S5): Quick chart, Weather, World clock, Sites, Recent documents, Site activity, Saved for later, Group calendar, Organisation chart, Markdown, Code snippet, Embed, YouTube, File and media, Forms, Power BI, Power Apps, Maps, Planner, Conversations, Highlights, Agent link.
