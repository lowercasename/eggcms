<!-- Design handoff for the September 2026 admin redesign. Source: design_handoff_eggcms_admin bundle. -->

# Handoff: EggCMS admin redesign

Repo: `lowercasename/eggcms`, branch `main`, scope `src/admin/` (React + Tailwind, Satoshi font already loaded via `index.css`, Lucide icons already in use).

## Overview
Make the admin — and above all the page editor — obviously readable and operable for a non‑technical, older user. Fix "where do I type", "how do I add a section", "how do I reorder", and "is this saved". Keep the app's existing structure (sidebar → entry list → editor) and its generic, schema‑driven nature: every control on an entry is a **field from `schema.yaml`**, rendered in schema order, and fields are distinguished **only by type**, never by position.

## About the design files
The `.dc.html` files in this bundle are **design references built in HTML**, not code to copy. Recreate them inside the existing React/Tailwind admin using its current components (`FormField`, `Label`, `Input`, `Button`, `Toggle`, the editors in `src/admin/editors/`, `BlocksEditor`, `RichtextEditor` on TipTap). `support.js` is only the preview runtime — ignore it.

- `EggCMS Admin - Redesign.dc.html` — static high‑fidelity screens: **2a** page editor, **3a** media library, **3b** brand‑new page, **3c** empty states.
- `EggCMS Sections Prototype.dc.html` — clickable prototype of the blocks field (accordion, insert‑between, reorder, remove, full‑screen rich text, unsaved bar). Behaviour is authoritative here; read the `class Component` in the file for exact logic.
- `EggCMS Admin - Current.dc.html` — recreation of the admin today, for diffing.

## Fidelity
**High‑fidelity.** Colours, sizes, spacing, copy and behaviour are final. Where Tailwind's scale doesn't hit a value exactly, use arbitrary values (`text-[15px]`, `border-[1.5px]`).

## Build as reusable components, not bespoke markup
EggCMS is schema‑driven: the admin never knows which fields a type has. Everything in this handoff must therefore land as **generic, reusable components** keyed off field type, and nothing may be hand‑built for the "Page" type, the "Sections" field or the "Book" block. Concretely:
- One `FieldRow` (scalar layout) and one `FieldBlock` (tall layout) wrapper; the editor map picks which by field type. Adding a new field type must need zero layout code.
- One `BlocksEditor` that renders any block schema; block header, preview, ↑/↓, insert‑between, menu, confirm‑remove and empty state are all generic. Previews come from a generic "first non‑empty text‑like field" rule, not per‑block code.
- One `RepeaterEditor` used for every array‑of‑objects field, inside blocks or at top level.
- One `RichtextEditor` with a `variant` (`inline` | `fullscreen`) and a toolbar driven by the field's schema options; one toolbar component, rendered at two sizes — never duplicated.
- Shared primitives in `components/ui/`: `Button` (primary / secondary / destructive / icon), `Chip` (status + type variants), `SegmentedControl`, `SearchInput`, `NoticeBar` (amber unsaved / grey info / amber selection / green published), `EmptyState` (icon, title, sentence, action), `Stepper`, `Toggle`, `InsertDivider`, `TypeMenu`.
- Colours, radii and type sizes from **Design tokens** go into Tailwind theme / CSS variables once; components consume tokens, never literal hex.
- Media grid card and the media picker dialog are the same `MediaCard` / `MediaBrowser` component with a `mode` prop.
- Animations live in the components (or one small motion utility), so every block/field gets them for free.
If something in the mocks seems to need a one‑off, treat that as a missing prop or variant on a generic component and add it there.

## Design tokens (replace the current palette in `index.css`)
Colours
- Page background `#F4F2ED`; panel/card white `#FFFFFF`; row stripe `#FBFAF7`
- Text primary `#1F1E1B`; text secondary `#4A4740` (≥7:1 on white — never lighter for body copy); text tertiary `#6E6B60` (icons, dividers only)
- Borders: strong `#B9B5A9` (panels, cards), input `#8C8878` at 1.5px, hairline `#DCD9CF` (row dividers)
- Action (terracotta): `#A6432B`, text-on-tint `#8A3620`, tint `#FBF6F3`. Used ONLY for primary buttons, focus rings, required asterisks.
- Structure (slate blue): `#2A507F`, border `#93A9CB`, tint `#E4EAF4`. Used ONLY for blocks/repeaters/insertion — never for buttons unrelated to structure.
- Published (green): text `#1C5533`, tint `#E3EEE7`, border `#9BC0A9`
- Draft / unsaved (amber): text `#4A3609`/`#7A5A16`, tint `#FAF0D8`, border `#C4A659`
- Destructive: `#8A2B1F` (text `#7A2418`)
- Active nav / selected: `#1F1E1B` fill, white text

Typography (Satoshi; IBM Plex Mono for slugs, counts, URLs)
- Field label 15px/600; input value 17px/400; helper text 14px `#4A4740`
- Page title in header 19px/700; block header title 15px/700; chips 13px/700
- Rich text: 18px, line‑height 1.75, `max-width: 68ch`; full‑screen 21px
- Minimum anywhere: 14px. No uppercase‑tracking labels.

Shape & size
- Radii: panels/cards 12px, blocks 10px, inputs/buttons 8–9px, chips 7px, insert "+" 99px
- Input padding 11px 12px; focused input: border `#A6432B` 2.5px (keep box size constant)
- Buttons: 15px/600–700, padding 10–11px 14–16px, secondary = white with 1.5px `#6E6B60` border
- Every clickable row ≥ 48px tall; icon buttons 34–38px square
- Open block shadow `0 10px 24px rgba(27,26,23,.08)`; menu shadow `0 16px 32px rgba(27,26,23,.16)`

## The one rule that fixes "where do I type" — field layout by type
Implement in `FormField` (or a wrapper the editor map uses):
- **Scalar types** (`string`, `slug`, `number`, `boolean`, `select`, `date`…): one row, `flex`, label in a fixed **180px** left column (15px/600), control fills the rest. Rows separated by 1px `#DCD9CF`; the set of consecutive scalar rows lives inside one white card (`border 1px #B9B5A9`, radius 12).
- **Tall types** (`richtext`, `blocks`, `image`, `file`, repeaters): label **above**, full width. Label row = label + type chip (slate tint, e.g. "Rich text", "12 blocks") + right‑aligned actions ("Full screen", "Collapse all").
- Required marker: ` *` in `#A6432B` after the label. Helper text goes under the control, 14px `#4A4740`.
- Slug: mono 16px, value shown with leading `/`, "Generate" as a secondary button beside it; on a new entry the field is read‑only tinted `#F4F2ED` with helper "Made from the title. You can change it later."
- Number: stepper `− 3 +` with 1.5px borders, mono value. Boolean: 52×28 toggle, 2px `#6E6B60` border, knob `#6E6B60` when off / `#A6432B` fill when on, followed by the word "No"/"Yes".

## Screens

### 2a · Page editor (`pages/ItemEdit.tsx`, `components/Layout.tsx`, `ItemList.tsx`)
Layout: sidebar 196px → entry list 250px (collapsible) → editor. Editor content column `max-width 780px`, centred, padding 24px 28px.

Sidebar (white, right border `#B9B5A9`): logo tile 32px `#A6432B` + site name 16px/700; nav items 15px, 11px 10px padding, active = `#1F1E1B` fill white text; "Sign out" after a full‑width hairline.

Entry list panel (white): header row "Pages **7**" (16px/700, count 500 `#4A4740`) with a 34px icon button (`panel-left-close`, 1.5px `#8C8878` border) to hide the list; then full‑width primary "New page"; then search input (icon `search`, placeholder "Search pages"); then a 3‑way segmented filter **All 7 | Live 6 | Draft 1** (1.5px `#B9B5A9` border, selected = `#1F1E1B` fill). Items: 15px, 12px 10px padding, `check` icon `#23663F` for published or `circle-dot` `#7A5A16` for edited/draft; selected item = `#F4F2ED` fill + 2px `#1F1E1B` border. No date on rows.

Editor header (white, bottom border): title 19px/700, status chip (Published: `check` + word; Edited: `circle-dot` + word), right‑aligned secondary "Preview" (`eye`).

Unsaved bar — **sticky, top 0, z 20** — shown only when dirty: amber tint `#FAF0D8`, bottom border 2px `#7A5A16`, `circle-dot` icon, text "**N unsaved changes.** The website still shows the last published version.", right: secondary "Discard" (white, 1.5px `#7A5A16`) and primary "Publish changes". Replace the current bottom Save/Revert/Delete bar. Move "Delete page" into a header overflow menu.

Blocks field header: "Sections" + chip `layers` "12 blocks" + right "Collapse all".

### Blocks field (`editors/BlocksEditor.tsx`) — behaviour from the prototype
Collapsed row (white, 1.5px `#B9B5A9`, radius 10, min‑height 52): `grip-vertical` (18px `#6E6B60`) · 30px type icon tile (slate tint, `#93A9CB` border) · type name 15px/700 · preview 15px `#4A4740` truncated · **↑ ↓ 34px icon buttons** · chevron. Whole header toggles open; ↑/↓ `stopPropagation`.
Open block: border 2px `#1F1E1B`, header background `#F4F2ED`, icon tile becomes solid `#2A507F` with white icon, header also shows "3 of 12" (only when open). Body uses the field‑layout rule (scalar label column 140px inside blocks). Footer row: right‑aligned "Remove section" (white, `#7A2418` text) → replaced inline by "Remove this book section? [Keep it] [Yes, remove]" (`#8A2B1F` fill).
- **Accordion**: opening a block closes the others (state `openId`). Compensate scroll so the clicked header stays under the pointer.
- **Preview text**: heading → text; text → stripped HTML; book → first non‑empty of title, other‑language title, details; repeater → "N articles · first title" or "N articles, none titled yet"; otherwise "(empty)".
- **Insert between**: a 30px‑tall divider after every block (and before the first) with a persistent 30px round "+" (`#93A9CB` border, `#2A507F` icon; hover fills `#2A507F`). Click toggles a menu under that divider: white, 1.5px `#1F1E1B` border, radius 11, `max-width 420px`, heading "Insert a section after “Book”" + close ×, one row per block type: 34px icon tile + **name 15px/700** + one‑line description 14px `#4A4740`. Choosing inserts at that index, opens the new block, closes the menu. Remove the current `<select>Add a block…</select>`.
- **Reorder**: ↑/↓ in the header are the primary mechanism (disabled at ends, opacity .4). Keep HTML5 drag on the row as secondary; drop target shows 2.5px dashed `#2A507F`.
- **Empty state** (0 blocks): 2.5px dashed `#93A9CB` box, `layers` icon, "This page has no sections yet", one sentence of help, then one outlined slate button per type: "Add heading", "Add text", …
- Repeater items inside a block: numbered gutter (mono 13px) with a 2px vertical guide, each item a `#FBFAF7` card with its own fields and "Remove"; dashed slate "Add an article to this list" button at the end.

### Rich text (`editors/RichtextEditor.tsx`)
Inline editor: 1.5px `#8C8878` border, radius 9; toolbar on `#F4F2ED` with **38px bordered buttons** (Bold, Italic | "Heading", "Normal" as worded buttons | list | "Link" with icon and word); body padding 20px 24px, 18px/1.75, min‑height 220px. For fields whose schema is a single paragraph (e.g. book publication details) show only Bold, Italic, Link.
"Full screen" button in the field's label row opens a fixed overlay: header with type icon, field name, "Book · section 3 of 12", right primary‑dark "Done writing" (`#1F1E1B`); full toolbar at 42px buttons; content card `max-width 760px`, padding 44px 48px, text 21px. Same TipTap document instance — no copy back.

### 3a · Media library (`pages/Media.tsx`, and the picker used by Image/File editors)
Header: "Media" 19px + "224 files" 15px `#4A4740`; right primary "Upload files". Second row: search (280px, "Search by file name"), segmented type filter All/Images/Documents/Audio/Video with counts, right "Newest first ▾" secondary. Grid `repeat(4, minmax(0,1fr))`, gap 18px. Card: 1.5px `#B9B5A9`, radius 11; 4:3 thumb with 24px checkbox top‑left (`#1F1E1B` fill + `check` when selected) and mono extension chip bottom‑right; body: **file name 15px/600** (largest text), size 14px `#4A4740`, usage line 14px — "Used on 2 pages" in `#2A507F`/600 or "Not used yet". Selected card: 2.5px `#1F1E1B` border. Selection bar (amber, same anatomy as the unsaved bar): "**2 files selected.** One of them is used on a page." + "Clear selection" + destructive outlined "Delete 2 files". The picker opened by "Choose from library" is this same view in a dialog, single‑select.

### 3b · New entry
Title row pre‑focused and tinted `#FBF6F3` with helper "Start here — this is the name shown in the website menu."; slug read‑only as above; status chip "Draft" (`circle-dashed`); a grey info bar (not amber) "Not on the website yet — give it a title, then publish." with secondary "Save draft" and a **disabled** Publish (`#EFEDE6` fill, `#8C8878` text). List item shows "Untitled page" italic until titled.

### 3c · Empty / no‑result states
Each: icon 28px `#4A4740`, title 16px/700, one sentence 15px `#4A4740`, one resolving action. Copy: "No pages yet / Every page on the website starts here. / [Make the first page]"; "No pages match “anzacs 1919” / Try fewer words, or clear the search to see all 7 pages. / [Clear search]"; Media: dashed drop zone "No files yet / Drag images and PDFs here, or choose them from your computer. / [Choose files]".

## Motion — show what just happened
Every structural change should be visible as movement, not a jump cut. Keep it short and honest (150–250ms, `ease-out` for things appearing, `ease-in-out` for things moving); respect `prefers-reduced-motion` by dropping to instant.
- **Open / close a block**: animate height (measure, then transition `max-height`/`grid-template-rows: 0fr → 1fr`) with the body fading in 100ms behind it; the chevron rotates 180°. Closing the previously open block runs at the same time as the new one opens.
- **Scroll compensation**: when the accordion closes a block *above* the one being opened, adjust `scrollTop` by the closed block's height in the same frame so the clicked header stays where the pointer is.
- **Reorder (↑/↓ or drop)**: FLIP — record positions, reorder DOM, then transition `transform` 200ms so both rows visibly swap; the moved block gets a brief 2px `#2A507F` outline that fades over 600ms.
- **Insert**: the new block grows in from 0 height and opens in the same motion; the insert menu scales from 0.96→1 with a fade.
- **Remove**: block collapses to 0 height and fades; siblings slide up to fill.
- **Drag**: lifted row at 0.6 opacity, drop target dashed outline appears with a 120ms fade.
- **Unsaved bar**: slides down from the top on first change; Publish turns it green ("Published just now", `check`) for 2s before it slides away.
- **Full‑screen rich text**: overlay fades in 200ms and the content card scales 0.98→1; reverse on "Done writing".

## State (blocks field)
`blocks[]`, `openId`, `insertAt` (index | null), `confirmId`, `dragId`/`overIndex`, `fullscreenId`; page‑level `dirtyCount` + last published snapshot for Discard. Publish resets `dirtyCount`.

## Accessibility acceptance
All text ≥ 4.5:1 (body ≥ 7:1); no status by colour alone (icon + word); every control has a visible 1.5px border; focus ring 2.5px `#A6432B`; hit targets ≥ 34px, rows ≥ 48px; `aria-expanded` on block headers, `aria-label` on ↑/↓/+ buttons.

## Assets
Lucide icons only: egg, settings-2, folder, image, log-out, panel-left-close, search, plus, check, circle-dot, circle-dashed, eye, layers, heading-2, align-left, book-open, grip-vertical, chevron-down/up, arrow-up/down, trash-2, bold, italic, list, link, maximize-2, upload, file-text, music, info, x, search-x, file-plus. No raster assets.
