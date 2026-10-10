# Inventory: screenshots 21-30

All ten images were viewed. Proportions are estimates from the pixels; hex values are eyeballed, not sampled.

## screenshot-21 — Preferences modal, "Your World" (zoomed crop) with open Select menu
- **Layout**: Modal fills ~85% of the window over a dimmed, blurred page. Modal = header row (2 text tabs, close button top-right), body split ~25/75 (left vertical category nav / right scrolling settings pane, both inside one inset panel with a vertical divider), footer row (2 link buttons left, 4 action buttons right). Settings pane is a vertical stack of full-width setting rows; the "Landing Page" group is one tall row holding 6 label + select sub-rows. An open dropdown menu floats to the right of its trigger and extends outside the modal edge.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| Modal | Large, with scrim | Whole view | Dark surface, 1px lighter border, ~8px radius; page behind is dimmed and blurred but still legible |
| IconButton | Close (X), square outlined | Modal top-right | ~36px square, 1px border |
| Tabs | Text/underline variant; "Detailed" selected (white + underline), "Overview" unselected (grey) | Modal header | Large body-font labels, no container |
| VerticalNav (new) | Item selected ("Your World": solid purple fill, filled radio dot); 8 unselected (dark fill, 1px border, empty radio ring) | Left 25% | Each item = radio glyph + vertical divider + bold label. Behaves like a radio-group used as section nav |
| SettingRow (new) | Checkbox row; button row; grouped select rows | Right pane | Anatomy: bold title + grey one-line description on left, control right-aligned. Row has its own slightly lighter surface |
| Checkbox | Unchecked (outline), checked (white box, dark tick) | Right of rows 1-2 | Square, ~2px radius |
| Button | Secondary with leading icon ("Reset Tutorials", external/launch icon), full-width of control column | Tutorials row | Left-aligned label, dark fill, 1px border |
| Select | Closed, value "Overview", chevron right; 6 instances | Landing Page group | Same width as the button above (control column ~27% of modal) |
| Menu | Open; item selected-current ("Overview", muted grey-purple fill), item hovered ("Scouting", bright purple fill, cursor on it), 6 default | Right, overlapping modal edge | 8 visible items, own thin scrollbar on right edge |
| Button | Link-style with external-link icon ("Community", "Support"), purple-tinted outline | Footer left | Small |
| Button | Secondary ("Reload Skin", "Reset Layouts", "Reset To Default") | Footer right | Grey fill, 1px border |
| Button | Primary / confirm, magenta fill, leading tick icon ("Confirm") | Footer far right | Only magenta element in the modal |
| DataTable, Card, ProgressBar, SectionTitle | Dimmed behind scrim | Background | League table, Data Hub EmptyState text, wage ProgressBar visible through the scrim |

- **Scroll / truncation evidence**: Thin vertical scrollbar at the right edge of the settings pane (thumb spans lower ~60%). Menu has its own scrollbar (thumb full height minus a little, so more items below "Staff Recruitment"). Top of the settings pane is cut mid-list (first row starts at the pane edge, so content is scrolled).
- **Unusual / new**: Menu opens sideways/overflows the modal bounds rather than dropping directly under the trigger (needs a portal + collision handling). Two distinct "active" colours in one menu: current value (muted) vs hover (saturated). Radio glyphs used for navigation, not form input.

## screenshot-22 — Training session picker modal
- **Layout**: Standard chrome (TopBar + SubNav/ShortcutBar row), then a modal covering ~97% width and ~80% height. Modal is three stacked bands: (1) week strip card, ~25% height, title row + 7 equal day columns; (2) category button-tabs row; (3) body split ~27/73: left radio list of sessions, right detail panel which is itself split ~80/20 (description / "Session Impacts" meters). Footer row with Cancel/Confirm right-aligned, separated by a hairline.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar | Blue (Home Club) | Top | HistoryButtons, CrestIcon, PrimaryNav, SearchField trigger, 4 IconButtons, DateTimeBlock, ContinueButton |
| HistoryButtons | Back (lighter, enabled), forward | Top-left | Two square buttons, chevrons |
| PrimaryNav | "TRAINING" active (white + short underline bar), others dimmer; each has a chevron dropdown affordance | TopBar | Condensed uppercase |
| DateTimeBlock | Day + date bold, next fixture + "In 2 days" below, time in white pill "00:00" | TopBar right | Two-line block + pill |
| ContinueButton | Magenta-to-pink gradient, label left, double chevron right | TopBar far right | ~13% of width |
| SubNav | Section label "Training" bold + divider, 7 items, last has chevron (dropdown); none underlined (modal state) | Row 2 left | |
| ShortcutBar | 5 outlined chips icon + label, trailing overflow chevron button | Row 2 right | Messages, First Team, Player Database, Transfer Activity, Competitions |
| Modal | Very large, close IconButton top-right | Centre | Darker than page, 1px border |
| SectionTitle | Plain sentence-case title "Tactical Focus - In Possession" | Week strip header | Not condensed here |
| WeekStrip / ScheduleSlot | 7 day columns; each: date pill (number, month on 1st), 3 slots labelled S1-S3, Intensity bar | Top band | Slot = left label + chip (icon + name). Colours by session family: red = physical/recovery, grey = rest, magenta = individual development, green = tactical/in possession, blue = out of possession/pressing, purple = match fixture. States: selected (white 2px outline, "Chance Creation" on 1 Sep S1), disabled/dimmed (Rest slots on match day 5) |
| ScheduleSlot (match variant) | Purple chip: CrestIcon + "Club K" + competition icon + "League A" + "H" segments | Day 5, S2 | Chip subdivided by vertical dividers |
| ProgressBar | Intensity; fill length and colour scale together: short green, mid yellow-green, yellow, full red, empty (0) | Under each day | Thin pill, ~6px, grey track |
| Tabs | Button-group variant: "Physical and Recovery" purple filled (hover/selected, cursor on it), 4 outlined | Middle band | Adjacent segments share borders |
| RadioList (List) | 5 rows, radio dot + divider + icon + label; all unselected | Body left | Full-width outlined rows, ~40px tall |
| DetailHeader (Card header) | Green tinted banner with icon + title "Chance Creation" | Body right top | Banner colour matches the session family colour |
| Text sections | Heading + paragraph, hairline separators; inline bulleted list ("Patience", "Shots from Distance"...) laid out horizontally | Body right | Bullets as small dots, items in a row |
| ImpactMeter (new; LevelMeter variant) | 6 meters; a short segment offset right of centre in green (positive), left of centre in pink/red (negative), no segment (neutral) | "Session Impacts" column | Diverging/bipolar bar: label above, thin grey track, coloured chunk shows direction and magnitude |
| Button | Secondary "Cancel", primary magenta "Confirm" | Footer right | |
| Watermark | "DEVELOPMENT BUILD" | Bottom-left | Not a library component |

- **Scroll / truncation evidence**: None inside the modal; the page behind peeks out below the modal edge (clipped session chips). ShortcutBar has an overflow chevron.
- **Unusual / new**: Diverging impact meter (centre-anchored). Intensity bar whose colour is a function of its value. Slot chips that double as fixture chips. The detail panel shows "Chance Creation" (the selected slot) while the tab/list show a different category, i.e. the picker is browse-then-replace.

## screenshot-23 — Individual Training (master/detail)
- **Layout**: Chrome rows, then one large card filling the window. Split ~30/70: left master list (toolbar row, column header row, ~14 rows visible, each ~57px), right detail pane. Detail pane stack: profile header card (~22% height) with left identity block, mini pitch + legend, right 4-stat row and 2x2 select grid; then a tabs row; then three equal attribute columns (Technical + Set Pieces / Mental / Physical + Goalkeeping + feet/traits card); legend strip; footer ActionBar right-aligned.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar / PrimaryNav / SubNav / ShortcutBar | Blue-indigo bar, different crest; SubNav "Individual Training" selected (white + underline) | Top | Same anatomy as 22 |
| Card | Page-filling container, 1px border | Body | |
| SegmentedFilter | "Detailed" selected (purple), "Summary" | List toolbar left | 2 segments |
| Select | "Filter" compact, chevron | List toolbar right | Acts as filter menu trigger |
| DataTable | Selectable rows, 3 columns (Player / Position / Training Rating); selected row purple fill with filled radio; zebra striping; column headers small grey | Left 30% | Row anatomy: radio + Avatar + two-line cell (icon + name, sub-label) + position text + rating pill |
| Avatar | Photo, circular ~44px; silhouette placeholder variant | Rows, profile header (larger ~56px) | |
| Tag / RatingPill (Badge) | Green (7.09-8.10), grey (6.40, 6.59 = below threshold), grey dash (no data) | Rating column, profile header | Pill, bold number, dark text on green |
| Text link colour | Loan players' names in light blue, with club name + small pink loan icon on line 2 | Rows 1, 4, 13 | Semantic name colouring |
| StarRating (new; LevelMeter variant) | 5 stars: gold filled, half, outline empty | Current / Potential Ability | 3 of 5 and 4 of 5 |
| StatValue | Label over value: "Training Workload / Medium", "Training Rating / pill" | Profile header right | Centre-aligned small stats in a row |
| Pitch | Mini horizontal pitch, green, with ~9 position dots coloured by competency | Profile header | Maps to a generic "position map"/scatter on a background |
| Legend | Vertical, 6 entries with dots; label text takes the same colour (green -> yellow-green -> yellow -> orange -> red, last one dimmed) | Beside pitch | Ordinal colour scale |
| Select | 4 labelled selects (label above); one with leading icon ("Normal Intensity") | Profile header | 2x2 grid |
| Tabs | Button-group: "Attributes" purple selected, "Coach Report" outlined | Below header | |
| SectionTitle | Link variant, pink, underlined, condensed ("Progress Report") + grey caption below | Right, above attributes | |
| AttributeTable (DataTable/List variant) | Group heading + hairline, rows name + right-aligned value; zebra; highlighted rows (amber fill + amber left border = "Focus": Passing, Technique) | 3 columns | Value colour scale: grey (<=6), white (7-9), yellow (10-14), green (15+) |
| Legend | Horizontal, dots: Key green, Preferable blue, Focus orange | Under Mental column | In an outlined box |
| LevelMeter | Segmented dashes (6): "Reasonable" 3 amber + 3 grey; "Very Strong" 6 green | Feet card | Label + value text + segments |
| KeyValue row | "Goalkeeper Rating  3 / 10" | Physical column | |
| EmptyState (inline) | "N/A" under "Traits"; "No progression data available" | Feet card, top right | Text only |
| Button | Outlined secondary (long label), purple dropdown button "Actions" with chevron | Footer right | ActionBar |

- **Scroll / truncation evidence**: List scrollbar on the right of the master list (thumb covers top ~60%); last row clipped behind watermark. "Person N" clipped at the column edge (hard clip, no ellipsis).
- **Unusual / new**: Value-driven text colour in attribute tables; three independent highlight systems (row tint, value colour, legend dots). Radio buttons as the row-selection affordance in a table. Ordinal legend whose labels are coloured.

## screenshot-24 — Competitions overview (4 competition cards)
- **Layout**: Chrome rows, then 4 full-height cards in a row, ~40/20/20/20 with ~12px gaps. Every card has the same vertical anatomy: tinted header (logo, name, nation chip) -> 2 key-value rows (Objective, Status) -> main content (league table, or fixture pairs, or empty message) that flexes -> "Top Performers" block -> centred row of 3 footer buttons. All cards share the same height and align their footers.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar etc. | Blue; SubNav "Competitions" selected with chevron; items with chevrons = dropdowns | Top | |
| Badge | Purple count "2" on ShortcutBar chip "Transfer Activity" | Row 2 right | Small circle overlapping chip corner |
| Card | Themed header variants: dark purple (league), red (Cup A), black (Competition C), green (Cup B) | 4 columns | Header tint also bleeds into the key-value rows; 1px border takes the theme colour faintly |
| CrestIcon | Competition logos ~32px; club crests ~14px in rows | Headers, tables | |
| Tag | Flag + country chip ("England", "Europe"), grey fill | Header | |
| KeyValue rows | Label left bold, value right; value may include leading icon (trophy "5th", green check-circle + status text) | Under header | Status text truncated in card 3 |
| DataTable | League table: Pos, Team, Pld, W, D, L, GD, Pts, Form; zebra; coloured left position bars (blue = Competition A, orange = Competition B, red = relegation); own team name in orange; movement dash column | Card 1 | 20 rows, dense ~14px row pitch; Form column empty |
| Legend | Bar markers "Competition A / Competition B / Rel." | Under table | |
| FixtureRow (new; List item) | Team name right-aligned + crest + score, "V" box in centre, score + crest + team name left-aligned | Cards 3-4 | Centre "V" in a darker inset box; scores optional (card 4 has none) |
| EmptyState | Centred single line "This round will be drawn on 7/9/2026" | Card 2 | Fills the flex area |
| Caption | "Main Path Playoff, showing 19 of 19 ties" | Under fixture lists | |
| SectionTitle | Condensed uppercase white "TOP PERFORMERS" (not a link) | Each card | |
| List (leaderboard) | Avatar + stat name (grey) + player (icon + name) + right value; value as green pill (7.80), grey pill (6.92) or plain number | Cards 3-4 | Cards 1-2 show "No data available" |
| Button / IconButton | Same 3 actions: icon + label in the wide card, icon-only in narrow cards | Card footers | Responsive collapse of label |

- **Scroll / truncation evidence**: Vertical scrollbar in card 3's fixture list. Ellipsis on team names ("Club N...", "Club O...", "Club P...", "Club Q..."), on status text ("...Playoff Second L..."), and on the ShortcutBar label ("Transfer Activit"). Footer labels of card 1 overlap the watermark.
- **Unusual / new**: Per-entity theming of a card header (competition brand colour) inside a team-themed app. Same component rendering at two widths with label collapse.

## screenshot-25 — Messages panel under tutorial spotlight
- **Layout**: Chrome rows (dimmed), then 2 columns ~32/68: Messages list card (spotlighted, full height) and message reader (dimmed). Reader: header (sender, subject, time), paragraph, club banner, then 2 columns of key-value sections; a line chart bottom-left.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| Spotlight / CoachMark (new) | Target card gets a glowing purple 2px outline; everything else, including TopBar, dimmed | Messages card | Onboarding highlight |
| ContinueButton | Disabled/dimmed, relabelled "Messages" | TopBar | Label is contextual |
| SectionTitle | Condensed uppercase white "MESSAGES" | Card top | |
| SegmentedFilter | "All" selected purple; "New", "Tasks (4)", "Unread (8)" with counts in label | Card toolbar | |
| IconButton | Star (favourites), search, green tick (mark read), "..." with chevron (more menu) | Card toolbar right | Borderless icons |
| DateGroupHeader | "Mon 31st Aug", grey band | List top | |
| MessageListItem | Unread: sender small, title bold white, Tag top-right, white dot + time bottom-right. Variants: priority (red "!"), tutorial (graduation-cap icon), tinted background (green tint for "Introduction", red/maroon tint for the Board meeting item), hover (cursor on "Home Club Supporter Profile Introduction"), selected/read (bottom "Welcome to Home Club!": indented, left bar, regular weight, no dot) | List | Row ~50px, hairline separators |
| Tag | Category colours: Transfers (teal outline), Competition (magenta), Introduction (lime/green), Board (purple fill), Jobs (blue) | Item top-right | Small, outlined + tinted fill |
| Badge | Unread dot (white); count on ShortcutBar "Messages"; "(+1)" overflow indicator | Items; row 2 right | |
| Banner (Card header) | Club: CrestIcon, name, flag + nation, 3 StatValue blocks (Founded, Reputation, Nickname) | Reader | Blue team-tinted |
| KeyValue List | Sections with icon + SectionTitle ("Club Info", "Honours", "Finances", "Facilities", "Current Season") | Reader | Zebra rows |
| Tag | Rating tags: yellow ("Okay"), green ("Superb training facilities", "Very Good"), olive ("Above Average") | Facilities | Semantic colour scale |
| LineChart | League History: single purple line with point markers; y-axis categorical (2 bands: "League E", "League F") separated by a horizontal rule; x-axis season labels (01/02, 16/17, 18/19, 20/21, 22/23, 24/25); individual points recoloured red (relegation) and green (promotion); no gridlines, no legend | Reader bottom-left | Rank/position chart, inverted so higher = better |

- **Scroll / truncation evidence**: Reader paragraph clipped on the left by the spotlighted card. ShortcutBar "(+1)" overflow. List fits without a visible scrollbar.
- **Unusual / new**: Spotlight mode that dims the TopBar too. Row background tint keyed to category. LineChart with categorical tiers on the y-axis and semantically coloured points.

## screenshot-26 — Preferences modal, "Audio & Visual" (full window)
- **Layout**: Modal centred, ~58% width x ~57% height, over the dimmed Portal. Same structure as 21: header tabs, body ~25/75 (VerticalNav / scrolling settings), footer. Settings are grouped into panels: Screen Resolution + Mode; Scaling Mode; Custom Skin Colour + Preview; UI Transitions (3 checkbox rows); audio toggles.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| Modal | Medium size, scrim without heavy blur | Centre | Close IconButton sits on the top-right corner |
| Tabs | Underline, "Detailed" selected | Header | |
| VerticalNav | "Audio & Visual" selected purple | Left | 9 items |
| Select | With leading icon ("3840 x 2160"); compact numeric ("1") | Resolution; skin colour | |
| SegmentedFilter | 2-segment, neither highlighted ("Fullscreen / Windowed"); 3-segment full-width, "Detailed" selected + hovered in bright purple | Mode; Scaling Mode | Equal-width segments, tiny labels |
| ColorScalePreview (new) | 8 numbered swatches 1, 4, 7, 10, 12, 15, 18, 20: dark red, orange, grey, white/neutral, amber, lime, green, bright green | Preview row | The attribute value colour ramp (1-20) shown as chips |
| Button | Disabled-looking secondary with icon ("Edit Colours") | Preview row right | |
| Checkbox | Checked x3 | UI Transitions | Label left, box right |
| Toggle | On: green track, white knob, "On" text label to its left | Master Audio, Intro Music | |
| Button | Link x2, secondary x3, primary magenta "Confirm" | Footer | Same as 21 |
| Background | MessageListItem (read, dimmed), NewsCard, DataTable, Card stack, Calendar strip | Behind | See 27 |

- **Scroll / truncation evidence**: Settings pane scrollbar at right (thumb top ~40%); "Intro Music" row clipped at the bottom edge.
- **Unusual / new**: Density/scale switch (Default / Detailed / Condensed) is a first-class setting, so the design system needs density tokens. User-editable semantic colour ramp.

## screenshot-27 — Portal overview
- **Layout**: Chrome rows, then 3 zones ~29/48/20 with ~12px gutters, all full height. Left: Messages card. Centre: one card holding 2 sub-columns (~50/50) separated by a hairline; left sub-column = News (hero + 2 small items, ~55% height) over Fixture Schedule table; right sub-column = League Table (~62%) over Player Stats list. Right: stack of 5 cards with content-sized heights (Next Opposition Report, Data Hub, Transfer Budget, Wage Budget, Training).
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar / PrimaryNav / SubNav / ShortcutBar | Blue; "PORTAL" active; SubNav "Overview" selected; ShortcutBar with 6 chips + "(+1)" | Top | |
| SegmentedFilter + IconButtons | As 25, counts "(0)"; mark-read tick disabled | Messages toolbar | |
| DateGroupHeader | "Thu 27th Aug" | Messages | |
| MessageListItem | All read: sender grey, title grey regular, Tag(s) right, time; two-line title wraps ("...surprise outcome"); multiple tags ("Match" + "Tactics") | Left card | Dimmed read state vs 25's unread |
| Tag | Outline category tags: Match, Competition, Training, Tactics, Scouting, Injuries | Message rows | Muted when read |
| SectionTitle | Link variant: pink, condensed, underlined ("News", "League Table", "Fixture Schedule", "Player Stats"); plain uppercase white variant in right cards | Centre; right | Two title styles |
| NewsCard | Hero: image with crest overlay, large title, meta row (clock + age, globe + category, team name in orange), arrow button | Centre top | |
| NewsCard | Compact: square thumbnail (silhouette, or score tile "3 - 3" with two crests), title 2 lines, meta, arrow | Under hero | Meta text truncated with ellipsis |
| DataTable | Fixture Schedule: Date, Club (crest + name), Venue, Result, Competition (icon + code) | Centre bottom-left | Dates truncated "21/07/2..." |
| FormIndicator | Result dot before score: solid green (win), half-filled orange (draw); 28 adds red ring (loss) | Result column | |
| Select | Competition picker with logo ("League A") | League Table | |
| DataTable | League table with movement arrows (green up, red down, grey dash), position colour bars, own row orange text, zebra | Centre right | 20 rows |
| List (leaderboard) | Stat title bold, Avatar + name below, value right | Player Stats | |
| Card | Next Opposition: CrestIcon, "Club C (A)", "In 2 days", league position, Form/Formation key-values | Right 1 | |
| EmptyState | Title "No Data" + paragraph | Data Hub card | |
| StatValue + ProgressBar | Icon + label, big pink value ("£80.09M"), secondary label + white value, pink bar (full; ~40% for wage) | Budget cards | Bar track purple-grey |
| Calendar (week strip) | 7 columns Mon-Sun, "Fri" header highlighted pink (today), 3 icon slots per day coloured by session family | Training card | Miniature of 22's WeekStrip |

- **Scroll / truncation evidence**: Scrollbars in Messages, in the compact news list, and in Player Stats. Fixture table last row clipped. Ellipsis in dates and club names ("Club L...", "Club M ..."). "(+1)" ShortcutBar overflow.
- **Unusual / new**: A card that contains multiple titled sections in two columns with no inner card borders. Purple diagonal-shard background art visible between cards.

## screenshot-28 — Bookmarks popover over Portal
- **Layout**: Same Portal as 27. A popover anchored under the TopBar's bookmark icon covers the right ~33% of the width and ~65% of the height, overlapping the League Table and right card stack. Popover: title row with toggle + settings select; filter row (2 button-tabs left, "All" select right); scrolling list.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| Popover (new) | Non-modal panel, no scrim, darker surface, no arrow | Top-right | Anchored to TopBar IconButton |
| SectionTitle | Condensed bold title case "Bookmarks", larger | Popover header | |
| Toggle | On (green), label to the left "Show bookmark labels" | Header | |
| Select | Icon-only (gear + chevron); compact "All" with white outline (focused) | Header; filter row | |
| Tabs | Button-group: "All Bookmarks" selected purple, "Bookmarks Bar" outlined | Filter row | |
| List | Icon + label + trailing pin IconButton, ~23px row pitch, 15 rows visible | Body | |
| IconButton | Pin toggle: on (purple filled square, white pin) for Competitions, First Team, Messages, Player Database; off (outlined) | Row trailing | These match the ShortcutBar contents |
| FormIndicator | Green solid (win), orange half (draw), red ring (loss) | Fixture table behind | |
| Card header chevron | Collapse chevron on "TRAINING" card | Right bottom | Collapsible card |
| DateGroupHeader | Two groups ("Thu 15th Oct", "Wed 14th Oct") | Messages | |

- **Scroll / truncation evidence**: Popover list scrollbar (thumb top ~40%). Messages scrollbar. News meta "Competition B...". Background table values partly hidden behind the popover.
- **Unusual / new**: ShortcutBar is user-configurable via pin toggles; label visibility is a toggle, so chips need an icon-only variant.

## screenshot-29 — Player instructions modal (Tactics)
- **Layout**: Modal ~68% width x ~70% height with a glowing purple outline over a dimmed teal Tactics page (pitch left, table right). Header: 2 underline tabs left; legend + split button + close right. Body ~32/68: left config panel (select, segmented control, select, selected player, radar chart); right 4-column x 3-row grid of equal square tiles. A detached callout of two enlarged tiles overlaps the bottom-right corner of the modal.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| Modal | Highlighted outline (purple glow) | Centre | |
| Tabs | Underline: "In Possession" selected, "Out of Possession" | Header | |
| Legend | Icon + label: lock = "Instruction Unavailable", small square = "Tweaked Instruction" | Header right | |
| SplitButton (Button variant) | "Undo" + chevron segment | Header right | |
| IconButton | Close | Top-right | |
| Select | Full-width "Striker (Centre)"; compact "Centre Forward" | Left panel | |
| SegmentedFilter | 2 segments with icons: "Position" selected purple, "Player" | "Apply to" | Helper text below |
| Avatar + StarRating | Silhouette avatar, name, 2.5/5 gold stars, caption "Role Ability" | "Currently Selected" | |
| RadarChart | 8 axes (Strength, Composure, Finishing, Heading, Off The Ball, First Touch, Technique, Acceleration); octagonal dark-grey plot with one inner ring; single series, lime fill (~50% opacity) with lime stroke; axis labels white with the numeric value in lime next to each (12.0-14.0); no ticks, no legend | Left panel bottom | ~150px diameter |
| InstructionTile (new; selectable Card) | Condensed uppercase title, centred white line-art diagram, value label below; states: default, locked (lock icon by title, e.g. "DRIBBLING DIRECTION", "CROSS FROM"), truncated value ("Follow Tactica...") | Right grid, 11 tiles | Maps to a generic option card / picture tile |
| Stepper (new) | Prev/next chevrons around a teal value ("Near Post") + 6-segment position indicator with the active segment pink | Callout tile "ATTACK BOX - SIDE" | Cycles through discrete options |
| Card | Enlarged callout pair with purple outline; teal value text | Bottom-right overlap | Looks like a marketing zoom, not in-game chrome |
| Pitch | Formation view with player tokens (dimmed) | Background left | Maps to a positioned-node canvas |
| DataTable | Dimmed, with coloured status dots (green/yellow) and Select cells | Background right | |

- **Scroll / truncation evidence**: Ellipsis in "Follow Tactica..." and "Attack Defen...". Callout covers the last tile of row 3 and its title is cut ("CROSSING STRATEGY" + lock).
- **Unusual / new**: Page theme here is teal/green, not purple: the body accent changes per section while the purple interaction colour stays. Illustration-led option tiles. Radar chart that prints values on the axis labels instead of using a scale.

## screenshot-30 — Competition page (Cup B) overview
- **Layout**: Chrome rows; page header band (~8% height: large logo, title, sub-line, 4 key facts right-aligned); horizontal strip of 10 equal result cards (~9% height); then one large card filling the rest, 4 columns ~33/22/20/22 separated by hairlines: fixtures, Player Stats, Team Stats, News (hero + "More Stories" list). Whole page is tinted green (competition theme); TopBar stays team blue.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar | Blue; no PrimaryNav item active; ContinueButton relabelled "Today's Fixtures"; DateTimeBlock time pill "15:00" | Top | |
| SubNav | Leading entity switcher (CrestIcon + "Cup B" + up/down stepper chevrons), then items, some with chevrons; "Overview" selected | Row 2 | Green-tinted row |
| PageHeader (new) | Large logo (~55px) + up/down chevrons, H1 condensed bold, sub-line icon + "92 Clubs"; right: 4 StatValue blocks (label over icon + value) | Under chrome | |
| ScoreCard (new) / ScoreStrip | Date left, "Full Time" right, two rows of crest + team + score | Strip of 10 | Small cards, ~108px wide, no scrollbar |
| SectionTitle | White condensed underlined ("Cup B", "Player Stats", "Team Stats", "Cup B News"); plain sub-heading "More Stories" | Main card | Link variant in white on this theme (pink on Portal) |
| FixtureRow | As 24; own team "Home Club" in orange; zebra | Column 1 | Caption "Quarter Final, showing 4 of 4 ties" |
| List (leaderboard) | Grouped: small bold group label + 3 rows (icon + name, value right); value as green pill for ratings (7.32 / 7.22 / 7.12), plain number otherwise; team variant with CrestIcon and "%" values | Columns 2-3 | 5+ groups per column |
| NewsCard | Hero with image; compact items with square logo thumbnail, 2-line title, meta, arrow | Column 4 | |
| Card | Outer container, 1px border, large radius | Body | Column 1 is mostly empty below the 4 ties |

- **Scroll / truncation evidence**: Scrollbar in "More Stories"; last news item clipped. Player/Team Stats columns clipped at the card bottom (more groups below). Ellipsis in "Club R...", "Club S...".
- **Unusual / new**: Three themes at once: team-blue TopBar, competition-green page, magenta ContinueButton. ContinueButton label is state-dependent. Entity switcher embedded in the SubNav.

## Cross-screen observations
- **Colors** (approximate):
  - Page background: near-black purple `#120A1E` to `#1A0F2B`, with large diagonal purple/magenta shards (`#3A1560` to `#6A1B8A`) as decorative art. Themed pages swap this: teal `#0E3B3A` (29), deep green `#0B3A22` (30).
  - Card surface: `#16131F` to `#1B1824` (slightly translucent over the art). Inset/raised rows: `#23212C` to `#2A2833`. Zebra row: about +3% lightness. Modal surface: `#1E1D26`.
  - Borders: 1px `#34323F` to `#3D3B4A`; hairline separators `#2C2A36`.
  - Text: primary `#FFFFFF`/`#F2F2F5`; secondary `#B8B6C4`; muted/read `#7C7A89`; disabled `#55535F`.
  - Interaction accent (selected tab, selected nav, hover, pinned): purple `#6A1FD0` to `#7B2FF2`; muted current-value fill `#4B4368`; selected table row `#5B3A8C`.
  - Primary action / brand accent: magenta `#D4127F` to `#E6178F` (Confirm), gradient to pink `#FF2D8F` on ContinueButton; link SectionTitles and budget values pink `#F06ACB`.
  - TopBar: team-coloured. Blue `#0A4FA6`/`#1257B5` for Home Club (22, 24-28, 30), slightly more indigo `#2A4DA0` in 23 (different club). It stays team-blue even when the page body goes green (30), and is dimmed under the tutorial spotlight (25).
  - Semantic: success green `#27C24C` (win dot, toggle on), rating pill green `#5FA826`/`#7CC12E`, lime `#B6F032` (radar), warn amber `#E8A21C`/yellow `#F2D21B`, draw orange `#F08A24`, danger red `#E0313B`, own-team highlight orange-red `#FF5A2E`, info/loan blue `#6FB7FF`, teal `#19D3B0` (stepper value). Attribute ramp (26): dark red -> orange -> grey -> white -> amber -> lime -> green.
  - Session family colours (22, 27, 28): red, grey, magenta, green, blue, purple.
- **Typography**: Two families. (1) Condensed bold sans, uppercase, for PrimaryNav, card SectionTitles, tile titles, DateTimeBlock, watermark (Bebas/Oswald-like); used at ~12-13px equivalent in cards and ~15px in the TopBar. Also used non-uppercase for page H1 and link titles. (2) Geometric rounded sans for everything else (Lexend-like): regular for body, semibold/bold for titles, unread items and nav labels. Sizes are small and dense: table text ~11-12px at 1200px-wide capture, captions ~9-10px, message titles ~13px bold, hero news title ~15px, page H1 ~22px. Numbers are right-aligned and appear tabular.
- **Spacing / radius / borders / elevation**: 12px gutters between cards, ~12-16px card padding, 4-8px between rows; table row pitch ~14px (dense) to ~28px (comfortable), list items ~50px. Radius ~8px on cards and modals, ~4px on buttons/selects/tags, full pill on rating pills, progress bars and toggles. Elevation is conveyed by 1px borders and surface lightness, not drop shadows; modals add a scrim (sometimes with blur) and spotlighted elements get a 2px glowing purple outline. Controls are flat with 1px borders; selected state = solid fill, not outline.
- **Recurring layout patterns**:
  - Fixed 2-row chrome: TopBar (history, crest, PrimaryNav, utilities, DateTimeBlock, ContinueButton) + SubNav left / ShortcutBar right.
  - Full-window, no page scroll: columns of full-height cards; each card or list scrolls internally with a thin scrollbar.
  - Master/detail inside a single card (23), and settings modal with VerticalNav + scrolling pane + footer ActionBar (21, 26).
  - Cards with tinted header, key-value rows, flexing content, footer buttons (24).
  - Leaderboard lists (stat label, avatar/crest + name, right-aligned value or pill) recur in 24, 27, 28, 30.
  - Overlays come in four kinds: Modal with scrim, Popover without scrim, Menu, Spotlight.
  - Truncation is by ellipsis nearly everywhere; overflow in bars uses "(+1)" or a chevron button.
