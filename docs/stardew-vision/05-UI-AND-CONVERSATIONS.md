# UI and conversations — one original pixel-game language

## Hierarchy
1. World and characters are the visual focus.
2. Compact location label and map/help/settings affordances occupy consistent corners.
3. One context prompt appears near the usable screen edge, not a permanent label on every prop.
4. Tour ribbon shows current stop, one next action, pause/leave and progress. Secondary actions collapse into a labeled menu on narrow screens.
5. Dialogue, choices, map, journal and settings share one original wood/paper grammar. They are not unrelated beige web cards.

## Portrait dialogue anatomy (R01)
Build an original nine-slice frame with shaded wood corners, inset paper and subtle irregular texture. The panel sits at the bottom; it should not black out the entire world or apply a heavy blur. Keep a stable, framed Jalal portrait and nameplate on the right on desktop, text on the left. Other speakers use their own cleared portraits or an intentional text-only style; don't reuse Jalal's face for everyone.

Proposed desktop composition at 1440×900: 24px outer margins, panel width approximately 1000–1180px, portrait region 160–200px, 2–4 short text lines per page, choices below text. Target panel height around 220–300px depending on content; never hard-code a height that clips translations/text scaling. These are starting targets, not exact copies of the screenshot.

At 390×844: 12–16px outer gutters, portrait 72–96px beside speaker header, full-width text and vertically stacked choices. Keyboard/touch controls must not sit underneath the panel. Account for `safe-area-inset-*`, dynamic viewport height and phone orientation. Long factual details live in optional journal/detail pages rather than a scroll-heavy dialogue.

Readable text: local cleared font with a legible fallback; use Pixelify Sans selectively and do not force tiny pixel letters for long paragraphs. Body target 16–18px mobile / 18–22px desktop, AA contrast, line height around 1.4–1.5. Text may need to depart from the source screenshot's tiny typography to remain usable. Portrait mode, 200% browser zoom and keyboard focus must remain usable.

## Conversation state and authoring
Proposed node fields: id, speakerId, portraitState, pages, choices, onEnter/complete action, sourceKeys, optional placeId/exhibitId and once flag. Author typed, explicit IDs; validate all links/references and legal actions before build.
- Intro/summary lines are short, friendly and specific; deeper answers are optional. No generic wall of project description at every stop.
- Choice types: ask a question, inspect an object, continue, return, leave. Show 2–4 meaningful choices at once; page longer lists rather than filling the screen.
- Portrait expressions: neutral/happy/thoughtful currently exist; plan speaking/blink variants only if identity and artwork quality remain consistent. No random expression switching every character.
- Typewriter speed is elapsed-time based with skip and instant-text setting. First confirm reveals the page; a second deliberate confirm advances. A held key must not skip multiple pages.
- Show choice focus immediately; keyboard arrows/Tab + Enter, pointer, touch, Escape and Back have defined behavior. Do not hide the only exit until typing completes.
- Save conversation completion only after an intentional completion action. Closing a factual panel must not implicitly skip a tour beat.

## Popup taxonomy — not every message is a modal
| Surface | Purpose | Behavior |
|---|---|---|
| Small speech bubble | Waiting/reminder/short reaction | Nonblocking, cooldown, optional manual dismiss |
| Bottom conversation | Narration, questions, deliberate choices | Controlled focus; world motion paused safely |
| Inspection page | Longer project evidence/source | Return to same conversation/beat, no cross-project switcher |
| Map/atlas | Districts, legend, current location, guide target | Select building details; no surprise teleport |
| Journal | Visited places, optional exhibits, tour resume | Clearly separate required vs optional progress |
| Toast | Saved preference/checkpoint | Nonblocking, no required action |
| Recovery prompt | Unreachable route/stale checkpoint | Explain issue and offer legitimate recovery |
| Transition curtain | Scene entry/exit | Short, no input race, reduced-motion instant mode |

Use a shared overlay coordinator: a blocking map must not open over another blocking dialogue; explicit return state preserves context. Retain native dialog focus containment where appropriate, but style the surface to look integrated with the game and return focus to the triggering control/canvas. Never mark a blocked canvas as interactable to assistive tech.

## NPC depth without scope explosion
Give each existing fictional resident a role/location, greeting, 3–5 prepared questions, contextual line for the district and goodbye. Lines may react to an already visited room but must not invent real-world project outcomes. Right-click is a shortcut, never the only access path; E and touch open equivalent choices. Do not turn NPCs into a chat model backend.

## Interaction polish
Doors: outline/proximity hint, brief opening motion if approved art supports it, then safe transition.
Seats: correct facing, persistent seated pose, clear stand action, no tweened sit/stand cycle.
Books/terminals: tiny relevant animation on inspect, not screen-wide fireworks.
Hotspots: subtle authored attention cue, not rows of identical glowing circles.
HUD: compress on small screens; no page scroll, no overlapping controls, and no permanent visual competition with the room focal point.

## UI state inventory to review visually
Welcome, neutral narration, long page, skip typing, 2/4 choices, external source action, NPC menu, object detail, waiting bubble, room outro, completion, map selected building, journal, settings, character creator, load failure and route recovery. Render desktop/narrow and reduced-motion variants; explicitly inspect focus/hover/pressed/disabled states. Reject placeholder-looking UI even when interaction tests pass.
