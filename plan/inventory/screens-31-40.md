# Inventory: screenshots 31-40

All ten images were viewed. Hex values are estimated by eye from the screenshots, not sampled. Screenshots 31-36 are 1200x675 PNGs; 37-40 are 3840x2160 JPGs (so their type looks larger, but proportions are the same). Every image carries a "DEVELOPMENT BUILD : LOCALISATION IN PROGRESS" watermark bottom-left, which is not part of the UI.

## screenshot-31 — Club overview (Home Club)

- **Layout**: Four horizontal bands fill the window. (1) TopBar ~6% height. (2) SubNav + ShortcutBar ~4%. (3) Borderless club header ~8% (crest, name, kits left; facts strip right) and (4) a row of 7 borderless stat tiles ~8%, separated by thin vertical dividers. (5) One large Card fills the remaining ~70%, split into 4 columns ~27/25/27/21 separated by thin vertical dividers rather than separate cards. Each column scrolls independently. A card footer strip (~4%) holds "Minimise Table" (left) and "Show Tiles" (right). The page background is a blue team-tinted gradient with a faint diagonal pattern; the card is near-black and semi-opaque.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar | Blue (team-coloured) | Top | HistoryButtons + CrestIcon + PrimaryNav + utility icons + DateTimeBlock + ContinueButton |
| HistoryButtons | Back / forward, both enabled | Top-left | Two square light-blue buttons with chevrons |
| PrimaryNav | No item selected (viewing another club) | TopBar | Condensed uppercase labels, each followed by a chevron for a dropdown: PORTAL, SQUAD, TACTICS, RECRUITMENT, TRAINING, CLUB |
| SearchField | Collapsed trigger (icon + "Search") | TopBar right | Not an open input |
| IconButton | Ghost, icon only | TopBar right (bookmark, headset, pencil, cog) | 4 in a row |
| DateTimeBlock | Default | TopBar right | Two lines (bold "WED 14/10/2026", muted "Club T In 3 days") + boxed time pill "00:00" |
| ContinueButton | Default | Top-right | Magenta-to-pink gradient, label left, double-chevron icon right, full top bar height |
| SubNav | "Overview" selected (white text + underline) | Under TopBar, left | Leading entity switcher ("Home Club" with crest and up/down stepper), then text items; most have dropdown chevrons |
| EntitySwitcher (new) | Default | SubNav far left | Crest + name + stacked up/down chevrons to step between sibling entities |
| ShortcutBar | Default | Under TopBar, right | 5 outlined pill buttons (icon + label) + trailing overflow chevron button |
| PageHeader (new) | Club variant | Band 3 | Large CrestIcon, title, flag + nation, 3 kit images, then fact items |
| KitIcon (football) | Home / away / third | Header | Shirt illustration; maps to a generic Image/Avatar slot |
| FactItem (new) | Label over icon + value; one is a link | Header right (Form, Professional Status, Founded, Stadium, Nickname, Reputation, Women's Team) | Tiny muted label, icon + value below. Last one is a teal link |
| FormIndicator | 5 small squares, green and red | Header "Form" | Tiny coloured blocks, one offset lower (loss) |
| StatValue | Tile variant, 7 tiles | Band 4 | Muted label, then icon/avatar/crest + bold value + muted sub-line (e.g. "11th / In League A", "Person O / 55% Win Rate") |
| ScoreBox (new) | Final result | "Last Result" tile | Team code + crest, boxed "1 - 4", crest + code; competition tag "League A" top-right |
| Avatar | Photo (players), silhouette placeholder (manager) | Stat tiles, news | Circular |
| CrestIcon | Many sizes (12px inline to ~40px header) | Everywhere | Club badge image |
| Card | Large container with internal column dividers | Main | Rounded ~8px, 1px subtle border, dark translucent surface |
| SectionTitle | Link style: pink/lilac, bold, underlined | Top of each column ("First Team Squad", "About Club", "Transfer History", "Home Club News") | Acts as a navigation link to the full screen |
| DataTable | Dense, zebra rows, sortable header | First Team Squad | Columns: Picked (sort arrow up), Inf, Surname, Position, Rating. Row height ~21px. Tiny muted header text |
| PositionPill (new; Tag variant) | Colour by position group: GK olive/grey, D teal-green, DM green, M blue, ST magenta, substitutes S2-S8 dark outlined | Squad table "Picked" | Small icon + short code in a filled rounded rect, fixed width |
| Tag | Green filled "Wnt" (wanted) and "Set" | Squad table "Inf" | Tiny 3-letter status tag |
| RatingPill (new; Badge variant) | Grey (below ~7.0), green (7.0+), brighter green (8+) | Squad table "Rating" | Rounded pill, dark text on colour, 2-decimal number |
| LineChart | Single series, categorical Y | "League History" | See chart note below |
| List | Grouped with sub-headers | "Honours" | Group header = competition crest + name; rows = "Runner-Up (1)" left, years right; divider between groups |
| Select | Default, closed | Transfer History ("Season 2026/27", "All Transfers") | Outlined dark pill with chevron |
| IconButton | Prev / next chevrons, borderless | Between the two selects | Pager for seasons |
| GroupHeader (new; cf. DateGroupHeader) | Icon + title with count + total | "Transfers In (11) £102M", "Transfers Out (33) £163M" | Circular arrows icon (green/red), title, muted total below, right-aligned footnote "*Contains further transfer clauses" |
| DataTable | Compact, no zebra, row dividers | Transfer lists | Columns PL (player) / From or To (crest + club) / Fee |
| NewsCard | Hero variant | News column top | Image (16:9), headline (bold, 2 lines), excerpt (clamped 2 lines), meta row: clock icon + "15h ago", divider, tags "Statement", "Home Club", arrow |
| NewsCard | Compact list variant | "More Stories" | Square thumbnail (image or score graphic "1 - 4"), title (2 lines), meta row with time + tag + arrow |
| Button | Ghost text + icon | Card footer ("Minimise Table", "Show Tiles" with chevron) | Collapse/expand controls for the layout itself |

  Chart detail — **League History**: line chart on a slightly lighter inset panel. Y axis is ordinal with 3 ticks labelled League A / League B / League C (league tier), each with a full-width horizontal gridline; no Y title. X axis is seasons, labelled every third season ("06/07, 09/10, 12/13, 15/16, 18/19, 21/22, 24/25"). One light-grey line with small circular markers at every season; position within a tier band encodes finishing position. Two markers are green (promotion seasons). No legend, no tooltip visible.
- **Scroll / truncation evidence**: Thin vertical scrollbars on the squad table, About Club column, transfer list and More Stories. Squad table clips its last row ("S8 Person P") at the card footer. Position text truncates with ellipsis ("D (RC), DM,...", "AM (RC), S..."). News excerpt is clamped ("...how he faced the pr..."). ShortcutBar has an overflow chevron. Honours list is cut off mid-group.
- **Unusual / new**: Whole-screen layout can be reconfigured from the card footer (minimise the table, show/hide tiles). Section titles are underlined links. The four "columns" live inside one card rather than four cards. Ordinal-tier line chart.

## screenshot-32 — Portal: competitions grid

- **Layout**: TopBar + SubNav/ShortcutBar as before, then a 5-column grid of equal-width cards (~19% each, ~10px gutters) filling the window. Column 1 holds one tall card spanning both rows; columns 2-5 each hold two cards stacked ~50/50. The bottom row is cut by the window edge, so the grid itself scrolls or is clipped.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar | Blue; PORTAL selected (white, others muted blue-white) | Top | Same anatomy as 31, different crest |
| SubNav | "Portal" bold as section label; items Overview, Messages, Calendar, News, Data Hub, Competitions, Career | Under TopBar | No underline visible on any item (landing page) |
| ShortcutBar | Default | Right | Same 5 buttons |
| Card | Branded-header variant; one tall (2-row span), eight regular | Grid | Header band tinted with the competition colour (purple, olive-gold, charcoal, maroon, red, grey, pale grey, crimson), fading into the dark card body |
| CardHeader (new) | Logo + title + flag/nation link + collapse chevron | Each card | Title is bold ~16px; League E and League G titles are underlined teal (link/hover state), others white with underline |
| KeyValueRow (new) | Label left, icon + linked value right | "Current Holders", "Highest Average Rating" | Divider between rows; value underlined (link) |
| DataTable | Mini standings, ultra dense (~14px rows) | Each card | Columns Pos, movement arrow, crest, Team, Pld, Won, Drn, Lst (+GD in the tall card). No zebra |
| RowAccent (new) | 3px left bar: blue, green, teal, orange, red | Standings rows | Encodes qualification zone; keyed by the legend below |
| TrendArrow (new) | Up (green), down (red), none | Standings | Position change since last round |
| Legend | Inline, colour bar + label | Under each table ("Competition A, Competition B, Competition C, Rel." / "Ch., Prom., Top P/O, Rel.") | Shared component with chart legends |
| DataTable row | Highlighted: red/orange text ("Home Club") | League A card | Marks the user's club |
| SectionTitle | Plain condensed uppercase ("TOP PERFORMERS") | Tall card bottom | Not a link |
| List | Avatar + two-line text + trailing value | Top Performers | Label ("Highest Average Rating"), name with icon, right-aligned RatingPill (green 8.02) or plain number |
| SectionTitle | Plain bold sentence-case | League H card ("League H Eastern Conference League Table") | Wraps to 2 lines |
| CrestIcon / Avatar | 12-14px inline | Tables, key-value rows | |

- **Scroll / truncation evidence**: Each card's table has its own thin scrollbar (10 of ~20 rows visible). Team names ellipsised heavily ("Club U...", "Club V...", "Club W..."). Bottom-row cards and the Top Performers list are clipped by the window. Legends wrap or clip at card bottoms.
- **Unusual / new**: Per-card brand-coloured header gradient (a `tone`/`accentColor` prop on Card). A grid where one card spans two rows. Nine independently scrolling tables on one screen.

## screenshot-33 — Cup draw (Cup B, Second Round)

- **Layout**: TopBar + SubNav/ShortcutBar, then 2 columns ~19/81. Left: one full-height Card (competition header, host, team list, legend). Right: one full-height Card with a title, a fixture list, and a sticky bottom ActionBar. Background is competition green rather than team blue.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar | Blue; Continue button relabelled "Messages" | Top | ContinueButton label is contextual (next required action) |
| SubNav | EntitySwitcher "Cup B"; "Stages" selected (underline) | Under TopBar | Items: Overview, Stages, Fixtures, News, Team Stats, About, Clubs |
| ShortcutBar + Badge | Count badge "1" (purple, top-right corner) on Messages and Transfer Activity | Right | Badge overlaps the button edge |
| Card | Branded header (green gradient) | Left | Logo + title + thin rule + subtitle "Second Round" |
| KeyValueRow | Stacked: muted label, Avatar + name | "Hosted By" | |
| List | Dense (~11px rows), three text states | Left team list | Row: left accent bar, crest, name, division crest + code. States: dimmed grey (already drawn), white bold (still in the pot), red (user's club). Accent bar green = eligible, red = not eligible |
| Legend | Inline | Bottom of left card | "Not Eligible / Eligible" with colour bars |
| SectionTitle | Plain bold | "Second Round" | |
| FixtureRow (new; List item) | Zebra; complete and half-drawn | Right list | Division tag far left, home name right-aligned + crest, "V", crest + away name, division tag far right. Centre-mirrored layout. Last row has only a home team (draw in progress). User's club in red |
| Tag | Icon + code, no fill (League B, League A, League C, League D) | Both ends of fixture rows and left list | |
| ActionBar | Sticky bottom of card | Right card footer | Left: speed Select "1.0x" with icon. Right: 4 buttons |
| Button | Primary magenta ("Pause Draw"), primary disabled/dimmed ("Start Draw"), secondary outlined dark ("Draw All Teams", "Draw Next Team") | ActionBar | All have a leading icon (play, pause, fast-forward, step) |
| Select | Compact, with leading icon | ActionBar left | Playback speed |

- **Scroll / truncation evidence**: Scrollbar on the left team list; list is clipped at the legend. Fixture list is clipped at the bottom (the 18th row is half-filled and more follow). "Transfer Activit" is clipped by its badge.
- **Unusual / new**: A live, animated "draw" surface: a media-style transport (start / pause / step / all + speed select) driving a list that fills in over time. Three-state list rows (pending / done / self).

## screenshot-34 — Advanced Setup with "Continue Flow" modal

- **Layout**: A pre-game screen with no TopBar or nav. Page title top-left. Left rail ~21% with stacked setting cards (one select, two full-width cards, then two half-width cards side by side). Right ~77%: toolbar row (button left, segmented control right), then a table. A bottom bar spans the window. Everything is dimmed by a backdrop. The Modal is centred, ~39% wide and ~72% tall.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| Modal | Medium, with backdrop | Centre | Close IconButton (boxed X) top-right, title, description, body, dividers, right-aligned footer. Surface slightly lighter than the page, 1px border, ~8px radius |
| RadioCardGroup (new) | 4 options; one selected; one inactive with nested action | Modal body | Each card: radio circle, vertical divider, icon, bold title, one-line description. Selected = solid purple fill, filled radio, white text. Unselected = dark with 1px border. "Custom" is dimmed and carries a trailing "Customise" button with an external-link icon |
| SegmentedFilter | 2 options, first selected (purple fill) | Modal "Continue Button" section; also page top-right ("Men's Leagues (6)" selected / "Women's Leagues (3)") | Joined buttons, counts in parentheses |
| Button | Primary magenta ("Confirm", "Add Nations" with trailing plus icon), neutral grey ("Cancel"), secondary outlined with icon ("Customise"), dimmed behind backdrop ("Load Database" with check, "Cancel" with X) | Modal footer, page | |
| SectionTitle | Plain bold (modal) and condensed uppercase (rail cards: TRANSFER MODE, CONTINUE FLOW, PREFERENCES, ADVANCED SETTINGS) | Modal, left rail | |
| SettingCard (new; Card variant) | Collapsible with chevron; clickable | Left rail | Uppercase title, large current value ("Original", "Comprehensive"), muted description, large faint watermark icon bottom-right |
| Badge | "NEW" green pill | Continue Flow card | Top-right corner of the card |
| Select | Default, with leading flag; wide table-cell variant | Game start date, nations table, bottom bar | Two-line label in the start-date select |
| DataTable | Editable rows | "Active Men's Nations (2)" | Columns Nation (flag + name), League Selector (Select), Setting (Select "Playable"), delete IconButton |
| IconButton | Trash, info | Table rows, bottom bar | |
| ActionBar | Page footer | Bottom | Left: Select "Game Setup", label + Select "Total Player Count 23400", info icon. Right: Cancel, Load Database |

- **Scroll / truncation evidence**: None in the modal. Behind it, the table's League Selector column is hidden by the modal.
- **Unusual / new**: Radio options rendered as large cards with a nested action button inside one option. Watermark icons inside setting cards. This screen has no accent top bar, which shows the neutral base palette clearly (charcoal greys, purple selection, magenta primary).

## screenshot-35 — Heat Map modal (Data Hub)

- **Layout**: Large Modal ~58% wide and ~71% tall over a dimmed Data Hub page. Three columns inside: ~27/37/36. Left = analyst + summary on a darker inset panel; middle = title, segmented filter, selectable player table; right = pitch visualisation with caption. A legend strip is centred across the bottom of the middle and right columns. Behind: a page header (crest, name, facts), Tabs, and chart cards.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| Modal | Large, multi-column, no footer buttons | Centre | Close IconButton top-right outside the content columns |
| Avatar | Silhouette placeholder, square-ish | "Tracked by" | With name (icon + text) and muted role line |
| SectionTitle | Plain bold ("Summary", "Heat Map") | Modal | "Heat Map" has a subtitle "Club A v **Home Club**, 12/9/2026" (bold for the tracked team) |
| SegmentedFilter | 3 options, first selected (purple) | Middle | Combined / In Possession / Out of Possession; separated buttons, not joined |
| DataTable | Selectable rows, zebra, one selected | Middle | Columns: Sel. (Checkbox), shirt-number icon, Avatar, name. Selected row = purple tint, checked checkbox |
| Checkbox | Unchecked (white outline box), checked (white box with tick) | Table | Square, ~12px |
| ShirtNumberIcon (football) | Kit shirt with squad number; GK in a different colour; blank for unnumbered | Table | Maps to a generic Badge/Avatar with text |
| Pitch | Full pitch, vertical, with heatmap overlay | Right | See chart note |
| Legend | Gradient scale | Bottom | "Lowest Concentration" + 6 swatches (grey, green, yellow, orange, salmon, red) + "Highest Concentration" |
| CrestIcon | Competition badge | Modal top-right of middle column | |
| Tabs | 2 tabs, first selected (purple fill, dimmed by backdrop) | Background page ("Key Findings", "Player Statistics") | Button-style tabs |
| Select | With secondary muted text | Background, right ("League A Saturday 12th September 2026") | |
| LineChart | Step line, 2 series | Background "XG MATCH STORY" card | Cumulative xG step chart, red series visible; inline legend "Club A / Home Club"; footer "Goals: 1 - 1" |
| Card | Collapsible (chevron), uppercase title + subtitle | Background | "HEAT MAP - PERSON Q" repeats the pitch at card size |
| Tooltip / cursor | Pointer over the background card title | Right | No tooltip visible |

  Chart detail — **Heat map**: a vertical pitch outline (white 1px lines on near-black: boundary, halfway line, centre circle, both penalty boxes, six-yard boxes, penalty spots, corner marks) with a blurred density overlay. Colour ramp is green (low) through yellow and orange to red/pink (high), with transparency at the edges so the pitch shows through. Caption below: up-arrow + "Direction of Play", then a muted note "Heat map positions based on GPS data".
- **Scroll / truncation evidence**: The player table is clipped at the bottom (a 14th row is partially visible), so it scrolls. Background cards are cut by the modal.
- **Unusual / new**: A master-detail modal where a checkbox table drives a visualisation. A heatmap layered on a field diagram; generically this is a `Heatmap` overlay on an arbitrary SVG backdrop.

## screenshot-36 — Match day dashboard

- **Layout**: No TopBar. A thin toolbar row (left: 5 buttons; centre: scoreboard; right: 3 icon buttons). Below, a dense mosaic of ~17 cards in roughly 7 columns, symmetric around the centre: home team on the left, away team on the right. Top row ~35% height: home formation card (~28% wide), then four small cards in a 2x2-ish block (heat map, momentum, average positions; dugout, events, xG story below), away formation card (~28%). Lower row: home pass map, live table (full height), centre match-stats card, latest scores, away pass map. A red notification banner sits above a full-width bottom strip of player chips. Cards do not share a common height; they pack like a masonry grid.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| Toolbar (ActionBar) | Top-left group | Top | Buttons with icon + label: Tactics, Instructions, Balanced (dropdown), Shouts (dropdown), Tweaks (dropdown) |
| Scoreboard (new) | Live | Top centre | Team code on team-colour fill (red "Club X", navy/yellow "Club Y"), white score box "1-0", white clock box "20:49" |
| IconButton | Neutral (settings, layout), accent purple (pause) | Top-right | Small squares |
| Card | Collapsible (chevron top-right), condensed uppercase title + optional subtitle | Everywhere | Tighter padding than other screens |
| Pitch + FormationView (football) | Vertical half-and-half layout, shirts in team colour with number, name below, tiny rating/condition pills | Both formation cards | Maps to a positioned-node diagram |
| Select | Small, icon + "Key Statistics" | Formation cards | Chooses table columns |
| DataTable | Dense, zebra | Formation cards | Columns: Pkd (PositionPill), Player, Goals, Assists, Rating (RatingPill: grey ~6.x, green 7.3/7.4) |
| PositionPill | GK grey, D teal, DM green, M blue, AM purple, ST magenta, WB teal | Formation tables | Same colour system as screenshot 31 |
| Pitch (heatmap) | Small | "HEAT MAP - PERSON R" | With "Low [swatches] High" legend and note |
| BarChart | Diverging, 2 series | "MATCH MOMENTUM" | See chart note |
| Pitch (scatter) | Numbered circular nodes, one team (blue) | "AVERAGE POSITIONS" | Caption "Direction of Play" |
| Pitch (network) | Numbered nodes, home red / away blue | "PASS MAP" cards | Nodes positioned by average location; no visible link lines at this size |
| LineChart | Step, 2 series | "XG GRAPH STORY" | See chart note; followed by a stat line and a paragraph of analysis |
| ProgressBar / Slider | Thin track with a boxed value at the left end and a marker at the right | "DUGOUT" top | Looks like a timeline scrubber for the match |
| SegmentedFilter | 3 options, middle selected (green outline "3 - 1") | Dugout | CAM / 3-1 / STP |
| DataTable | Mini live table (5 rows) and full live table (20 rows) | Dugout, "LIVE TABLE" | Pos, TrendArrow, crest, Club, Pld, Pts; RowAccent bars (green/purple/red) |
| NotificationPrompt (new) | Inline, actionable | Dugout bottom | Icon + "Score Update", text, primary Button "Do it" (magenta, with check), dismiss IconButton (X), prev/next IconButtons |
| List | Event timeline | "MATCH EVENTS" | Header row with crests and score; item = ball icon + minute + scorer + assist |
| List | Results | "LATEST SCORES" | Home name + crest, score, away crest + name; centre-aligned score column |
| StatComparison (new) | Two mirrored key/value lists around a central visual | Bottom centre | Rows: Shots, Shots On Target, xG, Distance Covered, Passes Completed, Corners, Tackles, Fouls, Yellow cards, Possession. Values in small boxed pills. Centre: pitch split red/blue in proportion to possession. "View Stats" Button under each list |
| Banner / Toast (new) | Red, full-width, rounded | Above bottom strip | Live commentary line "Person S...now to Person T" in the team colour |
| PlayerStatusStrip (new) | 11 starters + subs | Bottom | Chip = position code + heart icon (condition, green) + RatingPill. Left chip "5/5 Subs"; separate group for the bench |

  Chart detail — **Match Momentum**: bar chart with a horizontal zero line through the middle. Home bars (red) rise above it, away bars (blue) hang below. X is match time, split into two labelled halves ("1st Half", "2nd Half") by a vertical line; only the first ~20 minutes are populated. A ball icon marks the goal above its bar. No Y labels. Legend at the bottom: red dot "Club X", blue dot "Club Y".
  Chart detail — **xG Graph Story**: step line chart of cumulative xG, X = time with a vertical half-time divider and a "First Half" label, Y unlabelled. Home series red, away series near-flat. A ball marker sits on the home line at the goal. Tab-like legend "Club X | Club Y" above. Below: "Goals: 1 - 0   xG Total: 0.72 - 0.15" and prose analysis.
- **Scroll / truncation evidence**: Scrollbar in the dugout mini-table. Ellipsis in Latest Scores ("Club Z...", "Club AA...", "Club AB..."). Titles truncated ("CLUB Y PASS MAP" fits, player names shortened to initial + surname).
- **Unusual / new**: A widget-board layout with collapsible cards of mixed sizes (candidate for a `DashboardGrid`). Mirrored home/away composition. Team colours used as data colours across every chart on the screen. A commentary banner and a persistent bottom status strip.

## screenshot-37 — Training overview (club)

- **Layout**: TopBar + SubNav/ShortcutBar. Body is 2 columns ~79/21. Left: a row of 4 equal summary tiles (~9% height), then one large Card with the calendar filling the rest. Right: 4 stacked Cards with heights ~18/37/17/17 (content-sized, not equal). Background is a teal-to-magenta gradient; the calendar card is teal-tinted.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar | Blue; TRAINING selected (white text + short white underline bar) | Top | Selected state for PrimaryNav is now visible |
| SubNav | Section label "Training" (condensed bold) + divider; "Overview" selected (underline); one item has a dropdown ("Medical Centre") | Under TopBar | |
| ShortcutBar | Default | Right | |
| SummaryTile (new; Card variant) | 4 tiles | Top row | Square icon block left, condensed title, value line (can truncate), expand IconButton (arrows-out) right |
| Card | Large, tinted | Calendar | SectionTitle link ("Training Schedule", pink underlined) |
| Select | Month ("October 2026"); row-level ("Tactical Focus - In Possession"); row-level truncated | Calendar toolbar and left column | |
| IconButton | Prev / next, outlined squares | Calendar toolbar | |
| Button | Secondary outlined ("Today" - dimmed/disabled here, "Copy", "Clear"), disabled ("Paste" in one row), hover/focus ("Paste" with cursor) | Calendar | |
| Calendar | Month grid, week rows, 7 day columns + a leading control column | Main | Each week row: left control cell (label "Schedule Focus", Select, "Intensity" + ProgressBar, Copy/Paste/Clear) then 7 day cells. Each day cell: date pill header + 3 stacked ScheduleSlots |
| DateChip (new) | Default (dark pill, white number), today (purple pill, and the whole day column cell is purple-tinted), month-boundary ("1 Nov") | Day headers | |
| ScheduleSlot | Colour by category: green (team tactical/attacking sessions), blue (defensive/pressing unit sessions), magenta (individual development), red (recovery / conditioning), grey (rest, travel); dimmed for past days | Day cells | Icon + label in a bordered, tinted rounded rect; label truncates without ellipsis ("Individual Developme") |
| ScheduleSlot | Match variant | e.g. "Club AC League A A", "Club AD Competition C A", "Club AE Cup B H" | Opponent crest + code, competition icon + code, divider, H/A. Fill follows competition (purple league, black European, green cup) |
| ProgressBar | Thin, green, ~45-55% | "Intensity" | Rounded track, no label or value |
| KeyValueRow | Stacked label/value | Next Opposition Report ("Form", "Most Used Formation") | |
| FormIndicator | 5 small marks, pink/red | Next Opposition Report | Dots and blocks, tiny |
| LevelMeter | Segmented vertical ticks (~10), one highlighted tick, in a bordered box | Tactical Effectiveness card | Highlight colour varies by level: orange (low), yellow (mid), green (high). Ticks before the highlight are lit grey/orange, after are dim |
| DataTable | 2 columns (Area / Levels), zebra | Tactical Effectiveness | Label + LevelMeter per row |
| List + PersonDots (new) | Role label (pink link or white) + row of person icons | Coaching Team | Icons pink/blue for assigned staff, grey for empty slots (a capacity meter made of icons) |
| List | Fixture rows | Fixture Schedule | Date, competition icon + code, opponent crest + name |
| SectionTitle | Condensed uppercase, with collapse chevron | Sidebar cards | |

- **Scroll / truncation evidence**: Calendar is scrolled mid-month (previous week's slots are cut at the top, last week cut at the bottom). Slot labels are clipped by the cell edge without ellipsis. Select text ellipsised ("Tactical Focus - Out Of Poss..."). Tile value ellipsised ("...Tiki-Ta..."). Scrollbar in the Coaching Team card; role label clipped ("Coaches (General,"). Fixture opponent clipped ("Club W").
- **Unusual / new**: A month calendar with fixed 3-slot days and a per-week control column on the left (focus select, intensity bar, copy/paste/clear of a whole week). Category-coloured slots. LevelMeter as a tick strip with a single coloured marker rather than a filled bar.

## screenshot-38 — Training overview (national team)

- **Layout**: Same as 37, but only 2 summary tiles (each ~50% of the left column). Sidebar cards identical in structure. Purple background, purple-tinted cards. Calendar scrolled to the top of the month.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar | **Light grey** surface with dark text and dark icons | Top | Shows the top bar is fully themeable, including a light variant on a dark page. HistoryButtons become grey; ContinueButton stays magenta |
| PrimaryNav | Different item set (PORTAL, SQUAD, TACTICS, NATIONAL POOL, TRAINING, NATION); TRAINING selected (dark text + dark underline bar) | TopBar | Items are data-driven, not fixed |
| CrestIcon | Flag (rectangular) instead of round crest | TopBar | |
| SubNav / ShortcutBar | Grey variant; shortcut "National Shortlist" replaces "Transfer Activity" | Under TopBar | Follows the top bar theme |
| SummaryTile | 2 wide tiles | Top row | Same anatomy |
| Calendar | With empty weeks | Main | Weeks 3-5 show day headers only |
| EmptyState | Inline, text only, centred across the 7 day columns | Empty weeks | "Squad not due to meet up" |
| Select | Enabled; disabled (dimmed text "Full Week of Rest") | Left control column | |
| ProgressBar | Pink/magenta fill (~45%, ~30%); empty track (0%) for disabled weeks | "Intensity" | Fill colour differs from 37 (green there), so it follows theme or value |
| Button | "Today" enabled (lighter than in 37); "Paste" disabled | Calendar | |
| ScheduleSlot | Same categories; match variant in olive/gold ("Club AG Competition D A", "Club AH Competition D H"); rest slots brighter grey | Day cells | Ellipsis is used here ("Out Of Possession...", "Defensive Position...") |
| DateChip | Default; month boundaries "28 Sep", "1 Oct", "1 Nov" | Day headers | |
| LevelMeter | Yellow and orange highlights | Tactical Effectiveness | |
| List + PersonDots | Pink, blue, grey icons | Coaching Team | "Goalkeeping Coach" in blue link colour |
| List | Fixture rows with more columns | Fixture Schedule | Date, comp, flag + home, away, H/A, kick-off time |

- **Scroll / truncation evidence**: Ellipsis in slots, select, opposition subtitle ("Competition D..."), fixture teams ("Club AI...", "Club AF..."). Scrollbar in Coaching Team; last row clipped ("Fitness Coach"). Calendar and Fixture Schedule clipped at the bottom.
- **Unusual / new**: The light top bar on a dark app. An empty state that spans a row of a calendar grid. The same screen reused with a different nav set, tile count and accent hue, which argues for theme tokens rather than hard-coded colours.

## screenshot-39 — Tactical Effectiveness breakdown

- **Layout**: TopBar + SubNav/ShortcutBar, then one Card filling the whole body. Inside: a header row (tactic chip left, overall meter right), a title + description row with a Toggle on the right, a "Breakdown" heading, then 4 sub-cards of equal height in columns ~40/19/19/19. The first sub-card is split into two inner columns by a vertical divider. Each sub-card pins a feedback callout to its bottom; the space between is empty, so cards stretch to fill the window.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar / PrimaryNav | Blue; TRAINING selected | Top | |
| SubNav | "Tactical Effectiveness" selected (underline) | Under TopBar | |
| ShortcutBar | 5 buttons, last is "Training" (set differs from 37) | Right | Shortcuts are user-configurable |
| Tag / Button | Purple filled, bright border ("Positive 4-2-3-1 DM AM Wide - Control Possession") | Card top-left | Selected-tab look; probably a single-item Tabs or selector |
| LevelMeter | Labelled ("Overall Effectiveness"), yellow-green highlight | Card top-right and each sub-card header | Same tick-strip anatomy as 37 |
| Toggle | Off (dark track, white knob left), label on the left ("Player View") | Right | |
| SectionTitle | Plain bold, two sizes ("Tactical Effectiveness", "Breakdown"); with leading icon inside sub-cards | Card | |
| Card | Nested sub-card, slightly lighter surface, no visible border | Breakdown row | Header: icon + title + LevelMeter; body: description, table, callout |
| DataTable | 2 columns, zebra, no header row except a "Key Factors" label and a right-aligned column caption ("Tactical Areas", "Tactical Comprehension") | Sub-cards | Row: small icon + label + trailing PieIndicator |
| PieIndicator (new) | Small segmented disc (~8 wedges). Full bright green = high; partly yellow-green; partly orange; grey/olive = low | Trailing cell of each factor row | A circular level gauge: both fill amount and hue encode the level |
| Callout (new) | Positive (green tint + green border, light green text), neutral (dark with 1px grey border) | Bottom of each sub-card | Short feedback sentence |

- **Scroll / truncation evidence**: None; content is short and the layout leaves large empty areas. One callout wraps to 2 lines.
- **Unusual / new**: Two different level encodings side by side (tick-strip LevelMeter and pie-wedge PieIndicator). Callouts pinned to the bottom of stretch-height cards. A card that contains an internal two-column split.

## screenshot-40 — Tactical Effectiveness popover over Player Database

- **Layout**: The Player Database page is blurred as a backdrop: Filters row, one large table card (~70% height) with a footer strip, then a row of 6 tiles (~16% height). A popover (~29% wide, ~54% tall) is anchored top-right over the table's rightmost columns.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| Tooltip (rich) / Popover | Large, bordered | Top-right | 1px bright purple border, ~10px radius, charcoal surface. Title + LevelMeter header, divider, mini table, divider, description paragraph. No close button, so hover-triggered |
| LevelMeter | White/neutral highlight (3 lit ticks) and yellow single-tick highlight | Popover | A second "range" reading: several adjacent ticks lit white suggests an uncertain or projected range rather than one value |
| DataTable | 2 columns (Area / Levels), zebra | Popover | Same content as the sidebar card in 37 |
| TopBar / PrimaryNav | Blue; RECRUITMENT selected | Top (blurred) | |
| SubNav | EntitySwitcher "Recruitment"; "Player Database" selected | Blurred | Items with dropdowns: Scouting, Planner, Brand A, Transfers, Staff Recruitment |
| SectionTitle | "Filters" | Above table | |
| Button | Ghost ("Clear"), secondary with chevron ("Quick Filters"), primary magenta ("Edit Search") | Top-right, blurred | |
| Toggle | On (magenta track) with label on the left ("Scouted players only") | Table header | |
| StatValue | Inline count ("496 Players Found") | Table header | Bold number + muted label |
| DataTable | Wide, selectable, zebra | Main | Columns: Checkbox, Inf, Player (avatar + name), Position, Best Pos, Best Role (IP), Best Role (OOP), Cons, Pros, star ratings x2, LevelMeter, grade Badge + text. Some names in blue (link/shortlisted) |
| Checkbox | Unchecked | Row lead | |
| Tag | Green "Wnt", "Sct" | Inf column | |
| StarRating (new) | 5 stars, gold filled / grey empty, half stars | Right columns | Two columns (current / potential) |
| Badge | Circular green grade ("B", "A+") + text | Last column | |
| Button | Ghost with icon ("Expand Table", "Hide Tiles") | Table footer | Same layout controls as 31, inverse labels |
| SummaryTile / Card | 6 tiles, uppercase titles, some collapsible | Bottom row | Transfer Window (red X icon + "Closed"), Scouting Range, Player Recommendations, Shortlists, Recruitment Budgets (3 KeyValueRows: Transfer / Wage / Scouting), Recruitment Focuses |
| ProgressBar | White, full | Recruitment Focuses tile | With 3 circular count indicators above (orange, green, grey rings with a digit) |

- **Scroll / truncation evidence**: Table scrollbar at the right; last row clipped. Ellipsis in cells ("Pressing Wing-B...", "Attacking midfiel...", "Regular starter who c..."). The popover covers columns.
- **Unusual / new**: A hover card that embeds a whole mini-dashboard. LevelMeter with a multi-tick lit range. The backdrop blur is a marketing treatment and probably not a product feature.

## Cross-screen observations

- **Colors** (estimated by eye):
  - App background: deep navy `#0E1020` to `#141627`, always overlaid with a large theme gradient and faint diagonal shapes. The gradient hue changes per context: team blue (31, 32), competition green (33), teal-to-magenta (37), purple (38, 39, 40), neutral charcoal `#17181D` (34, 36).
  - Card surface: `#161927` to `#1B1E2C`, slightly translucent so the gradient tints it. Nested or inset panels are a step lighter (`#22263A`) or darker (`#10121C`). Modal surface `#1E2028`. Zebra rows alternate with about +4% lightness.
  - Borders: 1px `#2A2E40` to `#3A3F55`; dividers the same colour at lower opacity. Outlined buttons use `#4A4F63`.
  - Text: primary `#FFFFFF`; secondary `#C5C9D6`; tertiary/labels `#8B90A3`; disabled `#5A5F70`.
  - Primary action accent: magenta, a gradient from about `#C4008F` to `#FF2D6F` on the Continue button; flat `#D1009A` on primary buttons.
  - Selection accent: violet `#5B21D6` to `#6D28D9` (selected segment, selected radio card, selected row, today chip, popover border in a lighter `#A855F7`).
  - Link/section title accent: pink-lilac `#F0A6FF` to `#E879F9`, underlined. Secondary link colour teal `#2DD4BF` (31, 32) and blue `#60A5FA` (38, 40).
  - Semantic: success green `#22C55E` (bright `#39E75F` on pie indicators and ratings); warning yellow `#FACC15` and orange `#F59E0B`; danger red `#E11D48` to `#EF4444`. Rating pills: grey `#8E94A3` below 7.0, green above. Position groups: GK `#6B7280`/olive, D `#0F9D8A`, DM `#16A34A`, M `#2563EB`, AM `#7C3AED`, ST `#C026D3`.
  - Schedule categories (37, 38): green `#0F7B5F`, blue `#1D4ED8`, magenta `#A21CAF`, red `#B91C1C`, grey `#4B5563`.
  - Top bar: team-coloured. Blue `#0B4FA8` to `#0A3F8C` in 31, 32, 33, 35, 37, 39, 40; **light grey `#D4D4D8` with dark text `#27272A` in 38** (Club AF). The sub-nav strip is a darker shade of the same hue (`#0A2A5E`, or `#3F3F46` in 38). Absent in 34 and 36. The Continue button keeps its magenta in every theme.
- **Typography**:
  - Two families. A condensed, bold, uppercase sans (similar to Bebas Neue or Barlow Condensed Bold) for PrimaryNav, the date, the Continue label, sidebar card titles, and summary tile titles. A geometric/humanist sans (similar to Gilroy, Poppins or Inter) for everything else.
  - Scale at 1200px width: page title ~18px bold; card or section title ~13-16px bold; body ~11-12px regular; table cells ~10-11px; table headers and field labels ~8-9px in tertiary colour. Scales uniformly at 4K.
  - Weight carries hierarchy more than size: bold values next to regular muted labels. Numbers in tables are right-aligned or centred and look tabular.
  - Three SectionTitle styles: link (pink underlined sentence case), condensed uppercase white, plain bold sentence case.
- **Spacing / radius / borders / elevation**:
  - Very dense: table rows ~14-22px at 1200px width; card padding ~8-12px; grid gutters ~8-10px; page margin ~20px.
  - Radius: cards and modals ~8px; buttons, selects and slots ~4px; pills and badges fully rounded or ~4px; top bar elements square or 2px.
  - Depth comes from surface lightness and 1px borders, not shadows. Modals add a dark backdrop (about 60% black). Popovers use a coloured border instead of a shadow.
  - Inside a card, columns are separated by 1px dividers rather than nested cards.
  - Status is shown by filled colour blocks (pills, slots, accent bars), keeping text white.
- **Recurring layout patterns**:
  - Shell: TopBar (history, crest, primary nav, utilities, date/time, Continue) over a SubNav row (entity switcher or section label + items on the left, ShortcutBar on the right). Body fills the remaining viewport; the page does not scroll, individual regions do.
  - Optional header band of facts and a "tiles" row of summary stats, both togglable ("Show Tiles" / "Hide Tiles", "Minimise Table" / "Expand Table").
  - Main + sidebar (about 79/21) with a stack of collapsible cards in the sidebar (37, 38).
  - Equal-column card grids with independent scroll per card (32) and masonry widget boards (36).
  - Sticky action bars at the bottom of a card or page with secondary actions left and primary actions right (33, 34).
  - Modals for focused tasks, built from the same parts as pages (segmented filters, tables, charts).
  - Label-over-value pairs, icon + text everywhere, crest/flag/avatar leading most entity names.
  - Ellipsis truncation is the default overflow behaviour; a few places clip without ellipsis (calendar slots in 37).
  - The same components are rethemed by context (team, competition, nation) and the selection/primary accents stay constant.
