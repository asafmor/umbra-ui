# Screen inventory: screenshots 1-10

Source: `screenshots/screenshot-1.png` ... `screenshot-10.png`.
Screenshots 1-2 are 1200x675; 3-10 are 2560x1440 (viewed downscaled to 2000x1125). Screenshot 3 is a zoomed crop with no TopBar visible.
Hex values are eyeballed from compressed video frames; treat them as approximate.

## screenshot-1 — Portal overview (home dashboard)
- **Layout**: Full-window app shell: TopBar (~6% height) + SubNav row (~4%) + content (~90%) on a dark background with diagonal purple gradient streaks. Content is 3 zones ~29/48/20 with a ~2% outer gutter. Left: one full-height Messages card. Centre: one large card split by a thin vertical divider into two sub-columns (~50/50), each a stack of two titled sections (News over Fixture Schedule; League Table over Player Stats). Right: a stack of 5 small cards (Next Opposition Report, Data Hub, Transfer Budget, Wage Budget, Training) with content-driven heights that together fill the column. All three zones end at the same bottom edge; inner lists scroll rather than the page.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar | Team-coloured (royal blue, Home Club) | Top | Contains HistoryButtons, CrestIcon, PrimaryNav, SearchField trigger, 3 IconButtons, DateTimeBlock, ContinueButton. Subtle diagonal lighter-blue pattern. |
| HistoryButtons | Back (lighter blue, enabled) + forward | Top-left | Two tall square buttons flush to the bar's full height, chevron icons. |
| CrestIcon | Large (club, in TopBar), small (table rows, fixtures, news tags) | Many | Circular/shield raster badge; ~32px in bar, ~14px inline in rows. |
| PrimaryNav | 6 items; "PORTAL" active (white, others slightly dimmer) | TopBar | Condensed uppercase bold label + separate chevron-down dropdown trigger per item. |
| SubNav | "Overview" selected (white underline); items with and without chevron | Below TopBar, left | Leading bold section label ("Portal") then plain-text items; dropdown items show a chevron. |
| ShortcutBar | 5 pill buttons | SubNav row, right | Each = icon + label in a bordered dark pill; trailing chevron for overflow menu. |
| SearchField | Collapsed trigger (icon + "Search") | TopBar right | Not an open input here. |
| IconButton | Bookmark, headset/help, settings (TopBar); star, search, tick (disabled, dim), "..." with chevron (Messages toolbar) | TopBar, Messages card | Borderless icon; disabled = low opacity. |
| DateTimeBlock | Date bold + sub-line "Club A Today" + boxed time "00:00" | TopBar right | Two-line text block plus a dark inset pill showing the clock. |
| ContinueButton | Default | TopBar far right | Wide magenta-pink gradient button, bold label left, double-chevron icon right; widest element in the bar. |
| Card | Titled (uppercase condensed header), multi-section, compact | All zones | Dark surface, ~6px radius, 1px subtle border. Centre card contains sub-sections separated by a vertical divider. |
| SectionTitle | Card title (white uppercase condensed, e.g. "MESSAGES") and link title (pink/magenta, underlined, e.g. "News", "League Table") | Cards | Two distinct variants: plain card header vs clickable underlined section link. |
| SegmentedFilter | "All" selected (solid purple), "New", "Tasks (0)", "Unread (0)" | Messages card | Joined bordered segments; counts inline in the label. |
| DateGroupHeader | "Fri 11th Sep", "Thu 10th Sep" | Messages list | Full-width slightly lighter strip, small text, sticky-looking. |
| MessageListItem | Read (dimmed grey title), single- and double-tag variants | Messages list | Sender (small) + subject (larger, dimmed) on left; 1-2 Tags and timestamp right-aligned. Row separators. |
| Tag | Outline category tags: Training, Staff Advice, Competition, Tactics, Match, Scouting, Media | Message rows | Small bordered rounded rectangle, muted text; "Competition" has a purple-ish border. |
| NewsCard | Hero (large image + headline + meta row), compact (thumbnail + headline + meta) | News section | Hero: image top, bold headline, meta = clock icon + "2d ago", globe icon + category, tag, arrow-right. Compact: 48px square thumbnail (score graphic or crest) + title + meta + arrow. |
| ScoreThumbnail | "1 - 1" on red tile with two crests | Compact NewsCard | Maps to a generic media thumbnail with overlay text. |
| Select | "League A" with crest + chevron | League Table header | Bordered dark pill dropdown, leading icon. |
| DataTable | League table (dense, zebra-free, coloured left rail per row); Fixture table | Centre card | League: Pos, movement arrow, crest + Team, Pld/W/D/L/Pts. Own-team row text highlighted orange/red ("Home Club"). Left edge rail colours: blue (Competition A), orange/amber (Competition B), red (relegation). |
| TrendArrow | Up (green caret), down (red caret), none (dash) | League table | Position movement indicator. |
| Legend | "Competition A / Competition B / Rel." with coloured bars | Under league table | Explains row rail colours. |
| FormIndicator | Result dot: solid green (win), hollow red ring (loss), half/orange (draw) before score | Fixture Schedule Result column | Small 10px circle + score text. Also 3 red squares under "Form" in Next Opposition Report. |
| List | Stat leader list (Player Stats) | Centre card bottom-right | Each row: bold stat label, then Avatar + person icon + name, value right-aligned; alternating row shading. |
| Avatar | Small round player face (~18px) | Player Stats | Paired with a tiny "person" glyph before the name. |
| StatValue | "£80.12M", "£275K p/w" (large, pink/magenta), secondary "£12.13M" (white) | Budget cards | Label with icon + big coloured value + secondary label/value. |
| ProgressBar | Pink fill on dark track (budget spent), thin | Budget cards | ~4px tall, rounded; fill ~95% (transfer) and ~55% (wage). |
| RadarChart | Mini polygon, filled bright green on dark hexagon grid, no labels | Data Hub card | ~50px thumbnail; hexagonal web with one filled series. Used as a sparkline-style preview. |
| InsightBanner | Green strip with thumbs-up icon + truncated text | Data Hub card | Semantic "positive" callout; maps to an Alert/Callout component. |
| Calendar | Week strip: 7 day columns, 3 slots each | Training card | Day header row, today ("Sat") highlighted magenta; each ScheduleSlot is a small square with an icon. |
| ScheduleSlot | Colour-coded squares: teal/green, orange, purple-outlined (selected/today), grey | Training card | Icon-only cell; colours denote session type (training / rest / match). |
| OppositionSummary | Crest + "Club A (A)" + "Today" + league position; Form + Most Used Formation | Top-right card | Maps to a Card with key-value pairs. |

- **Scroll / truncation evidence**: Thin vertical scrollbar thumbs at the right edge of the Messages list, News list, and Player Stats list (thin, light grey, no track). Fixture dates truncated with ellipsis ("20/08/2..."). Insight banner text truncated ("Performing much better than av..."). Fixture table and message list rows are clipped at the card bottom (half rows visible). Watermark "DEVELOPMENT BUILD | LOCALISATION IN PROGRESS" overlays the bottom-left.
- **Unusual / new**: Section titles that are themselves links (pink underlined) inside a single shared card. Coloured left rail on table rows as a zone indicator with a legend. Independent scroll regions per card section, so the page itself never scrolls.

## screenshot-2 — Portal overview with open SubNav dropdown
- **Layout**: Same as screenshot-1 (3 zones ~29/48/20). A dropdown Menu is open from the SubNav "Competitions" item, overlaying the top of the centre card (~15% of window width, ~18% height).
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar, HistoryButtons, PrimaryNav, DateTimeBlock, ContinueButton | Same as screenshot-1; date sub-line "Club B In 2 days" | Top | Continue button appears slightly darker/less saturated here (possibly disabled or mid-transition). |
| SubNav | "Overview" selected; "Competitions" open | Below TopBar | Open item spawns Menu directly beneath. |
| Menu | Open; first item "Overview" hovered/selected (solid purple fill), 4 other items plain | Under "Competitions" | Dark elevated panel, ~6px radius, items ~22px tall, text-only, no icons or dividers. |
| ShortcutBar | 6 pills + "(+1)" overflow counter + chevron | SubNav row right | "Transfer Activity" pill carries a small purple circular Badge ("2") and its label is truncated ("Transfer Activit"). |
| Badge | Count, purple circle, white numeral | On ShortcutBar pill | Overlaps the pill's top-right corner. |
| SegmentedFilter | "All" selected; "Tasks (1)" | Messages | Same as screenshot-1. |
| MessageListItem | Unread (bright white bold subject: "Match Preparation: Club B") vs read (dimmed); two-line wrapped subject | Messages | Unread vs read is distinguished only by text brightness. Subjects wrap to 2 lines. |
| DateGroupHeader | "Thu 20th Aug", "Wed 19th Aug" | Messages | |
| Tag | Match, Tactics, Injuries, Competition, Transfers | Message rows | |
| NewsCard | Hero + 2 compact; compact with photo thumbnail (player portrait) and with crest thumbnail; tag coloured orange for own club ("Home Club") | News | Meta row truncates ("Competition C ..."). |
| DataTable | League table at season start (all zeros, no movement arrows, dashes) | Centre | Own team row highlighted orange. |
| FormIndicator | Green solid (win), red ring (loss), half orange (draw) | Fixture Schedule | |
| EmptyState | "No Data" heading + explanatory paragraph (Data Hub); "No data available" (Player Stats); "None" (Form) | Right column, centre | Three sizes of empty state: card-level with title+body, inline one-liner, single-word value. |
| StatValue, ProgressBar | Purple fill variant (vs pink in screenshot-1) | Budget cards | Fill ~100% and ~50%. |
| Calendar / ScheduleSlot | Today = "Fri" magenta header; slots outlined purple, one orange | Training card | |
| Select | League A | League Table | |

- **Scroll / truncation evidence**: Scrollbar thumbs in Messages and News. "(+1)" overflow indicator in ShortcutBar. Truncated pill label "Transfer Activit". Ellipsis in fixture dates and club names ("Club F...", "Club G...", "Club H..."). News meta truncation.
- **Unusual / new**: ShortcutBar is responsive: it shows more pills than screenshot-1 and collapses the rest behind "(+1)". Menu's active item uses the same solid purple as selected segments.

## screenshot-3 — Tactics: player instructions modal
- **Layout**: Zoomed crop (no TopBar). Background page (Tactics) is dimmed/blurred behind a scrim. Modal is ~65% of the visible width and ~65% of height, centred. Modal header row: Tabs left, legend + split button right, close button at the top-right corner. Body is 2 columns ~33/67: left a single tall panel (selector, apply-to toggle, role, selected player, radar); right a 4x3 grid of equal instruction tiles, with the last column's bottom cell split into two half-height tiles.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| Modal | Large, dark surface, 1px border, ~8px radius, scrim over blurred page | Centre | Close IconButton (bordered square, X) at top-right; no title bar, tabs act as title. |
| Tabs | Large text tabs: "In Possession" selected (white + underline), "Out of Possession" (grey) | Modal header | Underline-style, larger type than SubNav. |
| Legend | Lock icon "Instruction Unavailable"; small square icon "Tweaked Instruction" | Modal header right | Icon + label key for tile states. |
| SplitButton | "Undo" + chevron segment | Modal header right | Button with attached dropdown trigger; also "Quick Pick" in background. |
| Select | "Striker (Centre)" full-width filled; "Centre Forward" compact bordered; background selects for tactic/style/mentality | Left panel | Two visual densities: filled wide field and small bordered. |
| SegmentedFilter | "Position" selected (purple fill, shield icon) / "Player" (person icon) | "Apply to" row | Two-segment toggle with icons. |
| Avatar | Medium round photo (~56px) | "Currently Selected" | Followed by person glyph + name. |
| StarRating | 2.5 of 5 gold stars, with half star and empty outlined stars; caption "Role Ability" | Left panel | New component; half-step support. |
| RadarChart | Octagonal, 8 axes, single series, grey fill with light-grey outline, concentric octagon grid + spokes | Left panel bottom | Axis labels outside each vertex with numeric value in yellow-green next to label (e.g. "Strength 14.0", "Finishing 11.0"). No legend, no scale ticks. |
| OptionTile (instruction tile) | Default; locked (lock icon in title row); wide tile and half-height text-only tile | Right grid | Anatomy: uppercase condensed title (+ optional lock icon), centred white line-art pictogram, current value label below ("Standard", "No", "Follow Tactic..."). One pictogram uses a green accent arrow (active option). |
| Card | Bordered tile variant | Grid | 1px border, ~6px radius, slightly lighter than modal surface. |
| IconButton | Close (X) bordered square | Modal corner | |
| DataTable (background) | Dimmed rows with checkboxes, hearts, dots | Behind modal | Detailed in screenshot-10. |
| Pitch (background) | Teal pitch with player tokens | Behind modal, left | Detailed in screenshot-10. |
| ShortcutBar | Pill with gold Badge "9" on Transfer Activity | Top right | Badge here is purple circle with numeral. |
| LevelMeter (background) | Segmented tick meter, with pie-style icons for Intensity / Complexity | Top right behind modal | |

- **Scroll / truncation evidence**: Tile value truncated "Follow Tactic...". Background content clipped by the modal. No scrollbar in the modal itself. Background substitute list shows "13 of 15" counter and a scrollbar thumb.
- **Unusual / new**: Instruction tiles are pictogram-driven option cards (white schematic diagrams of pitch areas, arrows, concentric circles) and need a slot for arbitrary SVG illustration. Legend explaining icon states inside a modal header. Radar chart with values printed beside axis labels rather than on a scale.

## screenshot-4 — Squad overview (first team table)
- **Layout**: App shell + content in 2 zones ~78/20. Left zone: a row of 3 equal-width action cards (~7% height) above one very large card filling the remaining height (title, header toolbar, filter row, table). Right zone: stack of 3 cards (Tactics ~38%, Training ~38%, Dynamics ~18%) aligned to the same top and bottom as the left zone.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar / PrimaryNav | "SQUAD" active (brighter white) | Top | |
| SubNav | Leading context switcher "Squad" with up/down stepper chevrons; "Overview" selected | Below TopBar | Context label has a vertical up/down chevron pair (cycles between entities). |
| ShortcutBar | 6 pills + "(+1)" + chevron | Right | |
| ActionCard | Enabled (Advice "Insights (4)"; Responsibilities) and disabled/dim (Team Meeting) | Top row | Anatomy: square icon tile + bold condensed title + sub-line + expand IconButton (diagonal arrows) at right. |
| Card | Large table card; teal-tinted card (Tactics); standard | Both zones | The Tactics card uses a teal/green surface colour, matching the Tactics section theme. |
| SectionTitle | Pink underlined link "First Team"; white uppercase condensed ("TACTICS", "TRAINING", "DYNAMICS") | Cards | |
| EntityHeader | Crest + "Home Club" + "Senior Squad Players (24)" | Table card header | Icon + title + count subtitle. |
| Select | "Selection Info" (eye icon, view picker); "Filter"; cell-level position selects | Table card | View picker and filter are bordered dark dropdowns. |
| SplitButton | "Quick Pick" + chevron | Table header right | |
| Tag | Info chip "Club C (A) Tomorrow" with crest | Table header | Bordered pill, non-interactive context chip. |
| SegmentedFilter | "In Possession" selected (purple) / "Out of Possession", both with icons | Above table | |
| PositionChipBar | Row of small chips: 11 filled green (GK, DR, DCR ... STC) and 9 grey (S1-S9) | Above table right | Filled = position assigned; grey = substitute slots. Maps to a Tag/Chip group with filled/neutral states. |
| DataTable | Dense, zebra-striped, checkbox selection column, many column types | Main card | Columns: checkbox, Picked (Select cell), Inf (status tag), Player (Avatar + icon + name), Position, Con (heart icon), SHP (check tile), Mor (dot icon), Playing Time Happiness (emoji + text), Form (mini bars), Apps, Gls, Ast, Avg (rating pill), Yel, Red. One row name in blue link colour ("Person A", possibly youth/hover). |
| Checkbox | Unchecked, square outline | Table first column | ~16px, white 1.5px border, dark fill. |
| Select (cell) | Colour-coded by position group: green (GK/D/DM), purple (AM), magenta (ST), neutral dark (S1-S8) | Picked column | Small kit icon + label + chevron inside a filled rounded rect. |
| Tag | Status tags: "Wnt" (green), "Set" (green), "PR" (green) | Inf column | Solid bright green, dark text, ~4px radius. |
| Avatar | Small round face | Player column | |
| StatusIcon | Heart (green = good condition, yellow-green = slightly lower); green check tile, amber "up-arrows" tile (lacking sharpness); green dot with arrow (morale) | Con / SHP / Mor columns | Icon-only cells whose colour and glyph carry meaning. |
| MoodIndicator | Yellow smiley "Happy"; purple smiley "Satisfied" | Happiness column | Emoji-style round icon + label. |
| FormIndicator | Mini bar strip, up to 5 bars of varying height, olive/yellow-green, some grey | Form column | Sparkline-like bar chart: each bar = one match rating. |
| RatingPill | Rounded pill with numeric rating: yellow-green fill (high, e.g. 7.69), grey fill (mid, 6.xx), dash (no data) | Avg column | Colour scale by value; maps to a Badge with a threshold colour prop. |
| Pitch | Small perspective pitch (trapezoid) with shirt tokens and numbers | Tactics card | Teal surface; generic mapping: positioned-marker canvas. |
| Button | Small pill buttons "Set Pieces", "Pens", "Opposition" with icons | Tactics card | |
| Calendar / ScheduleSlot | Week strip, "Sat" highlighted magenta; slots orange, purple, grey, white-bordered | Training card | Subtitle "This Week's Schedule". |
| StatValue | "2" with green up arrow / "1" with red down arrow, captions below | Training card | Delta-style stat with directional icon. |
| StatusText | "Very good" in green, larger weight, followed by body paragraph | Dynamics card | Semantic-coloured headline value. |

- **Scroll / truncation evidence**: Vertical scrollbar thumb at the right edge of the table (long thumb, ~85% of height). Bottom row clipped at the card edge. Select labels truncated ("AM ..", "ST (C"). Formation labels in the Tactics card are plain text, not truncated. "(+1)" in ShortcutBar.
- **Unusual / new**: Select controls embedded in table cells and coloured by category. Three different micro-visualisations in one table (heart, bar sparkline, rating pill). Section-themed card colour (teal for Tactics). ActionCard row acting as a shortcut strip above the main content.

## screenshot-5 — Competition overview (League A)
- **Layout**: App shell with a sky-blue TopBar (different team). Below SubNav: a page header band (~9% height) with large logo + title on the left and 4 key-value facts on the right. Then a full-width horizontal strip of 11 small result cards (~9% height, last one clipped). Then one large card (~68% height) containing 4 columns ~26/26/24/20 separated by vertical dividers: league table; Team of the Week pitch above a key-players table; Transfer Overview; News.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar | Sky-blue accent (Club D) with Club D crest | Top | Same structure as other screens; nav text darker/greyer on the lighter bar. Back/forward buttons are pale. |
| SubNav | Context switcher "League A" (icon + label + stepper); "Overview" selected | Below TopBar | |
| ShortcutBar | Pills incl. "Transfer Activity" with purple Badge "1", "Calendar" | Right | |
| PageHeader | Large logo (~90px) + big condensed title "League A" + subtitle "20 Clubs" with shield icon; up/down stepper beside logo | Header band | New component. Right side: 4 labelled facts (label small grey above value with icon/flag). |
| KeyValue | Label over value, with flag / crest / dash / green dot icon | Header right | "Based In CTA", "Current Holders Club E", "Competition Ranking 1st in Region A", "Reputation Superb". |
| ResultCard (score card) | Full-time result | Horizontal strip | Anatomy: date left + status right ("Full Time"), two rows of crest + team + score. ~170px wide. Maps to a compact Card in a horizontal scroller. |
| HorizontalScroller | 11 cards, last clipped | Strip | No visible arrows or scrollbar; overflow implied by clipping. |
| SectionTitle | White underlined condensed title (not pink here) | Each column | Third variant: white underlined. |
| DataTable | League table with coloured left rail + movement arrows; columns Pos, Team, Pld, Won, Drn, Lst, GD, Pts | Column 1 | Own team "Club D" highlighted orange. Rails: blue (rows 1-4), orange/pink (5), red (18-20). |
| TrendArrow | Green up caret, red down caret, grey dash | League table | |
| Pitch | Horizontal full pitch, black with white lines, 11 kit tokens with numbers and names | Column 2 top | "Team of the Week". Shirt icons in club colours with squad number, name label beneath. Labels overlap in places ("Person D/Person E"). |
| KitIcon | Shirt glyph coloured per club with number | Pitch | Football-specific; maps to an Avatar/marker with number overlay. |
| DataTable | Key players: Inf, Key Players (Avatar + icon + name), Position, Club (crest + 3-letter code) | Column 2 bottom | Zebra striping. |
| Tag | "Set" (green), "Inj" (red with a green right-edge stripe) | Inf column | Red = danger/injury variant; two-tone tag is new. |
| Tabs / SegmentedFilter | "Transfer News" selected (purple fill) / "Manager Movements" | Column 3 | Joined segmented control. |
| Alert / InsightBanner | Dark-green strip, check-circle icon, bold "Transfer Window Open" + muted "1 days left" | Column 3 | Success-toned inline banner. |
| StatValue | Icon + big number + caption, three in a row: green check "200 Done Deals", coin stack "£3.1B Total Spent", coins with arrows "£1.09B Net Spend" | Column 3 | Icon-left stat block. |
| DataTable | Transfer table: crest + Team, In, Out, Net (as button) | Column 3 | Taller rows (~44px), zebra. |
| Button | Cell button with value + chevron-right ("£168M >", "N/A >") | Net column | Filled dark-grey rounded rect; acts as drill-down. |
| NewsCard | Hero with match-score image (two crests + "0 - 3"), headline, meta row; compact list with score tile / photo thumbnails | Column 4 | "More Stories" sub-heading. Compact items separated by dividers. |
| ScoreThumbnail | Split two-colour tile with score ("0 - 2", "2 - 3") | Compact NewsCard | |
| Avatar | Small face in key-players table; photo thumbnail in news | Columns 2, 4 | |

- **Scroll / truncation evidence**: Result strip clipped at the right edge (11th card cut). Scrollbar thumbs at the right of the key-players table, transfer table and news list. Bottom rows clipped in columns 2-4. Overlapping pitch labels.
- **Unusual / new**: The TopBar accent changes with the selected club (sky blue vs royal blue). Black-and-white pitch variant (vs teal in Tactics). Table cell that is a button. Tag with two-tone edge stripe.

## screenshot-6 — Player profile overview
- **Layout**: App shell. Profile header band (~12% height) spanning full width, with a cut-out portrait bleeding into the SubNav row. Main card (~50% height) with 5 columns ~24/18/18/17/20: positions + role list; Technical + Set Pieces; Mental; Physical + Goalkeeping + feet; Info sidebar. Bottom row (~16% height) of 6 small cards with widths ~10/9/9/9/39/19 (Happiness, Fitness, Form, Training, Season Stats, Career Stats).
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar, PrimaryNav, SubNav, ShortcutBar | SubNav context switcher "Person B" with stepper; "Overview" selected; 7 dropdown items | Top | |
| PageHeader (profile) | Portrait (large cut-out photo), name + squad-number Badge (blue square "13"), positions line, flag + nationality + age | Header band | Divided by vertical rules into blocks: identity, status/actions, club, international, value/contract, ability ratings. |
| Avatar | XL cut-out portrait (no circle mask) | Header left | |
| Badge | Squad number: blue filled rounded square | Next to name | |
| Tag | "Wnt" green with small orange right-edge stripe; value chip "£2M - £4.2M" with tag icon (bordered) | Header | Value-range chip is a bordered pill with a leading icon. |
| Button | "Actions" primary (magenta fill, person icon, chevron) = menu button; "Compare" secondary (white outline, icon) | Header, positions panel | Primary colour here is magenta/pink (same family as Continue). |
| KeyValue | "Home Club / Important Player", flag "CTB / 19 caps / 1 goal", wage + contract date | Header | Two-line blocks with icon. |
| StarRating | Current Ability 3.5/5, Potential Ability 3.5/5; role rows 2.5-3.5 | Header right, role list | Gold filled, half, and hollow stars. |
| Pitch | Small horizontal green pitch with a 4-4-2-ish grid of position dots | Positions panel | Dots colour-coded by suitability: bright green ringed (selected/natural), green, yellow-green, yellow, orange, dark/grey (unsuitable). Position heat-dot map. |
| SegmentedFilter | "In Possession" selected (purple) / "Out of Possession" | Under pitch | |
| DataTable / List | Role list with radio selection: Select, Ability (stars), Role | Positions panel | Selected row has solid purple background and filled radio; others zebra. |
| Radio | Selected (filled dot) / unselected (ring) | Role list | |
| AttributeList | Rows: label + optional trend arrow + numeric value chip | Technical / Mental / Physical / Set Pieces | Row highlight: olive-green tinted row with a left accent bar = key attribute for the selected role; blue-grey tinted row with left bar = secondary/preferable attribute; plain = other. |
| AttributeValue (value chip) | Colour by value: green fill (16-18), olive/yellow-green (15-17), amber/gold (12-14), dark neutral (9-11), orange text on dark (6) | Attribute rows | Small rounded square, bold number; a threshold colour scale. Maps to Badge with a scale prop. |
| TrendArrow | Small yellow down-right arrow (declining) and yellow right-angled arrow | Attribute rows | Indicates recent change. |
| SectionTitle | Sub-headers "Technical", "Mental", "Physical", "Set Pieces", "Goalkeeping" with rule beneath | Main card | Sentence-case semibold with bottom border (fourth variant). |
| LevelMeter | 5-segment dashed meter: orange 3/5 ("Reasonable"), green 5/5 ("Very Strong") | Left Foot / Right Foot | Label above, value text, segmented bar below. |
| ProgressBar | Segmented: 5 or 2 or 4 segments, yellow fill for progress (e.g. "1/4") | Bans table | Segment count equals the denominator. Thin dashes. |
| DataTable | Bans: Competition (icon + name), Current Tally (fraction + segmented bar) | Info sidebar | Name truncated "Competition C...". |
| KeyValue | Height, Reputation, Personality (label small grey above value) | Info sidebar | Stacked label/value list. |
| IconButton | Bordered square with person/target icon | Info sidebar top-right | |
| Card | Small stat cards with uppercase title + chevron (collapsible/dropdown) | Bottom row | Header chevron on Happiness, Fitness, Form, Career Stats; none on Training, Season Stats. |
| MoodIndicator | Yellow smiley + "Happy"; "Positives 4 / Negatives 0" key-values | Happiness card | |
| StatusIcon | Green heart + "Peak" + "Match fit" | Fitness card | |
| FormIndicator | 5 equal grey squares (no data yet) + rating pill "6.42" + caption "Last 5 Club Games" | Form card | Block variant (squares) vs bar variant in screenshot-4. |
| RatingPill | Grey (6.42, 6.69...), green (6.60) | Form, Training, Season Stats | |
| DataTable | Season stats: Competition, Apps, Gls, Asts, xG, Pens, PoM, Yel, Red, Avg Rat | Season Stats card | Very dense (~24px rows), last row is a summary "Overall (Club)". |
| StatValue | "8" clubs, "521" apps, "58" goals | Career Stats card | Followed by a season row with crest. |

- **Scroll / truncation evidence**: Scrollbar thumb at the right of the Season Stats table. Truncations: "Player is perfor...", "League A...", "Competition C...", "Competition C...". Empty space below the bottom card row (page does not fill the height here).
- **Unusual / new**: Attribute rows encode two independent things at once: row tint (relevance to selected role) and chip colour (value magnitude). Segmented progress bars whose segment count is data-driven. Pitch used as a dot heat map of positional ability. Portrait overlapping the nav band.

## screenshot-7 — Recruitment: the source (agent offers)
- **Layout**: App shell. 2 zones ~78/20. Left: one tall card containing a vertical scrolling list of offer groups (each a bordered panel ~30% of height: header line, paragraph, nested player panel with key-value row), with a sticky ActionBar pinned to the card bottom (~6% height). Right: stack of 4 cards (Transfer History ~34%, Transfer Activity ~16%, Transfer Budget ~16%, Wage Budget ~16%).
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar / PrimaryNav | "RECRUITMENT" active | Top | |
| SubNav | Context "Recruitment" with stepper; "Brand A" selected (underline) with chevron | Below TopBar | |
| ShortcutBar | Badge "1" on Transfer Activity | Right | |
| Card | Nested: outer list card > offer group panel > player panel | Left | Three levels of nesting, each a slightly different surface shade with 1px border. |
| OfferGroupHeader | Pink condensed name "Person C" + grey role "Agent" + right-aligned count "(1 offer)" | Group top | Link-coloured heading + meta. |
| Radio | Unselected ring | Player panel left | Separated from content by a vertical rule. |
| Avatar | Medium round (~48px) photo | Player panel | With person glyph + name + positions sub-line. |
| CrestIcon | Small club crest + club name | Player panel | |
| GradeBadge | Circular letter grade: green "B-" + "Very Good" (green text); yellow-green "C" + "Useful" | Player panel right | New: round badge with letter + label, colour by grade. |
| IconButton | Bordered square, trash icon | Player panel right | |
| KeyValue | Column labels (Transfer Value, Estimated Wage, Status, Knowledge) over values | Player panel lower row | Header labels in small condensed grey with rule beneath, like a one-row table. |
| Tag | Value chips with tag icon: "£55M - £69M", "£90K p/w - £110K p/w" | Player panel | Grey filled/bordered pill, leading icon. |
| PieIndicator | Tiny pie/segmented circle in yellow + "Minimal Knowledge" | Knowledge column | Small knowledge-level glyph; maps to a mini donut/LevelMeter. |
| ActionBar | Sticky bottom: "Discard All x" (disabled/dim), "Add To Shortlist v" (disabled), "Declare Interest v" (disabled), "Make An Offer" (magenta filled, enabled-looking but muted) | Bottom of left card | Top border separates it from the scroll area; buttons are left-aligned. |
| Button | Disabled bordered; primary magenta | ActionBar | |
| DonutChart | Ring progress: yellow arc on dark-grey track with centred percentage ("81%", "58%") | Transfer History card | ~80px diameter, ~8px stroke, starts at 12 o'clock clockwise. Single value. |
| StatValue | "£104M" large white + "Transfers In (2026/27)" + "10 players" | Transfer History | Paired with donut on the right. |
| Tag | "Competition Total: £128M" bordered chip with icon | Transfer History | |
| StatValue (icon) | Green circular-arrows icon "0 Transfers In"; red circular-arrows "1 Transfers Out"; "1 Pending" with clock icon | Transfer Activity | |
| StatValue + ProgressBar | "£80.09M" / "£275K p/w" in pink-purple; bars 100% and ~50% | Budget cards | Same as Portal. |
| SectionTitle | Uppercase condensed white | Right cards | |

- **Scroll / truncation evidence**: Scrollbar thumb at the top-right of the left card (short thumb, so the list is long). Third group clipped by the ActionBar. No text truncation; paragraphs wrap to 2 lines.
- **Unusual / new**: Sticky ActionBar inside a card rather than the page. Three-level nested cards. Letter-grade circular badge. Donut ring as a percent KPI.

## screenshot-8 — Squad dynamics overview
- **Layout**: App shell. Row 1 (~33% height): 3 cards ~19/39/39 (Managerial Support, Team Cohesion, Club Atmosphere). Row 2 (~33%): one full-width card "Issues" that is mostly empty. Row 3 (~16%): 4 equal cards (~19% each) left-aligned, leaving the right ~20% empty.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar / PrimaryNav | "SQUAD" active with short white underline indicator under the label | Top | Active indicator bar is visible here. |
| SubNav | "Dynamics" selected (underline); "Loans" hovered (pointer cursor) | Below TopBar | Second "Overview" item with chevron at the end (nested sub-level). |
| ShortcutBar | 5 pills + chevron | Right | |
| Card | Borderless/very low-contrast large cards with sentence-case semibold title; compact uppercase-titled cards with header chevron | Rows 1-3 | Row 1-2 cards have almost no visible border, darker surface. |
| DonutChart (gauge ring) | Green arc ~70-75% on dark-grey track, no centre label | Row 1 cards | ~75px, ~7px stroke. Sits left of a title + description block. |
| MediaObject | Ring + bold title + paragraph | Row 1 | Generic icon-left text block. |
| SectionTitle | Sentence-case semibold (card title), repeated smaller label above a divider | Row 1 | |
| List | Bullet list with icon bullets: green thumbs-up (positive) or grey dash (neutral) | Row 1 lower half | Scrollable within card. |
| EmptyState | "There are currently no issues." small text in a large empty card | Issues card | Left-top aligned, no illustration. |
| Avatar | Medium round | Captains card | With "C" / "VC" armband icon tile at left, name, personality sub-line. |
| RoleIcon | Armband glyph with letter "C", "VC" | Captains card | Football-specific; maps to an icon Badge. |
| List (key-value with icon) | Hierarchy: pyramid icons coloured green / purple / blue / grey + label + count; Social Groups: circled icons (star, A, B, dot) + label + count | Hierarchy, Social Groups cards | Icon + label + right-aligned number. |
| MoodIndicator / StatusText | Green smiley + "0 Unhappy players" in green; divider; "33 squad players" | Happiness card | |
| IconButton | Header chevron (dropdown/collapse) | Row 3 card headers | |

- **Scroll / truncation evidence**: Small scrollbar thumbs at the right edge of each bullet list in row 1; last bullet line clipped ("...considered to be very happy" cut off). Captains card second row clipped under the watermark.
- **Unusual / new**: Large intentionally empty card (layout reserves the space). Categorical pyramid icons using a 4-colour scale (green/purple/blue/grey). Cards that do not stretch to fill the row (row 3 leaves a gap).

## screenshot-9 — Squad loans (master-detail table)
- **Layout**: App shell. In-page Tabs row (~4%). One large card filling the rest, split ~78/20 by a vertical divider: left a table with header toolbar and large empty space below the 16 rows; right a detail panel for the selected row. A primary "Actions" button is pinned at the bottom-right of the left region.
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar / PrimaryNav | "SQUAD" active | Top | |
| SubNav | "Loans" selected (underline) | Below TopBar | |
| Tabs | "Players on loan" selected (white + underline), "Suggestions" (grey) | Above card | Large underline tabs, outside the card. |
| Card | Master-detail container | Main | |
| SectionTitle | "16 Players" count title | Card header | |
| Select | "Compact" view/density picker with eye icon; "Filter" | Card header | |
| DataTable | Single-select with radio column; selected row solid purple; zebra striping | Left | Columns: radio, Inf, Player (Avatar + icon + name in pink/salmon link colour), Club (crest + name), Progress (empty), Loan Expires (clock icon + date), Loan Happiness (emoji + text), Apps, Asts, Gls, Form (mini bars), Avg. Rating (pill). |
| Radio | Selected (filled) / unselected | First column | |
| Tag | "Unr" (pale pink/salmon fill, dark text) | Inf column | New colour variant: light pink = "unregistered" style warning. |
| Avatar | Small photo, or silhouette placeholder (black figure) when no photo | Player column, detail header | Placeholder state is a required variant. |
| StatusIcon | Clock/refresh icon in orange, or red for nearer expiry ("1/1/2027") | Loan Expires | Colour signals urgency. |
| MoodIndicator | Yellow smiley for both "Happy" and "Dissatisfied" (icon colour barely differs; the text carries the meaning) | Loan Happiness | |
| FormIndicator | Mini bar strip, green/olive bars with occasional red bar and grey baseline bars | Form column | Up to 5 bars; red = poor rating. |
| RatingPill | Green (7.03, 7.00), grey (6.xx), dash placeholder | Avg. Rating | A second partially visible pill is clipped behind the column edge. |
| DetailPanel | Header (Avatar + pink name + age/positions), then grouped key-value sections | Right | Sections: "Loan Contract" (with "Loan Report" Button), "Loan Happiness", "Form - Last 5 Matches". |
| KeyValue | Label left (grey), value right-aligned (white, sometimes with icon/crest) | Detail panel | Horizontal layout variant vs stacked variant in screenshot-6. |
| Button | "Loan Report" secondary (bordered, icon); "Actions" primary (purple fill, chevron) = menu button | Detail panel, bottom-right | Primary here is purple, whereas in screenshot-6 "Actions" is magenta. |
| StatusIcon | Yellow smiley "Happy", green dot "Very Good", green heart "Peak" | Detail panel | |

- **Scroll / truncation evidence**: Dates truncated with ellipsis ("30/6/20..."). Form and rating columns visibly overlap/clip at the right edge (a second pill peeks from behind), suggesting hidden columns or horizontal overflow. No vertical scrollbar (16 rows fit). Empty "Progress" column.
- **Unusual / new**: Table does not stretch: empty space below rows with a floating bottom-right action button. Link-coloured (salmon/pink) names in a table. Master-detail inside a single card rather than two cards.

## screenshot-10 — Tactics overview (pitch + selection table)
- **Layout**: App shell. Toolbar card (~9% height, full width, teal surface) with two rows: tactic selectors + meters on top, Tabs + actions below. Below, 2 zones ~29/69: left a teal pitch card (~62% height) above a teal Substitutes card (~15%); right one large dark card with a header toolbar, a dense table and a footer bar ("Rules - League A" + "Expand" button).
- **Components**:

| Component | Variant / state seen | Where | Notes |
|---|---|---|---|
| TopBar / PrimaryNav | "TRAINING" hovered (underline + cursor) while "TACTICS" is the current section | Top | Hover state = underline under the label. |
| SubNav | Context "Tactics" (no stepper); "Overview" selected | Below TopBar | |
| ShortcutBar | 6 pills + "(+1)" | Right | |
| Card | Teal/green themed cards (toolbar, pitch, substitutes); dark neutral table card | All | Section theme colour applied to surfaces and borders (brighter teal 1px border). |
| Select | Large tactic select with index number "1"; label+muted-suffix selects ("Control Possession Style", "Positive Mentality"); cell selects | Toolbar, table | Value in white with a muted secondary word inside the same control. |
| IconButton | "+" add tactic; diamond/eraser and double-chevron-left (collapse panel) teal filled; grid and expand icons on the pitch; eye dropdown | Toolbar, pitch card | Square, teal-tinted fills. |
| LevelMeter | "Effectiveness": ~20 thin vertical ticks with one tall yellow-green marker tick; "Intensity" / "Complexity" with small pie-chart icons (orange, multi-colour) | Toolbar right; Effectiveness table column | Tick-strip gauge: grey ticks, a single highlighted position marker. In table cells it is framed in a bordered box. |
| Tabs | "Team Shape" selected (underline) / "Team Instructions" | Toolbar row 2 | |
| Tag | Opponent chip: crest + "Home Club (A) Tomorrow" | Toolbar row 2 | |
| Button / SplitButton | "Advice" (star icon, chevron), "Undo" (icon), "Quick Pick" + separate chevron segment; "Expand >" in footer | Toolbar, footer | Teal-tinted secondary buttons; neutral dark in footer. |
| SegmentedFilter | 4 segments: "Combined", "In Possession" (selected, teal fill), "Out of Possession", "Both" | Pitch card | Selected colour here is teal, not purple: the selected colour follows the section theme. |
| Pitch | Vertical full pitch, teal with white line markings (boxes, centre circle, corners) | Left card | 11 player tokens positioned by formation 4-2-3-1. Generic mapping: absolute-positioned marker canvas with SVG background. |
| PlayerToken | Kit icon with number above; role label bar (colour by position group: teal = defence, green = DM, purple = AM, magenta = striker, grey = GK); star rating row; person glyph + name | Pitch | Small dark card ~90px wide; some tokens have a small round status icon at top-left (purple). Names truncated. |
| KitIcon | Blue/white striped shirt with number; yellow/black GK shirt | Pitch, table | |
| StarRating | 2.5 to 4 of 5, gold | Tokens, Role Ability column | |
| List (grid) | Substitutes: 3-column grid of compact rows (slot code, name, position) with "9 of 9" counter | Bottom-left card | Bordered teal cells; one name in blue link colour ("Person A"). |
| DataTable | Dense, with embedded controls | Right card | Columns: Pkd (position chip), Role (Select chip), Role Ability (stars), PI (IconButton person), kit number, Player (Select with name), Positions, Inf (Tag), Effectiveness (LevelMeter), Con (heart), Shp (check tile), Mor (dot), Gls, Ast, Av Rat (RatingPill). |
| PositionChip | Colour by group: grey (GK, subs), teal (D), green (DM), purple (AM), magenta (ST) | Pkd / Role columns | Filled rounded rectangles, bold label; Role chip has an attached chevron (Select). |
| Tag | "Wnt", "Set", "PR" green | Inf column | |
| StatusIcon | Green heart (one yellow-green), green check tile, green dot | Con / Shp / Mor | |
| RatingPill | Yellow-green (7.xx), grey (6.xx) | Av Rat | |
| ActionBar / Footer | Icon + "Rules - League A" left, "Expand" button right | Bottom of table card | Card footer bar with top border. |

- **Scroll / truncation evidence**: Scrollbar thumb at the right edge of the table (thumb ~75% of height). Bottom table row clipped above the footer. Truncated names: "Person F...", "Person G...", "Person H...", "DM, M (...". Substitute grid bottom row partly hidden under the watermark.
- **Unusual / new**: Section-level theming: the whole Tactics area swaps purple accents for teal (cards, borders, selected segment). Tick-strip effectiveness meter. Position-group colour system shared across chips, token labels and selects. Table cells containing two selects per row.

## Cross-screen observations
- **Colors** (approximate):
  - App background: near-black navy `#14151C` to `#181922`, overlaid with large diagonal purple gradient bands (`#3A1466` to `#5B1A8C`) most visible at the edges and bottom.
  - Card surface: `#1B1C25` to `#20212B`; nested/raised surface `#262733`; zebra row alt `#23242E`; table header/date strip `#2A2B36`.
  - Borders/dividers: `#2E303C` to `#3A3C4A` (1px); stronger white outline `#FFFFFF` at ~80% for secondary buttons and checkboxes.
  - Text: primary `#FFFFFF`/`#F2F2F5`; secondary `#B4B6C2`; muted/disabled/read `#7C7F8C`; column headers `#9A9DAA`.
  - Primary accent (selected segments, menu active, selected row, badges): purple `#7A1FE0` to `#8B2CF5`; selected row slightly desaturated `#5B3A9E`.
  - CTA accent (Continue, "Actions", "Make An Offer"): magenta-pink `#E0157D` to `#F0328C` gradient.
  - Link/section-title accent: pink-magenta `#E86BE0` (underlined titles, agent names); salmon `#F08A8A` for player links in screenshot-9; blue `#5AA0E6` for some names.
  - Value highlight: pink-purple `#D95BE8` for budget values.
  - Semantic: success green `#2ECC5A` (hearts, rings, tags `#3DDC55`); lime/yellow-green `#A8C820` (good ratings, radar values); warning yellow `#F2C21A` (donut, stars `#F5B82E`); orange `#F08A24`; danger red `#E5383B` (relegation rail, "Inj", down arrows); pale pink `#F5B8C0` ("Unr" tag).
  - Attribute scale: green `#2E9E3F`, olive `#8A9A1E`, amber `#B88A12`, neutral `#2A2B36`, orange text for low.
  - Position groups: grey (GK/subs), teal `#149A8A` (defence), green `#1F9E4A` (DM), purple `#8A2BE2` (AM), magenta `#D0207A` (ST).
  - TopBar is team-coloured: royal blue `#0B4DA8` to `#0A3F8C` (Home Club) in screenshots 1, 2, 4, 6-10; sky blue `#6FB0E0` (Club D) in screenshot 5, where nav text turns darker. The crest swaps with it. Continue stays magenta regardless.
  - Section theme: Tactics uses teal surfaces `#0F6E60` to `#12806E` with border `#1FA890` (screenshots 3, 4 Tactics card, 10); everything else uses the neutral dark + purple scheme. The "selected" colour follows the theme (teal in Tactics, purple elsewhere).
- **Typography**:
  - Two families. A condensed, heavy, uppercase display face (Bebas/Oswald-like) for PrimaryNav, card titles, DateTimeBlock date, Continue, tile titles, big page titles and squad numbers. A geometric rounded sans (Poppins/Gilroy-like, single-storey "a") for body, tables, buttons and SubNav.
  - Relative sizes (at 2000px width): page title ~40px condensed; card title ~16px condensed uppercase; in-card section title ~15px semibold; body/table ~14-15px; column headers ~11-12px condensed, muted; captions ~12px; StatValue ~24-26px bold.
  - Weights: regular for table text, semibold for labels and values, bold for numbers in chips/pills. Column headers are small, condensed and never uppercase-bold.
  - Link titles are underlined; nothing else is.
- **Spacing / radius / borders / elevation**:
  - Outer page gutter ~32px (at 2000px); gap between cards ~16-20px; card padding ~14-16px.
  - Table row height ~32-34px dense, ~44px in the transfer table, ~24px in the season-stats mini table. Zebra striping is the norm; no horizontal row borders in zebra tables, thin separators in lists.
  - Radius: cards ~6-8px; buttons, selects, chips ~4px; rating pills fully rounded; avatars circular; checkboxes ~2px.
  - Borders: 1px low-contrast on cards and nested panels; some large cards are effectively borderless. Nested cards step slightly lighter per level rather than using shadows.
  - Elevation: essentially flat. Only the Menu and Modal read as raised (Modal uses a scrim plus background blur). No visible drop shadows on cards.
  - Scrollbars: thin (~4px) light-grey thumb, no track, inside the scroll region's right edge.
- **Recurring layout patterns**:
  - Fixed app shell: TopBar (HistoryButtons, crest, PrimaryNav, utilities, DateTimeBlock, ContinueButton) + SubNav row (context switcher, SubNav items, right-aligned ShortcutBar with overflow). The page never scrolls; each card or section scrolls internally.
  - Main + sidebar split at roughly 78/20, the sidebar being a stack of small KPI cards (screenshots 1, 2, 4, 7, 9).
  - One oversized card subdivided by vertical dividers into titled columns (screenshots 1, 2, 5, 6) instead of many separate cards.
  - Bottom row of small summary cards with uppercase titles and header chevrons (screenshots 6, 8).
  - Card header toolbar pattern: title/count on the left, view Select + Filter on the right, optional segmented filter row beneath, then the table.
  - Entity cell pattern everywhere: Avatar or CrestIcon + small type glyph + name.
  - Micro-visualisations in table cells: rating pill, mini bar form strip, tick meter, star rating, status icons.
  - In Possession / Out of Possession segmented toggle recurs on four screens (3, 4, 6, 10).
  - Charts seen: RadarChart (mini filled, and labelled 8-axis), DonutChart (percent ring with or without centre label), mini bar strips (FormIndicator), tick-strip LevelMeter, segmented ProgressBar. No LineChart or full-size BarChart appears in screenshots 1-10.
