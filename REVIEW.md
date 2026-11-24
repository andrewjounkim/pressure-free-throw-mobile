# Code Review: Pressure Free Throw (Mobile) vs. SPEC.md

Reviewed on 2026-11-24. This is a report only. Nothing in the code was changed.

**Scope:** `src/app/*`, `src/game/*`, `src/lib/score-storage.ts`, `src/components/game/*`, `src/components/app-button.tsx`, `src/constants/palette.ts`, `app.json`, `package.json`.

**Checks run:**
- `npx tsc --noEmit` passes with no errors.
- `npx expo lint` reports 1 error, in unused template code (see finding 47).

**Legend:**
- [PASS]: the code meets the criterion.
- [FAIL]: the code does not meet the spec, or is a definite bug.
- [WARN]: the code works, but there is a risk, a partial deviation from the spec, or a quality issue.

Line numbers refer to the files as they are now.

---

## Part A: Acceptance criteria (SPEC Section 4)

### Start & flow

1. **[PASS] AC1: Home screen title, START and HOW TO PLAY.** `src/app/index.tsx:54-56` renders "Pressure Free Throw". `:78` START calls `router.push('/game')`. `:79` is HOW TO PLAY. The game starts in Round 1 (`src/game/engine.ts:177-208`, `round: 1`, `phase: 'playing'`).
   - Minor: START has no guard against a double tap, so two quick taps can push two `/game` screens onto the stack.

2. **[PASS] AC2: Best Round 1 and Best Final, or "—".** `src/app/index.tsx:12` `formatScore` returns `'—'` for null. `:19-31` reloads the bests on focus with `useFocusEffect`, so the values are fresh after a game. `:74` shows a warning when the load fails.

3. **[PASS] AC3: Round timer.** `engine.ts:581` shows `Math.ceil(timeLeft)`, so the timer reads 60 down to 0.
   - `canStartShot` (`engine.ts:261-268`) requires `phase === 'playing'` and `timeLeft > 0`.
   - At 0 the phase becomes `'finishing'` (`:494-499`). The ball keeps updating (`:477`), and `endRound` waits until the ball is resolved (`:502-504`), so a ball already in the air still counts.
   - See finding 36 for a meter that is still held at 0.

4. **[PASS] AC4: Score counter.** The score starts at 0 (`engine.ts:185`) and resets each round (`:214`). A make adds 1 (`:400`). It is shown in the HUD (`src/components/game/hud.tsx:47-50`).

5. **[WARN] AC5: Quit dialog.** Several parts are correct:
   - The ✕ button is at `hud.tsx:19-26`.
   - `Alert.alert('Quit this game?', ...)` is at `src/app/game.tsx:164-179`.
   - `pausedRef` stops `update()` while the dialog is open (`game.tsx:137`). The loop keeps updating `lastTime`, so there is no time jump on resume.
   - Android back is routed to the same dialog (`:150-156`).

   Problems:
   - (a) "Quitting returns home without saving" is only partly true. `saveBestRound1` already runs at the end of Round 1 (`game.tsx:72-74`), so quitting during the ROUND 2 intro or during Round 2 keeps the new Round 1 best. This follows AC24, but it conflicts with the plain reading of AC5. The spec should settle which rule wins.
   - (b) `BreathingOverlay` (`src/components/game/breathing-overlay.tsx:37`) covers the full play area, HUD included. The ✕ button can't be tapped during a 5 s break; only Android back works there.
   - (c) `onShootOut` (`game.tsx:187-190`) doesn't check `pausedRef`. If the dialog opens while SHOOT is held and the OS cancels the touch, the shot is released while the game is paused.

### Aiming

6. **[PASS] AC6: Drag to aim.**
   - The reticle is `RETICLE_SIZE = 26` × s (`src/game/constants.ts:50`, `scene.tsx:235-253`).
   - The drag uses relative deltas (`game.tsx:207-212`) and is clamped to `aimMin`/`aimMax` (`engine.ts:275-282`).
   - The reticle starts below the hoop at `rimY + 120*s` (`engine.ts:171`) and is reset each round (`:215`).
   - Nit: `aimMin.x`/`aimMax.x` use a fixed `12` that isn't scaled by `s` (`engine.ts:172-173`). The aim area also ends at `height * 0.72`. That is a reasonable reading of "play area", but the spec doesn't define it.

7. **[WARN] AC7: Sway.**
   - Horizontal sway is correct: amplitude `(BPM−60)×0.2×s`, at the BPM rate (`engine.ts:246-252`, `:451`). At 120 BPM that is 2 Hz and ±12 pt.
   - Vertical sway uses `Math.sin(2 * state.swayPhase)` (`engine.ts:250`). That moves at **twice** the BPM rate, which traces a figure eight. The spec says the reticle "sways at the BPM rate". The vertical amplitude (half) is correct.
   - Either change it to `sin(swayPhase)` (or add a phase offset), or update the spec to describe the figure eight.

8. **[PASS] AC8: On-target check.** `isOnTarget` (`engine.ts:254-259`) uses `18*s` and `12*s` against `reticlePosition(state)`, which is the drawn (swayed) center. The check runs at release (`:299-302`). Off-target shots can't be made (`made = onTarget && ...`).

9. **[PASS] AC9: Aiming ignored while SHOOT is held.** `aimBy` returns early while `state.charging` is true (`engine.ts:276`). A new pan also won't start while charging (`game.tsx:200-203`). `lastDragRef` is still updated during the hold, so the reticle doesn't jump after release.

### Shooting

10. **[PASS] AC10: Meter fill and over-hold.** The meter fills over `METER_FILL_SECONDS = 1.0` (`engine.ts:573`). The auto-release happens at `1.0 + 0.5` s with `forcedBad = true` (`engine.ts:471-476`). The meter is vertical and fills from the bottom (`shoot-controls.tsx:33-44`, `justifyContent: 'flex-end'`).

11. **[PASS] AC11: Perfect zone.** `perfectZone` (`engine.ts:229-233`) gives 85–95 at ≤90 BPM. It shrinks linearly to a width of 4 centered at 90 at 180 BPM. The green zone is drawn at `shoot-controls.tsx:38-43`.

12. **[PASS] AC12: Ratings.** `rateRelease` (`engine.ts:235-240`) uses `GOOD_MARGIN = 10` outside the zone. The rating text lasts `RATING_SHOW_SECONDS = 1.0` (`engine.ts:418-421`) and is drawn at `shoot-controls.tsx:28-32`.

13. **[PASS] AC13: Make chances.** `MAKE_CHANCE = { Perfect: 0.95, Good: 0.6, Bad: 0.15 }` (`constants.ts:31`), used at `engine.ts:302`.

14. **[WARN] AC14: Ball flight.**
    - The flight lasts 0.8 s (`constants.ts:34`, `engine.ts:541-550`). On a make the ball is drawn behind the rim and net and drops (`engine.ts:554-556`, `game.tsx:245-246`).
    - A miss on target bounces off the rim (`:557-566`).
    - An off-target miss doesn't bounce. It fades straight down at the reticle point (`engine.ts:567`), but the spec says a miss "bounces away".
    - On-target balls fly to the rim center (`:537-538`), not to the reticle. The difference is within ±18 pt, so this is fine visually, but it is a small deviation from "flies toward the reticle".
    - +1 score on a make: correct (`:399-401`).

15. **[WARN] AC15: Shot cooldown.**
    - The 1.0 s cooldown is enforced (`engine.ts:266`, `:306`), and the button is dimmed when `!canShoot` (`shoot-controls.tsx:56`).
    - But the dimmed style is turned off while `pressed` (`!canShoot && !pressed`). Pressing during the cooldown makes the button look darkened and "active" even though nothing happens. Keep it dimmed when it is unavailable.

### Heartbeat

16. **[PASS] AC16: BPM range.** BPM starts at 70 (`constants.ts:13`). It is clamped to 70–180 (`engine.ts:270-272`) and shown in the HUD (`hud.tsx:30-32`). It isn't reset between rounds, as the spec requires.

17. **[PASS] AC17: BPM rise.** BPM rises 0.5/s, or 1.5/s when `timeLeft <= 10` (`engine.ts:479-482`). It adds +5 per miss, on-target or off-target (`:402-404`).

18. **[PASS] AC18: Hand shake.** The shake is a random offset of up to `(BPM−70)/12×s` on each axis, each frame (`engine.ts:427-431`), applied at `scene.tsx:205-206`.
    - Nit: the shake is redrawn every frame, so on 120 Hz devices it looks twice as jittery as on 60 Hz devices.

19. **[WARN] AC19: Jumbotron.** It switches at `bpm >= JUMBOTRON_BPM` (`scene.tsx:93`). But `bpm` here is the **rounded** value from `snapshot` (`engine.ts:586`), so the jumbotron appears at a raw 99.5 BPM. The haptic heartbeat uses the raw value (`engine.ts:455`). The two triggers are half a BPM apart, so the jumbotron can show "♥ 100 BPM" before any taps begin.

20. **[PASS] AC20: Haptic heartbeat.** A beat accumulator (`engine.ts:452-456`) emits `heartbeat` events at BPM ≥ 100, only during `playing`/`finishing`. They are mapped to `Haptics.impactAsync(Light)` (`src/game/haptics.ts:18`).

### Breathing break

21. **[WARN] AC21: Break timing.**
    - Breaks are triggered at 40 and 20 (`constants.ts:41`, `engine.ts:484-487`) and deferred while `charging` or while the ball is unresolved (`:488-492`). The timer is paused for the whole break (`:440-447` returns before the timer code).
    - But `startBreak` sets `state.ball = null` (`engine.ts:329`). When a break was waiting for a shot, the 0.6 s make/miss outcome animation (net drop or rim bounce) is cut off at the moment the ball resolves. Consider waiting for the full `FLIGHT_SECONDS + OUTCOME_SECONDS`, or keeping the ball visible under the overlay.

22. **[PASS] AC22: Break display and swipes.**
    - The overlay dims the scene (`breathing-overlay.tsx:37`, `Palette.overlay` 0.82 alpha). The crowd freezes because `crowdTime` doesn't advance during the break (`engine.ts:440-447`).
    - The 4 random arrows come from `engine.ts:322-325`, with 5 s to answer.
    - A swipe needs at least `30 × s` of movement, and the dominant axis wins (`breathing-overlay.tsx:26-31`).

23. **[PASS] AC23: Break result.** Success gives −20 BPM, clamped at 70 (`engine.ts:335`). A wrong swipe ends the break (`:350-352`), and so does a timeout (`:444`). The "Calm! −20 BPM" or "Missed it" message shows for 1.2 s (`:336`).

### Round 2

24. **[PASS] AC24: Qualifying and saving the Round 1 best.**
    - The rule is `qualified = best === null || score >= best`. The new best is saved only when there was none or the score is higher (`engine.ts:372-387`).
    - The save goes to AsyncStorage key `pft:bestRound1` (`src/lib/score-storage.ts:10-13`, `game.tsx:72-74`).
    - See finding 39 about load failures.

25. **[PASS] AC25: ROUND 2 screen.** The intro lasts `ROUND_INTRO_SECONDS = 2` (`engine.ts:380-384`, `:433-438`) and is drawn at `game.tsx:290-298`. `startRound` resets the score, timer, aim, hoop and breaks, and keeps BPM (`engine.ts:210-226`).

26. **[PASS] AC26: Moving hoop.** It moves at 45×s pt/s within ±75×s and reverses at each edge (`engine.ts:458-468`). `rimCenter` uses `hoopX` (`:242-244`), so the on-target check and the ball target follow the moving hoop.

### End of game

27. **[PASS] AC27: Results screen.** It shows Round 1, Round 2 (or "—" plus "Not reached"), the final score and the best final (`src/app/results.tsx:51-61`). Final = round1 + round2 (`engine.ts:357-359`). Route params are validated by `toScore` (`results.tsx:17-21`).

28. **[PASS] AC28: NEW RECORD.** A new record is `previousBest === null ? final > 0 : final > previousBest` (`engine.ts:360-362`). The banner is at `results.tsx:45-49`. The save is awaited before navigation (`game.tsx:87`).

29. **[PASS] AC29: PLAY AGAIN and HOME.** PLAY AGAIN uses `router.replace('/game')` (`results.tsx:64`), so a fresh game mounts and reloads the bests. HOME goes back to the index (`results.tsx:33-36`), because the stack is `[index, results]` after `replace`.

### Final seconds & presentation

30. **[PASS] AC30: Final 10 seconds.** The timer turns red and pulses in scale (`hud.tsx:36-44`). The red edge `Vignette` pulses its opacity (`scene.tsx:257-264`, `game.tsx:259`).
    - Nit: the vignette `borderWidth: 22` (`scene.tsx:410`) isn't scaled by `s`, and it is a hard-edged border rather than a glow.

31. **[PASS] AC31: Crowd.** There are 3 × 12 = 36 fans (`scene.tsx:11-12`). They bob from `crowdTime`, which advances during `playing`, `finishing` and `roundIntro`.

### Reliability

32. **[PASS] AC32: Storage failures.**
    - `loadBests` catches errors and returns `NO_BESTS` (`score-storage.ts:24-39`).
    - `parseScore` rejects corrupted values (`:18-22`).
    - `saveScore` catches errors and returns `false` (`:41-49`). `finish()` still navigates when the save fails (`game.tsx:84-98`).
    - Haptics errors are swallowed (`haptics.ts:8-15`).

33. **[WARN] AC33: Backgrounding.**
    - The frame delta is capped at 0.1 s (`engine.ts:414`, `constants.ts:61`), and `requestAnimationFrame` pauses in the background, so the game doesn't jump ahead. That meets the AC.
    - But there is no `AppState` listener. When the app comes back it resumes instantly, with no pause. A SHOOT hold that was interrupted by backgrounding depends on the OS sending `onPressOut`. Consider auto-opening the pause/quit dialog on `AppState` `background`.

34. **[PASS] AC34: Stored data.** Only two whole-number score keys are stored (`score-storage.ts:10-13`). No personal data is collected.

---

## Part B: Bugs, logic errors, error handling

35. **[WARN] Multi-touch: aiming and SHOOT both use the single-responder JS system** (`game.tsx:198-215`, `:231`; `shoot-controls.tsx:45-59`). This needs a device test.
    - The aim `PanResponder` sits on the parent `playArea`, and the SHOOT `Pressable` is its child. In React Native's responder system only one view can be the responder at a time.
    - While a finger rests on the court (the aim pan is active), a second thumb on SHOOT is negotiated through the shared ancestor, so the `Pressable` likely won't activate until the aim finger lifts.
    - The reverse case: while SHOOT is held, a second finger moving on the court can make Pressability think the press left its area, which fires `onPressOut` and releases the shot early.
    - The spec's two-thumb control ("hold SHOOT with your other thumb") is the main input, so test it on a real phone.
    - `react-native-gesture-handler` is already a dependency and ships in Expo Go. Its `Gesture.Pan()` and `Gesture.LongPress()`/`Manual()` with `simultaneousWithExternalGesture` are the usual fix.

36. **[WARN] A meter still held at the buzzer is dropped silently.** When the time hits 0, `state.charging = false` (`engine.ts:496`), with no rating, event or feedback. The meter just disappears. The spec doesn't cover this case, but showing a "Too late" message, or releasing the shot as Bad, would be clearer.

37. **[WARN] Aim deltas build up during a pause.** `onPanResponderMove` returns before updating `lastDragRef` when `pausedRef` is set (`game.tsx:209`). If a drag goes on while paused and the game then resumes, the next move applies the whole delta from the pause at once. Update `lastDragRef` before the pause check.

38. **[WARN] The aim pan only claims the touch at touch start.** There is only `onStartShouldSetPanResponder` (`game.tsx:200-203`), and it returns false during `roundIntro`/`break`/charging. A finger that touches down during those phases and keeps dragging never aims, even after play resumes. Adding `onMoveShouldSetPanResponder` with the same check would fix this.

39. **[WARN] A failed load can overwrite good saved bests.** `game.tsx:114-116` ignores `result.failed`. After a read error the game plays as "first play" (which matches AC32). But it then **writes** the new Round 1 and final scores (`game.tsx:73`, `:87`), which can replace a higher saved best that simply failed to load. Consider skipping saves when the load failed.

40. **[WARN] Save and load limits don't match.** `parseScore` rejects values above 9999 (`score-storage.ts:21`), but `saveScore` has no upper limit (`:43`). That is harmless in practice. Still, the limit should be one shared constant used in both places.

41. **[WARN] Stale closures in `useState(() => PanResponder.create(...))`.** `breathing-overlay.tsx:21-33` captures `s` and `onSwipe` from the first render. `game.tsx:156` registers `confirmQuit` once with `[]` deps. Both work today only because the captured functions read refs. This is fragile: a future change that reads props or state inside those functions will act on stale values. Use a ref that holds the latest callback (`useRef` plus an assignment each render), or `useEffectEvent`.

42. **[WARN] `Alert.alert` on web.** `app.json` sets `web.output: "server"`, but `Alert.alert` with buttons does nothing on react-native-web. On web, the quit confirm and "Reset best scores" (`index.tsx:33-46`) don't work. The spec targets Expo Go only, so this is low priority. Either drop web, or use a cross-platform modal.

---

## Part C: Code quality

43. **[WARN] Repeated code.**
    - `goHome()` appears in both `game.tsx:47-50` and `results.tsx:33-36`.
    - `formatScore` (`index.tsx:12`) and `show` (`results.tsx:23`) are the same function.
    - Move both into a small `src/lib/` helper.

44. **[WARN] Magic numbers in layout and animation.**
    - `computeLayout` (`engine.ts:155-173`) mixes unscaled values (`signTop = 70`, `+ 6`, `12`) with scaled ones.
    - Scene art and ball outcome motion are full of literal values (`40 * s`, `70 * s`, `30 * s` at `engine.ts:555-567`).
    - Game tuning is nicely centralised in `constants.ts`. Layout numbers should get the same treatment, or at least comments.

45. **[WARN] Rendering cost.** The whole game tree re-renders every frame through `setView(snapshot(state))` (`game.tsx:138`). That includes 36 fan Views with fresh inline style objects (`scene.tsx:28-61`).
    - The spec asks for this design, and the React Compiler is on (`app.json` `experiments.reactCompiler`). But inline styles and new arrays still defeat memoisation.
    - If low-end Android frame rates drop, memoise static layers (stands, court, backboard). Or move the per-frame transforms to Reanimated shared values; Reanimated is already installed.

46. **[WARN] Naming.**
    - `Ball` is both an engine interface (`engine.ts:98`) and a component (`scene.tsx:170`).
    - `excited` (`scene.tsx:22`) actually means "final seconds".
    - `lastFill` doesn't say that it only drives the meter while the rating is shown.
    - These are minor, but they slow down reading.

47. **[WARN] Leftover template code and config.**
    - Unused Expo template files are still present: `src/components/{hint-row,themed-text,themed-view,web-badge,external-link,animated-icon*}.tsx`, `src/components/ui/collapsible.tsx`, `src/constants/theme.ts`, `src/hooks/*`, `scripts/reset-project.js` and the react/expo logo images. No screen imports any of them.
    - The only lint error (`react-hooks/set-state-in-effect` in `src/hooks/use-color-scheme.web.ts:11`) is in this dead code.
    - Unused dependencies: `@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-image`, `expo-web-browser`, `expo-device`.
    - `app.json` still has template values that clash with the spec's navy/orange/cream scheme and always-dark UI: `userInterfaceStyle: "automatic"`, splash `#208AEF`, Android icon background `#E6F4FE`.

48. **[WARN] No tests.** `src/game/engine.ts` is pure and deterministic apart from `Math.random`, which makes it ideal for unit tests. No tests exist. Most of the acceptance criteria (perfect zone math, ratings, sway amplitude, qualification, new record, timer and breaks) could be checked with a few Jest tests and an injectable RNG.

---

## Part D: Best practices done well

49. **[PASS] Engine and UI are separated cleanly.** Game rules live in a React-free engine that returns `GameEvent`s. Side effects (haptics, storage, navigation) stay in the screen (`game.tsx:53-82`).

50. **[PASS] Safe areas and navigation.**
    - Safe areas are handled with `react-native-safe-area-context` on every screen.
    - Swipe-back is disabled on game and results (`_layout.tsx:19-26`). Android hardware back is intercepted on the game screen.
    - Async loads guard against unmount with `active` flags (`index.tsx:21-29`, `game.tsx:113-119`).

51. **[PASS] Buttons and accessibility.**
    - `AppButton` has `minHeight: 52` and darkens when pressed (`app-button.tsx:46`, `:64-69`), which meets the 48 pt rule.
    - The quit button is 44 pt plus a `hitSlop` of 10.
    - `accessibilityRole`/`accessibilityLabel`/`accessibilityState` are used throughout.

52. **[PASS] Colors, orientation and storage keys.** The palette matches the spec (`palette.ts:7-9`). `orientation: "portrait"` is set in `app.json`. AsyncStorage keys match the spec exactly.

---

## Summary

| Area | PASS | WARN | FAIL |
|---|---|---|---|
| Acceptance criteria (1–34) | 27 | 7 | 0 |
| Bugs / error handling (35–42) | 0 | 8 | 0 |
| Code quality (43–48) | 0 | 6 | 0 |
| Best practices (49–52) | 4 | 0 | 0 |

**Top priorities:**
1. Test the two-thumb touch handling on a real device (finding 35).
2. Make the vertical sway frequency match the spec, or fix the spec (finding 7).
3. Keep the shot outcome animation from being cut off when a break starts (finding 21).
4. Avoid overwriting saved bests after a failed load (finding 39).
5. Settle whether quitting in Round 2 should keep the saved Round 1 best (finding 5a).
