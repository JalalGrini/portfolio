# Jalal's tour — complete behavioral contract

## What completion must mean
The owner must be able to follow Jalal through the actual places and learn about the work without guessing controls, losing him, being trapped in a modal, or having Next skip an unfinished room unexpectedly. The existing 21-door loop is useful regression coverage, not this acceptance test.

## Model the journey explicitly
Proposed states:
`idle → offer → outdoorLeading ↔ waiting → atDoor → entering → roomIntro → interiorLeading ↔ waiting → atStation → roomExplore → roomOutro → exiting → nextStop → … → complete`.
`paused` stores a resume state/reason; `free` and `complete` restore unrestricted play. Do not use one undifferentiated `exploring` state for every interior event.

Proposed checkpoint fields: schemaVersion, routeId, stopIndex, placeId, beatIndex, phase, completedBeats, skippedStops, mode, savedAt. Player/guide transforms are optional safe anchors, not raw coordinates trusted after geometry changes. Validate IDs against current data and migrate/invalidate stale saves gracefully. Do not persist DOM modal state or Phaser object references.

Define a pure transition function, guard table and side-effect controller. Phaser reports arrivals; the controller requests scene changes and dialogue nodes; React reports deliberate user choices. Use an action/transition ID to make double-clicks and repeated events idempotent.

## Stop lifecycle
1. **Outdoor arrival:** Jalal leads a collision-checked route to a paired waiting pad outside the target door. The player can walk manually or explicitly enable follow assist.
2. **Waiting:** stop before the guide leaves the visible safe region; turn toward the visitor. Show a short nonblocking bubble first: “I'll wait here—come a little closer.” Longer help/leave choices are available on interaction. Debounce reminders; never spam a blocking paragraph.
3. **Door invitation:** one clear action, “Go inside with Jalal”; optional “Tell me about this place” and “Skip this stop”. Entry is only allowed near the door or after an explicit walk-to-door action; no undisclosed teleport.
4. **Atomic entry:** pause motion, transition, create both entities at valid interior anchors, restore camera, then show the room intro. Neither actor is stranded in the previous scene.
5. **Intro:** two short messages explain why this room matters. Offer “Show me around”, “I’ll explore this room”, “Continue outside” and “Leave tour”. The third skips the remaining room beats explicitly; it is not named vaguely “Next”.
6. **Interior route:** guide leads to 2–4 authored activity zones. At each, park both actors without blocking circulation and present a concise relevant line. Optional inspect/“Tell me more” opens verified details; closing that detail returns to the same beat.
7. **Explore:** visitor can inspect other room objects without advancing the stop. “Continue with Jalal” resumes the next incomplete beat. Only the active project’s exhibits/links are reachable.
8. **Outro:** summarize one truthful takeaway. “Head to the next building” starts exit escort; “Stay a little longer” keeps the current room; “Leave tour” unlocks free play.
9. **Exit escort:** both walk to the exit, transition atomically to exterior paired anchors and only then increment the stop and lead onward. Show where they are going next.
10. **Final contact stop:** offer source-backed GitHub/LinkedIn/email/CV actions, then an explicit finish. Completion thanks the visitor, records a checkpoint, exposes free exploration and “Tour again”; never auto-navigates away or opens an external link unasked.

## Route and modes
Preserve the canonical order from `game/catalog.ts::tourOrder`: background, academy, experience, skills, 16 projects, contact. Group narration by district but don't silently drop projects.
- **Full tour (default for Take the full tour):** all 21 places, 2–4 concise interior beats each, optional deeper object pages.
- **Highlights (optional):** a clearly named shorter route of approved stops; never claim it covered everything. Implement only after full tour is reliable.
- **Free play:** all doors/objects accessible; speaking to Jalal offers Start, Resume if valid, What is this place?, or Goodbye.
- **Follow assist:** separate toggle, visibly explained; direct movement cancels assistance without abandoning the tour. Resume with one action. No accidental switch back after a keyboard tap.

## Guide visibility and movement
Use the **usable viewport** after HUD/dialogue/touch safe areas, not only raw camera bounds. Compute visibility from the guide's full visual bounds. Test all allowed zooms and portrait/landscape changes. Stop with margin before disappearance. In tight interiors choose a nearby reachable waiting anchor rather than chasing the visitor every frame.

Pathfinding constraints: player/guide body radii, shared solids, reserved arrival/interaction points, replanning cooldown and progress watchdog. If no progress for a proposed 2 seconds, replan once and report recovery; after repeated failure offer “Try again”, “Walk there yourself” and “Leave tour”. An optional relocation is permitted only as an explicit user-accepted recovery, labeled honestly, never silently used to pass tests.

When a panel opens, pause guide/player locomotion safely. On close, restore intended state and focus without replaying the triggering E/Enter/touch. Cancel stale route targets during transitions. If tab visibility changes, prevent huge catch-up deltas. Changing pace or zoom cannot invalidate the active beat.

## Boundary cases and required outcomes
| Event | Required result |
|---|---|
| Exit current room early | Ask/resume/skip clearly; no invisible stop advance |
| Enter another project during tour | Suspend at a safe checkpoint and offer explore/resume; no content mixing |
| Leave tour at any phase | Free control immediately; guide no longer constrains camera/movement |
| Restart inside a room | Confirm reset, use legitimate exit/transition, begin route from safe start |
| Refresh mid-tour | Offer Resume/Restart/Explore; no duplicate welcome or lost progress claim |
| Old save after room redesign | Migrate IDs or fall back to safe stop anchor with explanation |
| Back-to-back Next/Enter events | One transition; no skipped stops, duplicate scene or listener leak |
| Settings/map/journal during beat | Suspend and resume same beat; input never leaks into movement |
| Wrong room source link | Validation error/test failure, never cross-project browser UI |
| Guide blocked by visitor/NPC | Reachable alternate waiting position; no actor jitter or permanent deadlock |

## Script specimen — voice, not new biography
Home entrance: “Welcome! Let’s start here before we visit the projects.”
Desk: “Machine learning, data engineering and software architecture are the threads connecting my work.”
Sentinel entry: “This is a research design, not a deployed system. I’ll show you the planned lifecycle and my role.”
OCR desk: “This room is about preparing Arabic and Darija text-image data. It isn’t a claim of production OCR accuracy.”
Leaving a room: “That’s the main idea here. Ready to walk to the next building?”

All final details must resolve to `content/portfolio.ts` or reviewed evidence. Use present/planned tense correctly. No invented results, employers, collaborations or deployment claims.

## Acceptance evidence
The full guided scenario must physically enter and exit all 21 places, show every required beat in order, pause/resume for an optional exhibit, cover wait/rejoin/leave/restart, then reach completion. Record stop/place/beat and arrival events plus screenshots. Combine reducer tests, scene/integration tests and one recorded human-paced run. A script that closes every dialogue and clicks Next at each door fails this requirement even if the counter reaches 21.
