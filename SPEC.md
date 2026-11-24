# Pressure Free Throw (Mobile) — SPEC

A phone version of *Pressure Free Throw*, built with React Native + Expo and played in Expo Go. It keeps the original game's idea and rules, but swaps the mouse, keyboard, desktop canvas and Web Audio for touch, a portrait phone screen and haptics.

## 1. The Game

**Concept:** *Pressure Free Throw* is a basketball free-throw game where an aim reticle sways with the player's heartbeat, which rises under pressure.

**What the player sees (portrait, first-person):**
- The player's own hands at the bottom of the screen.
- A basketball hoop and backboard, a basketball and the wooden court.
- Fans in the stands who are always moving.
- A sign above the hoop: **"HALFTIME SHOW: Beat the high score to win a MILLION DOLLARS."**
- An aim reticle.
- Once the heartbeat has risen enough (see Section 4), a jumbotron showing the heartbeat replaces the sign text.
- A HUD at the top (round, timer, score, BPM), a shot meter and a big **SHOOT** button at the bottom right.

**What the player does (one shot):**
1. **Aim:** drag a finger anywhere on the court. The reticle moves *with* the finger's drag (relative movement), so your finger never covers it. It stays where you leave it, but sways with the heartbeat, so you may need to correct it.
2. **Shoot:** press and hold the **SHOOT** button with your other thumb. A shot meter fills up.
3. Let go at the right moment.
4. On release, the ball leaves the hands and flies toward the reticle.
5. The game rates the release timing (Perfect / Good / Bad), similar to the shot meter in 2K games. The rating sets the chance that the ball goes in.

**Heartbeat:**
- The heartbeat (BPM) is the challenge. It rises as the clock runs down, rises faster in the final seconds, and jumps after every miss.
- **Shaking hands** are both a cause and an effect. As BPM rises, the hands visibly shake and the Perfect zone on the shot meter shrinks.
- **Haptic heartbeat:** once BPM is high, the phone gives a light tap on every heartbeat, so you *feel* the pressure.
- **Breathing break:** twice per round the clock and scene pause and everything "zones out." Four arrows are shown on screen, and the player must **swipe** in those directions, in order, before time runs out. Success lowers the heartbeat.

**Structure of a game:**
- The player taps **START** on the home screen. A full game lasts up to about 2 minutes.
- **Round 1:** 1 minute of normal free throws.
- **Round 2:** 1 minute of free throws at a moving hoop. The player reaches Round 2 by tying or beating their best-ever Round 1 score. On a player's first-ever play, they always go on to Round 2.
- If the player doesn't qualify, the game ends after Round 1. The game always ends after Round 2, and the final score is shown.

**Why it's fun:** The player feels the pressure of a once-in-a-lifetime shot, like real players at the free-throw line. Feeling the heartbeat in your hand makes the nerves real. The satisfaction comes from finding your rhythm and breaking your own records.

---

## 2. Feel / Tone

- **Mood:** Calm and bright on the home screen. Focused in Round 1, getting anxious as the clock runs down. Round 2 starts tenser.
- **Visual style:** Flat 2D shapes built from plain React Native Views (no image assets). Warm arena colors: a wooden court and dark stands. The crowd is rows of simple colored heads and bodies that bob up and down.
- **App color scheme:** three colors used everywhere: **dark navy** `#141A2E` (backgrounds), **basketball orange** `#F28C28` (buttons, highlights) and **cream** `#FFF6E9` (text). Green (Perfect zone) and red (final seconds, misses) are used only as game signals.
- **Text and buttons:** bold, high-contrast text. Every button is a large, rounded, filled shape at least 48 pt tall that visibly darkens when pressed.
- **Haptics (replaces the desktop version's audio):** a light tap on each heartbeat once BPM ≥ 100, a success buzz on a make and a heavier thud on a miss.
- **Breathing break:** the scene dims and the crowd freezes. Only the arrows and the countdown stay bright.
- **Final seconds of a round (last 10 s):** the timer turns red and pulses, and a red glow pulses at the screen edges.
- **End of game:** a results screen with the scores. A new best gets a "NEW RECORD" banner.

---

## 3. Full Feature Set

1. Home screen with the title, START, HOW TO PLAY, best scores and a "Reset best scores" option.
2. How to Play screen explaining the touch controls.
3. First-person portrait scene: hands, hoop, ball, court, animated crowd, "HALFTIME SHOW" sign.
4. Drag-to-aim reticle that sways with the heartbeat.
5. Hold-and-release **SHOOT** button with a shot meter, timing rating and make chance.
6. Ball flight animation from hands to hoop, showing a make or a miss.
7. 60-second round timer and score counter.
8. Heartbeat (BPM) system.
9. Hand shake that also shrinks the Perfect zone as BPM rises.
10. Jumbotron that shows BPM above a threshold.
11. Breathing break with a swipe sequence.
12. Round 2 with a moving hoop, unlocked by tying or beating the best Round 1 score (saved on the phone).
13. Results screen with scores, best score, NEW RECORD banner and PLAY AGAIN.
14. Final-10-seconds effects.
15. Haptic feedback.
16. Quit button during a game (with a confirmation dialog).
17. *(Won't be built)* Online leaderboard, accounts, difficulty settings, 3D graphics, sound, landscape mode.

---

## 4. Acceptance Criteria

Sizes are in **pt at a 360 pt-wide screen** and scale with the screen width (`s = screenWidth / 360`). "BPM" is the player's current heart rate. The game is portrait only.

**Start & flow**
1. On launch, the home screen shows the title "Pressure Free Throw", a START button and a HOW TO PLAY button. Tapping START begins Round 1.
2. The home screen shows the saved Best Round 1 and Best Final scores, or "—" if there are none.
3. A round timer shows whole seconds, starting at 60 and counting down to 0. At 0 the round ends and no new shots can start. A ball already in the air still counts.
4. A score counter shows the number of made shots in the current round, starting at 0.
5. A quit (✕) button on the game screen asks "Quit this game?" The game is paused while the dialog is open. Quitting returns home without saving.

**Aiming**
6. Dragging a finger on the court moves the reticle (a ring about 26 pt across) by the same distance as the finger, kept inside the play area. At the start of each round the reticle is placed below the hoop, so the player must aim.
7. The reticle's drawn position is its aim position plus a sway offset. Horizontal sway amplitude = `(BPM − 60) × 0.2 × s` pt, and vertical amplitude is half that. It sways at the BPM rate (at 120 BPM it sways 2 times per second, ±12 pt horizontally).
8. A shot is "on target" if the reticle's drawn center is within 18 pt (× s) horizontally and 12 pt (× s) vertically of the rim's center at the moment SHOOT is released. Off-target shots always miss.
9. Aiming is ignored while SHOOT is being held.

**Shooting**
10. Pressing and holding **SHOOT** shows a vertical meter that fills from 0% to 100% in 1.0 s. Holding past 100% for 0.5 s auto-releases as a **Bad** shot.
11. The meter has a visible green **Perfect** zone. At BPM ≤ 90 it spans 85–95%. Its width shrinks linearly to 4% (centered at 90%) at BPM 180.
12. On release the rating is **Perfect** if inside the green zone, **Good** if within 10 percentage points outside it, and **Bad** otherwise. The rating text is shown for 1 s.
13. Make chance for an on-target shot: Perfect 95%, Good 60%, Bad 15%.
14. On release the ball flies from the hands toward the reticle in 0.8 s, then drops through the net (make) or bounces away (miss). A make adds 1 to the score.
15. A new shot cannot start until 1.0 s after the previous release. The SHOOT button looks dimmed while it is unavailable.

**Heartbeat**
16. BPM starts at 70 at the beginning of each game, is shown on screen and is clamped between 70 and 180.
17. BPM rises 0.5 per second of round time, plus 5 per missed shot. In the final 10 seconds of a round it rises 1.5 per second instead.
18. Each frame, the hands are drawn shifted by a random offset of up to `(BPM − 70) / 12 × s` pt in each direction.
19. When BPM is 100 or higher, the jumbotron replaces the "HALFTIME SHOW" text and shows the current BPM. Below 100, the sign text returns.
20. When BPM is 100 or higher, the phone gives a light haptic tap once per heartbeat during rounds.

**Breathing break**
21. A breathing break starts when a round's timer reaches 40 and again at 20 (two per round), but never during a shot (meter held or ball in the air). In that case it starts as soon as the shot finishes. The round timer is paused for the whole break.
22. During the break the scene is dimmed, the crowd freezes, and 4 random arrows (← ↑ → ↓) are shown. The player has 5 seconds to swipe in those directions, in order. A swipe counts when the finger moves at least 30 pt, and its direction is whichever of horizontal or vertical moved more.
23. If all 4 swipes are correct and in order, BPM drops by 20 (not below 70). A wrong swipe or running out of time ends the break with no BPM change. Either way the round resumes right after, with a short "Calm!" or "Missed it" message.

**Round 2**
24. The best Round 1 score is saved on the phone with AsyncStorage. After Round 1, if no best exists (first play) or the Round 1 score is greater than or equal to the saved best, the player goes to Round 2. Otherwise the game ends. The saved best is then updated if the new score is higher (or if none existed).
25. Before Round 2, a "ROUND 2" screen shows for 2 seconds. Round 2 follows all the rules above, keeps the current BPM, and resets the round score and timer.
26. In Round 2 the hoop moves left and right at 45 pt/s (× s) within ±75 pt (× s) of center, reversing at each edge. The on-target check uses the hoop's current position.

**End of game**
27. The results screen shows the Round 1 score, the Round 2 score (or "—" if not reached), the final score (the sum of both) and the best-ever final score.
28. If the final score beats the saved best final score (or there was none and the final score is above 0), a "NEW RECORD" banner is shown and the best is saved.
29. A PLAY AGAIN button starts a new game, and a HOME button returns to the home screen.

**Final seconds & presentation**
30. In the final 10 seconds of a round, the timer text is red and pulses, and a red glow is drawn at the screen edges.
31. The crowd (at least 30 figures) bobs up and down continuously during rounds.

**Reliability**
32. If saved scores can't be read or are corrupted, the app treats them as "no best yet" and still runs. If saving fails, the game still shows results. Neither case crashes the app.
33. If the app is sent to the background mid-round, the game doesn't jump ahead when it comes back.
34. Only game scores are stored. No personal or sensitive data is collected or saved.

---

## 5. Priorities

**Core (build first):**
- **A. Shot loop:** 6, 8, 10, 12, 13, 14, 15.
- **B. Round structure:** 1, 3, 4, 27 (Round 1 only), 29.
- **C. Heartbeat pressure:** 7, 11, 16, 17.

**Next, in order:** hand shake + final seconds (18, 30), breathing break (21–23), jumbotron + crowd (19, 31), Round 2 + saved bests (2, 24–26, 28), haptics (20).

**Cut first:** haptics → Round 2 / saved bests → jumbotron → crowd animation.

---

## 6. Tech

- **Framework:** React Native with Expo (SDK 58) and TypeScript, run on a phone with **Expo Go**. No custom native code; only Expo Go-supported packages (`expo-router`, `expo-haptics`, `@react-native-async-storage/async-storage`).
- **Navigation:** Expo Router stack with four screens in `src/app/`: `index` (home), `how-to-play`, `game` and `results`.
- **Game loop:** `requestAnimationFrame` drives a plain TypeScript engine (`src/game/engine.ts`) that updates the game state. The screen re-renders from a snapshot each frame. Frame time is capped at 0.1 s.
- **Storage:** AsyncStorage keys `pft:bestRound1` and `pft:bestFinal` (whole numbers).
- **How to run:** `npm install`, then `npx expo start`, and scan the QR code with Expo Go.
- **Controls:** drag on the court to aim, hold and release SHOOT to shoot, swipe during breathing breaks, tap for buttons.
