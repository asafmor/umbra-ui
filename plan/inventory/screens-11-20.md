# Inventory: screenshots 11-20

Notes on the source material: screenshots 11-16 and 18 are full-window captures (2560x1440). Screenshots 17, 19 and 20 are cropped zooms on a menu or dialog, so their layout proportions describe only the visible crop. All hex values are eyeballed, not sampled.

## screenshot-11 — Squad overview with "Squads Advice" popover open

- **Layout**: TopBar (~6% height) and SubNav row (~4%) span the full width. Below them the window splits into a main column (~78%) and a right rail (~19%). The main column starts with a row of 3 equal summary cards (~7% height), then one large card holding the squad table that fills the remaining height. The right rail is a stack of 3 cards: Tactics (~33% of rail height), Training (~33%), Dynamics (~16%); they do not share height equally, each is content-sized. A large popover panel (~57% of window width, ~62% of height) is anchored under the first summary card and covers the left two thirds of the table; the table's right-hand numeric columns and bottom 5 rows stay visible and undimmed around it.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar | Team-coloured (royal blue) | Top | HistoryButtons + CrestIcon + PrimaryNav + search + 3 IconButtons + DateTimeBlock + ContinueButton |
| HistoryButtons | Back (lighter blue, enabled), forward (dimmer) | Top-left | Two square buttons with chevrons |
| PrimaryNav | "SQUAD" selected (white, others dimmed grey-blue) | TopBar | Condensed uppercase label + dropdown chevron per item |
| SearchField | Collapsed trigger (icon + "Search") | TopBar right | Not an open input here |
| IconButton | Ghost, icon only | TopBar right (bookmark, lightbulb, gear); card corners (expand) | Expand icon top-right of each summary card |
| DateTimeBlock | Default | TopBar right | Condensed date on line 1, "Club E In 5 days" next-fixture on line 2, time in a separate white-outlined chip |
| ContinueButton | Label "Continue" | TopBar far right | Magenta-to-red gradient, left-aligned label, double chevron at right, ~13% of width |
| SubNav | "Overview" selected (white text + underline) | Under TopBar, left | Starts with a context switcher ("Squad" with up/down chevrons), then tabs; several tabs carry a dropdown chevron |
| ShortcutBar | 6 outlined pill buttons + "(+1)" overflow + chevron | Under TopBar, right | Each: icon + label in a thin-bordered rounded rectangle |
| Card (SummaryCard) | Default; middle card looks disabled/dimmed (Team Meeting) | Row of 3 above table | Square icon tile + condensed title + one-line status ("Insights (7)") + expand IconButton |
| Popover (AdvicePanel) | Open, anchored to a card | Over table | Header (title + person name + role), primary action button top-right, tabs, scrolling body. Dark surface, 1px light border, no visible backdrop dimming |
| Button | Neutral filled grey ("Apply All Actions", "Dressing Room Atmosphere") | Popover | Medium height, rounded ~4px |
| Tabs | Pill/segmented style; "Actions (5)" selected purple fill, "Observations (2)" unselected outline | Popover | Label carries a count in parentheses |
| SectionTitle | Bold heading with count, e.g. "Club Atmosphere (1)" | Popover body | Sentence-case sans, not the condensed face |
| DataTable (grouped list) | 2-column header "Subject / Feedback", one row per group | Popover body | Row: Avatar + name + truncated descriptor, multi-line paragraph, trailing action |
| Avatar | Photo, silhouette placeholder, and crest-as-avatar | Popover rows, table rows | Circular; small (table) and medium (popover) |
| StatusLabel (completed action) | Check-circle icon + text ("Made Available", "Sent On Language Course") | Popover row trailing cell | Replaces the action Button once the action is applied |
| DataTable | Dense, zebra rows, numeric columns | Main card | Visible columns: Gls, Ast, Avg, Yel, Red; left columns hidden by the popover |
| Badge (RatingPill) | Green fill with lime text (>= ~7.0), grey fill (below), grey "-" (no value) | Avg column | Fully rounded pill, bold 2-decimal number |
| Checkbox | Unchecked (white outline square); checked (green fill, white tick) in an in-table column | Table | Row-select checkbox at far left, separate boolean column mid-table |
| Select | Compact in-cell select ("S4", "S5") | Picked column | Text + chevron, no visible border until row |
| Tag | Green "Set" | Inf column | Small rounded rectangle, dark text on green |
| FormIndicator | 3-5 tiny vertical bars, grey or green/yellow | Form column | Mini bar sparkline, one bar per recent match |
| MoodIndicator | Emoji face + label: Happy/Very Happy (yellow/green face), Satisfied (purple face) | Morale column | Icon colour encodes sentiment |
| Tag (PositionChip) | "TC" green filled; S1-S9 dark outlined | Above table | Row of small equal chips for lineup slots |
| Button (split) | "Quick Pick" + separate chevron segment | Above table | Split button |
| Select | "Filter" | Above table | Button-like select with chevron |
| Tag (FixtureChip) | Crest + "Club E (H)" + muted "In 5 days" | Above table | Outlined chip |
| Pitch | Mini formation view, teal card | Right rail, Tactics | 11 shirt icons with numbers in a 4-2-3-1 on a perspective pitch outline. Maps to a generic positioned-marker canvas |
| Button | Small tinted ("Set Pieces", "Pens", "Opposition") | Tactics card | Icon + label on a semi-transparent darker fill |
| ScheduleSlot / Calendar (WeekGrid) | 7 day columns x 3 slots; "Mon" header selected magenta | Training card | Each slot is a small square icon tile; colours: blue (training), orange, purple, grey (rest) |
| StatValue | Trend arrow + number + caption; green up "4", red down "2" | Training card | "Player Improvements" / "Player Regressions" |
| Card | Title + coloured status word + paragraph | Dynamics | Status "Average" in yellow-green |

- **Scroll / truncation evidence**: Thin vertical scrollbar inside the popover (right edge, thumb ~70% of track). The popover's last group is clipped at the bottom edge (avatar and a button cut in half). Descriptors truncated with ellipsis ("34 year-old vetera...", "23 year-old attacki..."). Table has its own thin scrollbar at the right edge of the table card; last table row clipped. ShortcutBar shows "(+1)" overflow. "TC" chip is cut by the popover edge.
- **Unusual / new**: A popover large enough to act as a non-modal panel, with its own tabs and scroll. Action buttons that turn into inline "done" labels in place. Summary cards that act as launchers for such panels. "DEVELOPMENT BUILD" watermark bottom-left (ignore).

## screenshot-12 — Squad overview with "Responsibilities" panel and open Select menu

- **Layout**: Same shell as 11. Main column now shows the left part of the squad table (title block, filters, columns Picked/Inf/Player/Position/Con). A panel (~58% width, ~62% height) is anchored under the third summary card and extends over the right rail. Inside the panel: header row, then stacked sections, each a full-width header bar plus setting rows; fixed footer with 4 buttons right-aligned. An open Select menu floats above the panel content.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar, PrimaryNav, SubNav, ShortcutBar, HistoryButtons, DateTimeBlock, ContinueButton, Card (SummaryCard) | Same as 11 | Shell | - |
| SectionTitle (link) | Pink/magenta condensed text, underlined ("First Team") | Table card top-left | Acts as a link to the full screen |
| CrestIcon | Circular club crest, ~32px | Table header | Paired with condensed team name + "Senior Squad Players (25)" |
| Select | View picker "Selection Info" with eye icon | Table header | Outlined, icon + label + chevron |
| SegmentedFilter | 2 options; "In Possession" selected (purple fill), "Out of Possession" unselected | Above table | Each option has a leading icon |
| Tag (PositionChip) | "GK", "DR" green filled | Above table right | - |
| DataTable | Dense, zebra, row checkboxes | Main card | Columns: checkbox, Picked, Inf, Player, Position, Con |
| Select (in-cell, coloured) | Position select chips: green (GK, D, DM), purple (AM), magenta (ST); plain dark for subs S1-S8 | Picked column | Shirt icon + position code + chevron. Colour encodes pitch line (defence/midfield, attacking midfield, striker). Text truncates ("AM ..", "ST (C") |
| Tag | Green: "Set", "Wnt", "PR" | Inf column | Status codes |
| Avatar | Small circular photo; silhouette for players without a photo | Player column | Followed by a small role icon and the name |
| Link (player name) | Default white; one name in light blue ("Person A") | Player column | Coloured name signals a status |
| StatusIcon (heart) | Green heart; yellow-green heart variant | Con column | Condition indicator |
| Panel / Modal | Open, with scroll body and sticky footer | Centre-right | Header: pink icon + pink condensed title "Match Day" |
| SectionHeaderBar | Dark band with condensed title left, 2 buttons right | Panel | "Match Day", "Match Day (U21)" |
| Button | Neutral outline ("Take Control of All"), purple filled ("Delegate All to Recommended", "Take Control of All" in second section), primary purple ("Control"), dimmer purple ("Control" in second row) | Panel | The same action appears outline in one section and filled in another, i.e. state-dependent emphasis |
| SettingRow | Title (bold) + description + trailing controls | Panel | Generic label/description/control row |
| Select (PersonSelect) | Closed; avatar + name + role (2 lines) + chevron | Setting rows | Tall select with rich option content |
| Select | Open; trigger shows "Every match" with chevron | Panel lower-left | - |
| Menu (Select listbox) | Open, 3 options; first highlighted with full-width purple fill; one very long option | Floating | Dark surface, light 1px border, no icons |
| Toggle | Off (dark track, white outline, knob left) | Panel | Label to the left of the toggle |
| ActionBar (footer) | Undo, Redo, Reset (muted outline, look disabled), Confirm (magenta fill, tick icon) | Panel bottom-right | Icon + label buttons |

- **Scroll / truncation evidence**: Two scrollbars at the panel's right edge (outer body thumb near the top; a second shorter thumb beside the U21 section). A third section header is clipped at the bottom of the scroll body, under the footer. The Select menu covers and truncates the "First Team Player..." heading and the "Ask which first team pl..." label. Position codes truncated in chips. Last table row clipped.
- **Unusual / new**: Colour-coded in-cell selects. Person-select with avatar and two text lines. Undo/Redo/Reset/Confirm footer on a settings panel, which implies staged edits. The panel overlaps both the main column and the right rail without a backdrop.

## screenshot-13 — Portal > Messages: "Welcome to Home Club!" (club overview message)

- **Layout**: Shell as before. Content is 2 columns ~29/68 with a ~1% gutter, both cards run the full content height (~85% of window). Left: Messages card (title, filter row, scrolling list; list ends well above the card bottom, leaving empty space). Right: reader card with a header band (~7%), body text, then a club banner strip and a 2-column detail area (~48/52) of stacked key-value sections; the left detail column sits on a slightly lighter inner card.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar | Blue; ContinueButton relabelled "Messages" | Top | The continue button changes label when something blocks progress |
| PrimaryNav | "PORTAL" selected | TopBar | - |
| SubNav | "Messages" selected (underline) | Under TopBar | Context label "Portal" + tabs |
| ShortcutBar | "Message" pill with a purple count Badge "8" overlapping its top-right; "(+1)" overflow | Right | Pill label is truncated by the badge |
| Card | Full-height, condensed uppercase title "MESSAGES" | Left | - |
| SegmentedFilter | All (selected, purple), New, Tasks (4), Unread (8) | Messages card | Counts in labels |
| IconButton | Star, search, mark-all-read (green double tick), more ("..." + chevron) | Messages card toolbar | Ghost icons, no border |
| DateGroupHeader | "Mon 31st Aug" | List | Full-width slightly lighter band, small bold text |
| MessageListItem | Unread: bold title + white dot before time. Read+selected: regular weight, indented, white vertical bar at left, no dot | List | Anatomy: sender (small), title (large), Tag top-right, time bottom-right; optional priority icon (red "!") and type icon (green graduation cap) |
| MessageListItem (tinted) | Olive/yellow-green gradient tint for "Introduction" items; dark red gradient tint for a must-respond Board item | List | Row background encodes category/urgency |
| Tag | Outlined category tags: Transfers (teal-grey), Competition (plain/magenta-ish), Introduction (lime outline + text), Board (purple fill), Jobs (grey outline) | List items | Small rounded rectangle; colour varies by category |
| MessageHeader | Avatar silhouette + sender + bold title; time chip top-right; hex-pattern texture at right | Reader top | Bottom border in light grey |
| Avatar | Large silhouette placeholder, overflowing the header's bottom edge | Reader header | - |
| EntityBanner | Crest + condensed name + flag + country; right side 3 labelled stats separated by vertical dividers (Founded, Reputation, Nickname) | Reader | Deep-blue team-coloured band |
| CrestIcon | Large (~56px) in banner; small competition icons in lists | Reader | - |
| SectionTitle | Icon + bold title (Club Info, Honours, League History, Current Season, Finances, Facilities) | Reader | Sentence case, followed by a thin divider above the next section |
| List (KeyValueList) | Zebra rows, muted label left, white value right | Club Info, Finances, Current Season, Facilities | 2-column label/value; value column starts at ~50% |
| List | Icon + count + label ("0 Cup A") | Honours | - |
| Tag (RatingTag) | Filled: "Okay" (dark yellow), "Very Good" (olive-yellow), "Above Average" (amber); outlined bright green: "Superb training facilities", "Superb youth facilities" | Facilities | Colour scale from amber to green encodes quality |
| LineChart | Single series, categorical Y | League History | See below |

  **LineChart detail**: Y axis is categorical tiers ("League E" top, "League F" bottom), labels left of the axis, with one horizontal gridline separating the tiers and a top border line. X axis is seasons, labelled every other tick ("01/02", "16/17", "18/19", "20/21", "22/23", "24/25"). Left and bottom axis lines are thick white (~3px). One purple polyline (~2px) with filled purple circular markers (~8px) at each season; the vertical position within a tier encodes league finishing position. Two markers are recoloured: red (relegation season) and green (promotion season). No legend, no value labels, plot background slightly lighter than the card.

- **Scroll / truncation evidence**: No scrollbar visible in either card (content fits). ShortcutBar "(+1)" overflow. "Message" pill text clipped by its badge.
- **Unusual / new**: Message body embedding a full mini-dashboard (banner, key-value lists, chart). Row background tints as a category signal. The page background is a purple gradient that brightens to violet at the bottom and shows through behind semi-transparent cards.

## screenshot-14 — Portal > Messages: "Home Club Responsibilities Introduction" (must-respond)

- **Layout**: Same 29/68 split as 13. The reader card now has a sticky footer bar (~6% height) pinned to the card bottom; between body and footer there is a large empty area. The body contains one inner card (~97% of reader width) with 3 stacked sections separated by dividers.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| Shell (TopBar, PrimaryNav, SubNav, ShortcutBar, ContinueButton "Messages") | As 13; Message badge now "4" | - | - |
| SegmentedFilter | All selected; "Unread (4)" count changed | Messages card | - |
| MessageListItem | Unread (bold + dot), read (dimmed grey text, indented, no dot), selected (left bar), hover (brighter olive tint under the cursor) | List | Read items have their Tag dimmed too |
| Tag | Same category set; dimmed variants on read rows | List | - |
| MessageHeader | As 13 | Reader | - |
| Card (inner) | Darker, near-black surface with a thin border | Reader body | Holds Purpose / Topics / Key Personnel |
| SectionTitle | Plain bold title, no icon | Inner card | - |
| List (inline icon list) | Horizontal: icon + label x5 (Staff, Responsibilities, Fixtures, Training, Tactics) | Topics | Could be a Tag row without borders |
| List (PersonListItem) | Avatar + name (bold) + role (muted) | Key Personnel | 3 items, vertical |
| Avatar | Medium silhouette placeholder | Key Personnel | - |
| ActionBar | "Must Respond" variant: dark red fill, bright red top border, warning triangle icon + bold label left, buttons right | Reader bottom | Sticky footer |
| Button | Neutral grey ("Decline Introduction"); primary purple with trailing external-link icon ("Begin Introduction") | ActionBar | - |

- **Scroll / truncation evidence**: Thin scrollbar on the reader's right edge with a thumb covering nearly the whole track (content barely overflows). No truncation.
- **Unusual / new**: A danger-coloured sticky action bar that marks a message as blocking. Three distinct text emphasis levels in one list (unread, read, selected).

## screenshot-15 — Portal > Messages: scouting report (different club theme)

- **Layout**: Same 29/68 split. The TopBar and page background are now near-black/charcoal (no blue, no purple gradient), and the crest is different. Reader body: player banner strip (~7% height), a recommendation band (~8%), then a bordered inner card with a tab row and 3 columns ~32/46/22 separated by vertical dividers. Left column is stacked sections; middle is Pros then Cons lists; right is Matches Watched, a role selector card and a small comparison table.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar | Charcoal/black variant; PORTAL selected with a short white underline | Top | HistoryButtons are grey here. Confirms team theming |
| ShortcutBar | Different order, "Message" badge "1", no "(+1)" (only a chevron) | Right | Order appears user-configurable |
| MessageListItem | Unread + read + selected; several date groups | Left | Tags: Staff Advice, Scouting, Transfers, Injuries |
| DateGroupHeader | 4 groups (Thu 23rd Apr ... Mon 20th Apr) | Left | - |
| EntityBanner (player) | Photo Avatar + name + flag + "27 year old forward"; Tag "Wnt"; CrestIcon + league + club; flag + caps; positions + role; value chip; wage + contract date | Reader | 5 cells separated by vertical dividers, dark navy fill |
| Tag | Green "Wnt"; outlined value chip with tag icon ("£130K - £180K") | Banner | - |
| Banner (RecommendationBand) | Olive-green fill | Reader | Label/value pairs + actions on the right |
| Badge (GradeBadge) | Lime circle with "B-" | Recommendation band, Scout Recommendation | Circular, dark text |
| ProgressRing / PieIndicator | Small green pie, nearly full | Next to "Extensive Knowledge" | Knowledge level |
| Button (menu) | Neutral grey "Actions" with leading icon and chevron | Band right | Dropdown button |
| Button | Magenta filled "Discard Report" | Band right | Same magenta as ContinueButton |
| Tabs | Segmented with icons: "Scout" selected purple, "Analyst" outline | Inner card top-left | - |
| Metadata line | Date + "Last Scouted By" + name + role | Inner card top-right | Right-aligned small text |
| Banner (grade pill) | Dark green rounded pill containing GradeBadge + "Very Good" | Scout Recommendation | - |
| Rating (StarRating) | 5 stars, gold filled, half-star, hollow outlined stars | Current/Potential Ability, comparison table | 3.5 and 4 of 5 seen; small caption beside it |
| Accordion (Collapsible) | Collapsed section with chevron button ("Tactical Effectiveness", value "Not Available") | Left column | - |
| List (KeyValueList) | Label left, value right; values in green for positive ("Extremely Interested", "Very Interested") | Transfer Information | - |
| SectionHeaderBar | "Pros" (green icon + green text), "Cons" (red icon + red text) on a dark band | Middle column | - |
| List (icon list) | Green icon + sentence (pros), red/pink icon + sentence (cons); wraps to 2 lines | Middle column | Each item has a different pictogram |
| EmptyState | Minimal: "None yet" text under the title | Matches Watched | Text only |
| Select (RoleSelect card) | Colour swatch (teal square) + title + 2 sub-lines + divider + chevron | Right column | Large card-like select, lighter grey fill with border |
| DataTable | Compact, 4 columns (R..., Player, Ability, Potential); row 2 highlighted (subject player) | Squad Comparison | Star ratings in cells |

- **Scroll / truncation evidence**: Scrollbar on the message list (short thumb at top) and on the reader (long thumb). Message list's last item clipped at the bottom, reader content clipped at the bottom ("Transfer Value" row at the edge). Truncated names with ellipsis in the comparison table ("Person I...", "Person J...", "Person K..."); header "R..." truncated.
- **Unusual / new**: Whole-app retheme (black/charcoal) for another club, while purple (selected) and magenta (primary) accents stay fixed. Letter-grade badge. Star rating with half and hollow states. Card-sized select with a colour swatch.

## screenshot-16 — Portal > Messages: loan offers table (must-respond)

- **Layout**: Same 29/68 split, TopBar blue again. Page background is black with green curved streaks (competition-themed). Reader: header, body paragraph (scrolled, top line clipped), player banner, then a full-width offers table of 8 two-line rows, empty space, and the Must Respond ActionBar with 3 buttons.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| ShortcutBar | Badges "9+" on two pills (Transfer Activity, Messages); "Calendar" pill added | Right | Badge overflow format "9+"; pill labels truncated under the badge |
| DateTimeBlock | "Club I Tomorrow", time 16:45 | TopBar | - |
| MessageListItem | Two-line wrapped titles; blue speech-bubble icon variant; Introduction tinted rows; selected row | Left | Tags: Competition, Transfers, Media, Match, Introduction, Scouting |
| EntityBanner (player) | Avatar + name + flag + "ENG" + descriptor; Tag "Bid"; CrestIcon + club + league; kit/role swatch + positions + role; Transfer Value chip; Wages + contract | Reader | - |
| Tag | Green "Bid" with a lighter right edge stripe | Banner | - |
| DataTable | Tall two-line rows, 3 header groups: Club, Clauses & Options, Status & Fees | Reader | Row: large CrestIcon + club + "Loan"; two-line clause text; status cell; fee cell; chevron; 3 action buttons. The status+fee cells sit on a lighter grey inset block |
| CrestIcon | Large (~50px) circular/shield crests | Table rows | - |
| StatusLabel | Icon + "Offer Made" | Status cell | - |
| StatValue (cell) | Bold "£7K (£7.75K) p/m" + muted "Wages: 80% (90%)" | Fee cell | Primary + secondary line |
| IconButton | Row expand chevron; accept (green tick), delay (white clock), reject (red x) in bordered square buttons | Row end | One hovered (cursor over the clock in Club J row) |
| ActionBar | Must Respond (red) with 3 buttons | Reader bottom | - |
| Button | Neutral with icon ("Delegate to Person L"); purple with x icon ("Reject all remaining offers"); purple with tick icon ("Accept all remaining offers") | ActionBar | - |

- **Scroll / truncation evidence**: Scrollbars on both the list (short thumb) and the reader (thumb covering ~55% of the track). The first line of the reader body is clipped under the header (scrolled position). Last list item clipped. ShortcutBar labels truncated ("Transfer Activi", "Messag").
- **Unusual / new**: Per-row triple action buttons (accept/delay/reject) plus bulk equivalents in the footer. Themed page background that changes with context (green streaks). Two-line table rows with an inset sub-block grouping several columns.

## screenshot-17 — Squad table column context menu with cascading submenu (cropped zoom)

- **Layout**: Crop of the squad table's right half. A context menu (~31% of crop width, 10 items) is open below the "Happiness" column header, with a submenu (~29% width, 13 items) cascading to the right from the highlighted item; the submenu overlaps the right-rail cards.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| Menu (context menu) | Open; items with trailing chevron (submenu), items ending in "..." (opens a dialog), 2 thick separators forming 3 groups | Centre | Dark grey surface, light 1px border, ~45px item height, generous left padding (reserved icon gutter, unused) |
| Menu item | Highlighted/hover: full-width purple fill, white text ("Replace this column") | Menu | - |
| Menu (submenu) | Open; 13 category items, all with chevrons (third level exists) | Right | Has its own scrollbar on the right edge |
| DataTable header | Sorted/active column "Happiness" with a white vertical bar at its left edge (resize or drag handle / insertion marker) | Table header | Muted small header text |
| Badge (RatingPill) | Green (7.23, 7.03, 7.09, 7.50), grey (6.x), grey "-" | Rating column | - |
| MoodIndicator | Emoji + label: "Satisfied" (green face), "Happy" (yellow face), "Dissatisfied" (yellow face) | Happiness column | - |
| Tag (PositionChip) | Green filled: AMR, AMC, AML, STC; dark outlined: S1-S9 | Above table | - |
| Button (split), Select, Tag (FixtureChip) | "Quick Pick" split button, "Filter", "Club E (H) In 5 days" | Top | As in 11 |
| Pitch, ScheduleSlot, StatValue, Card | Partially visible | Right rail | - |

- **Scroll / truncation evidence**: Scrollbar thumb on the submenu's right edge (list longer than shown). Table scrollbar visible at the right of the table. Table cells hidden behind the menu.
- **Unusual / new**: User-configurable table columns (insert, replace, remove, auto-size) and saved table "views" (copy, rename, delete, import, export). Three-level cascading menus. This is a significant DataTable requirement.

## screenshot-18 — Squad overview, full table (no overlay)

- **Layout**: The reference layout for 11/12/17. Main column ~78%: row of 3 equal SummaryCards (~7% height), then one table card filling the rest. Right rail ~19%: Tactics (~33%), Training (~33%), Dynamics (~16%) stacked with ~1.5% gaps, each now with a collapse chevron. Inside the table card: title block row, a divider, a filter row (SegmentedFilter left, 20 position chips right), then the table with 16 columns and 19 visible rows of ~34px.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar and shell | Blue; "SQUAD" selected with white underline | Top | ShortcutBar order differs again; "Transfer Activit" has badge "1" |
| Card (SummaryCard) | Advice "Insights (4)", Team Meeting (dimmed), Responsibilities "Shared / Manager and Staff" | Top row | - |
| SectionTitle (link) | "First Team" in pink, not underlined here (underlined on hover in 12) | Table card | - |
| Select | "Copy of Selection Info 1" (custom saved view) | Table header | - |
| SegmentedFilter | In Possession selected | Filter row | - |
| Tag (PositionChip) | 11 green filled (GK, DR, DCR, DCL, DL, DMCR, AMC, DMCL, AMR, STC, AML), 9 dark outlined (S1-S9) | Filter row right | Filled = slot assigned |
| DataTable | Sortable header (up arrow on "Picked"), zebra rows, row checkbox, 16 columns | Main card | Columns: checkbox, Picked, Inf, Player, Position, Con, SHP, Mor, Form, Rating, Age, Apps, Gls, Ast, Yel, Red |
| Select (in-cell, coloured) | Green / purple / magenta position chips; plain subs | Picked | As 12 |
| Tag | Green "Wnt", "Set"; one "Wnt" with an orange right edge stripe | Inf | Stripe indicates a second status |
| Link (player name) | White default; pink ("Person M"); light blue ("Person A") | Player | Name colour encodes a status |
| StatusIcon (heart) | Green, yellow-green | Con | - |
| Checkbox | Checked, green fill (read-only boolean cell) | SHP | - |
| StatusIcon (dot) | Green circle with inner arrow | Mor | - |
| FormIndicator + Badge | Mini bars (1-5, grey or yellow-green) immediately followed by a RatingPill; pill shifts right as bars are added | Form | Composite cell |
| Badge (RatingPill) | Green, grey, grey "-" | Rating | - |
| Pitch | 4-2-3-1 mini pitch with numbered shirts, GK in a different kit | Tactics card | Footer line: two formation labels with icons |
| Calendar / ScheduleSlot | "Sat" selected (magenta); slots mostly purple outlined, some orange, some grey | Training card | Colours differ from 11, i.e. slot type colours |
| StatValue | Green up "0", red down "1" | Training card | - |
| Card | Dynamics status "Very good" in green | Right rail | Status colour scale: yellow-green (Average) to green (Very good) |
| IconButton | Collapse chevron on each right-rail card | Card header right | New vs 11 |

- **Scroll / truncation evidence**: Thin table scrollbar on the right (thumb ~75% of track, at top). Bottom row clipped at the card edge. Position chip text truncated ("AM (.", "ST (C)"). Only 16 of many possible columns; no horizontal scrollbar visible. SubNav has two items labelled "Overview".
- **Unusual / new**: A table where nearly every cell type is a mini widget (select, tag, avatar, icon, sparkline, pill). Text colour on names as a silent status channel.

## screenshot-19 — Portal overview with system (gear) Menu open (cropped zoom)

- **Layout**: Crop of the top-right of the Portal overview. Left: League Table card (~50% of crop). Right: a stack of cards (Next Opposition Report, Data Hub, Transfer Budget, Wage Budget), each content-sized. A dropdown Menu (~27% of crop width, 16 items) hangs from the gear IconButton and covers parts of both columns.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar (right part) | Blue | Top | Search trigger, 3 IconButtons, DateTimeBlock, ContinueButton |
| Menu | Open from gear icon; 16 items in 7 groups divided by separators; hover item purple ("Quit Game and Exit"); two items with trailing external-link icon | Centre | Same style as 17 |
| ShortcutBar | Pills partly hidden by the menu; "(+1)" + chevron | Under TopBar | - |
| SectionTitle (link) | "League Table" pink, underlined | Card top | - |
| Select | Competition picker: icon + "League A" + chevron | League Table card | Grey filled, bordered |
| DataTable (league table) | 20 rows; columns Pos, Team, Pld (+ hidden) | Left | Row anatomy: coloured left edge bar (blue = Competition A, pink = Competition B, red = Rel), position number (bold), trend arrow (green up / red down chevron), CrestIcon, team name. Own team ("Home Club") in orange text |
| Legend | Coloured bar + label x3 ("Competition A", "Competition B", "Rel.") | Below table | Explains the row edge colours |
| Card | Condensed uppercase title; content-sized | Right column | - |
| CrestIcon | Large crest + name + "(A)" + divider + "In 2 days" + position text | Next Opposition Report | - |
| EmptyState | Heading "No Data" + explanatory paragraph | Data Hub card | Text only, no illustration |
| StatValue | Label + very large purple number ("£80.09M"); secondary label + value below | Transfer Budget | - |
| ProgressBar | Full, purple/violet, rounded ends, ~10px tall | Transfer Budget | - |

- **Scroll / truncation evidence**: Table columns and card titles hidden behind the menu. No scrollbars in view. ShortcutBar "(+1)".
- **Unusual / new**: Qualification-zone edge bars on table rows with a matching legend. Trend chevrons per row.

## screenshot-20 — Preferences Modal (cropped zoom)

- **Layout**: A large Modal filling ~97% of the crop (dimmed screen visible at the edges). Header: 2 text tabs left, close IconButton top-right. Body: 2 columns ~32/66. Left: Region card (short) above Interface card (tall). Right: Saves card (full width), then a card split by a vertical divider into Sounds (~50%) and Graphics Quality (~50%), then two equal half-width cards (Multiplayer Preferences, Accessibility). Footer: 2 link buttons left, 4 buttons right.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| Modal | Large, dark surface, 1px border, rounded ~8px, dimmed backdrop | Whole | Header tabs, card grid body, footer ActionBar |
| IconButton | Close "x" in a bordered square | Top-right | - |
| Tabs | Underline style: "Overview" selected (white, bold, underline), "Detailed" unselected (grey) | Header | Larger text than SubNav; a second Tabs style next to the pill style in 11/15 |
| Card | Bordered, near-black surface; condensed title (mixed case: "Region", "Saves"; uppercase: "MULTIPLAYER PREFERENCES", "ACCESSIBILITY") | Body | - |
| FormField | Bold label above control; variant with label + helper text left and control right | Region, Saves | - |
| Select | Closed; grey fill, full-width; one with a leading thumbs-up icon ("3840 x 2160") | Region, Interface, Saves, Graphics | Text left, chevron right |
| Checkbox | Checked, white fill with dark tick | Saves (right-aligned) | Differs from the green checked table checkbox |
| Button (link) | "See all", underlined text | Interface card header right | - |
| SegmentedFilter | 2 options ("Fullscreen", "Windowed"), neither visibly selected; 4 options ("Small", "Normal", "Large", "Larger") with "Normal" selected purple | Interface | Full-width, equal segments |
| Toggle | On: green track outline, green knob right, with "On" text label to the left | Sounds | Compare Off state in 12 |
| ProgressBar | Full, pink-violet, rounded | Graphics Quality ("Your device's Graphics Capability") | Used as a capability meter |
| Card (NavCard) | Title + description + large faint watermark icon bottom-right | Multiplayer, Accessibility | Clickable entry to sub-pages |
| Button | Outlined purple-tinted with external-link icon ("Community", "Support"); neutral grey ("Reload Skin", "Reset Layouts", "Reset To Default"); magenta with tick ("Confirm") | Footer | - |

- **Scroll / truncation evidence**: None inside the modal. The Interface card has a large empty lower half (cards stretch to the row height).
- **Unusual / new**: Watermark-icon cards. Divided card holding two titled groups. Two visual styles of the same control family in one app (underline Tabs vs pill Tabs; white vs green checked Checkbox).

## Cross-screen observations

- **Colors** (approximate):
  - Page background: deep purple-black `#160F24` to `#24123D` with diagonal lighter purple bands; in 13/14 it brightens to violet `#9A5BD6` at the bottom. In 15 it is neutral charcoal `#1B1B1E`; in 16 it is near-black `#0B0B0D` with green `#0E7A46` streaks. The background is themed per club and per context.
  - Card surface: `#16131F` to `#1C1A26`, slightly translucent over the background; inner/nested cards darker `#0F0D15`; raised controls and menus `#2A2A33` to `#33333C`.
  - Borders/dividers: `#2F2B3B` (card), `#4A4856` (control outline), menu and popover edges lighter `#5A5A66`.
  - Text: primary `#F4F4F7`; secondary `#BDBACB`; muted/header `#8A8799`; read/disabled `#6E6B7A`.
  - TopBar: Home Club blue `#0A4AA0` to `#0C56B8` in 11-14, 16, 18, 19; charcoal `#1E1E21` in 15 (other club). HistoryButtons take a lighter tint of the bar colour. The SubNav strip is a darker shade of the same hue.
  - Selection accent (constant across themes): purple `#6A1FD0` to `#7A2BE6` for selected segments, primary buttons and menu hover.
  - Primary call to action (constant): magenta `#C81479` to red-pink `#E32A55` gradient on ContinueButton; flat magenta `#D0127E` on Confirm and Discard Report.
  - Link/section-title accent: pink-violet `#D96AD8`. Big stat numbers and progress bars: violet `#B46CF0`.
  - Success: green `#2DBE60` (ticks, hearts, toggles on, tags); rating-pill green `#4C7D1A` fill with lime `#C8F04A` text; lime `#B9E52E` for grade badges and Introduction tags.
  - Warning: amber/yellow `#E0B030` to `#C9A227` (mood faces, "Okay"/"Above Average" tags, Average status `#C8D24A`).
  - Danger: red `#E5354A` (reject, regressions, cons, relegation); must-respond bar fill `#6A1B33` with `#E0354B` top border.
  - Tactics card: teal-green `#1E7F6B` to `#176656`. Player/club banner: navy `#12234A`. Position colours: green (defence/midfield), purple (attacking midfield), magenta (striker).
- **Typography**: Two families. (1) A condensed, bold, mostly uppercase display face for PrimaryNav, card titles, DateTimeBlock date, ContinueButton and entity names (sizes ~14-22px; card titles ~15px). (2) A geometric, slightly rounded sans for everything else. Body 14-15px regular; message body 16-17px; table cells 14-15px; table headers 11-12px muted, sentence case; section titles 16-18px bold; unread message titles 18px bold versus read 17px regular. Numbers in tables are regular weight; rating pills are bold. Big stat values ~30px bold.
- **Spacing / radius / borders / elevation**: Outer page gutter ~32px; gap between cards ~10-24px; card padding ~16px. Table rows ~34px, two-line rows ~60px, menu items ~45px, message items ~75px. Radius: cards ~8px, buttons/selects/tags ~4px, pills fully rounded, avatars circular. Cards have a 1px low-contrast border and no drop shadow; depth comes from surface lightness and translucency. Popovers, menus and modals use a lighter 1px border and a subtle shadow; only the Preferences modal dims the backdrop. Zebra striping (very low contrast) in all tables and key-value lists. Thin (~4px) grey scrollbars, always inside the scrolling container, no arrows.
- **Recurring layout patterns**:
  - Fixed shell: TopBar, then SubNav (left) and ShortcutBar (right) on one row, then content that fills the window without page scroll; each card scrolls on its own.
  - Master-detail at ~29/68 (Messages). Main + right rail at ~78/19 (Squad).
  - Row of equal summary/launcher cards above a large table card.
  - Detail content built from: entity banner, then a tinted status band, then a multi-column grid of titled sections separated by dividers.
  - Sticky footer ActionBar inside cards and modals, with neutral actions left of the coloured primary.
  - Overlays anchored to their trigger (card, select, gear icon, column header) and allowed to overlap neighbouring columns.
  - Colour as a data channel: row tints, text colour on names, edge stripes on tags and rows, pill colour thresholds.
