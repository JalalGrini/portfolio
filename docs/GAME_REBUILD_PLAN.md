# Jalal's guided town — implementation plan

## Scope
Keep the cinematic/classic portfolio unchanged. Rebuild only /play.

1. Use the two owner-supplied references for Jalal's portrait, expressions and four-direction sprite. Preserve source attribution and do not import Stardew Valley art/code.
2. Separate game places from classic portfolio sections: one room per project plus personal, education, experience, skills and contact buildings. No project-to-project reading navigation inside rooms.
3. Build a larger connected town with distinct project facades and districts. Give rooms several actual sizes and distributed, individually readable furniture stations, using only supported portfolio facts.
4. Guided tour state: welcome choice on first visit, ordered stops, collision-safe guide movement, wait/leash protection, manual entry and exploration, continue/leave/restart. Guide remains visible during active guidance; never trap free exploration.
5. Bottom portrait dialogue: readable keyboard/touch controls, choices and typewriter skip; NPC right-click choices also available through E/touch.
6. Frame-rate-independent movement, persistent sitting/standing, seat interactions, smooth transitions, reduced motion and motion/settings persistence.
7. Detailed selectable map, visited/inspected progress, visitor customization and viewport-contained game/creator layouts.
8. Validate all project isolation, furniture reachability, walking routes, tour state transitions, screen fit, keyboard/mobile controls, build and runtime errors. Review screenshots before deployment. Verify the actual new public deployment.

## Non-goals / truthfulness
No invented metrics or project outcomes. Sentinel/ORION remain design-stage research. No copied proprietary game assets. Physical-device and browser coverage limits must be explicit.

## Acceptance checkpoint

Implemented the planned game systems. The all-object browser tour passed all 100 exhibits and 21 building doors; the guided route passed all 21 stops, wait/rejoin/leave, completion and restart. Physical-device and alternate-browser checks remain outside this checkpoint. See `GUIDED_TOWN.md` and `docs/qa/guided-town`.
