# Pressure Free Throw (Mobile)

CMU 15-114 HW10: a React Native + Expo app, demoed on a phone with Expo Go.

## What it does and why

<!-- AI draft, written with professor's permission. Andrew: polish before submitting. -->
Pressure Free Throw is a basketball free-throw game for your phone: you drag to aim, hold and release SHOOT to time your shot, and the whole time your heartbeat climbs, making the reticle sway, your hands shake and the perfect-release window shrink. I chose it because I'd already designed this game for the desktop in an earlier assignment, and the pressure idea fits a phone even better: you can literally *feel* the heartbeat through haptics in your hand.

## Screens

<!-- AI draft, written with professor's permission. Andrew: polish before submitting. -->
- **Home:** the title, your saved Best Round 1 and Best Final scores (they stay after you close the app), and buttons to START a game, read HOW TO PLAY, or reset your best scores (with a confirmation).
- **How to Play:** cards explaining aiming, shooting, ratings, the heartbeat, breathing breaks and Round 2, plus a GOT IT button that goes back home.
- **Game:** the arena with the crowd, the "HALFTIME SHOW" sign (which turns into a BPM jumbotron once your heart rate passes 100), the hoop and your hands. You drag on the court to aim and hold and release SHOOT to fire. A HUD shows the round, timer, score and BPM. At 40 and 20 seconds a breathing break pauses the clock, and you swipe four arrows in order to calm down. If you tie or beat your best Round 1, a ROUND 2 screen appears and the hoop starts moving. The ✕ button lets you quit (it asks first).
- **Results:** your Round 1, Round 2 and final scores, your best-ever final score and a NEW RECORD banner when you beat it, with PLAY AGAIN and HOME buttons.

## What surprised me about mobile development

<!-- AI draft, written with professor's permission. Andrew: polish before submitting. -->
What surprised me most was how different input is on a phone. On the desktop version I could aim with the mouse and shoot with the F key at the same time, but on a phone a finger covers what you're aiming at, and React Native only lets one touch "own" the screen at a time, so aiming and shooting had to be redesigned as a drag plus a separate SHOOT button. I was also surprised that I could see every saved change on my actual phone within seconds through Expo Go without ever building or installing an app.

## Setup and run

**Expo SDK:** 58. The project was created with `npx create-expo-app@latest` and no `--template` flag, so it uses the default template (`expo` `~58.0.26`, React Native 0.88.1, Expo Router 58). The tool printed `TODO: paste the exact template line it printed, e.g. default@sdk-58`.

**Tested on:** <DEVICE>

**You need:**
- Node.js **22.13 or newer**. Check with `node --version`.
- A free Expo account from [expo.dev](https://expo.dev).
- The free **Expo Go** app from the App Store or Play Store. An iPhone needs iOS 16.4 or later. You don't need a paid Apple Developer account.

**Steps:**

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/andrewjounkim/pressure-free-throw-mobile.git
   cd pressure-free-throw-mobile
   npm install
   ```
2. Sign in to the **same** Expo account on both sides. On your computer, run:
   ```bash
   npx expo login
   ```
   Then open Expo Go on your phone and sign in to that same account. If the accounts don't match, the QR code scans but nothing opens.
3. Start the development server:
   ```bash
   npx expo start
   ```
4. Scan the QR code. Your phone and computer must be on the **same Wi-Fi**.
   - **iPhone:** use the built-in Camera app.
   - **Android:** scan from inside Expo Go.
   - **Simulator:** press `i` (iOS Simulator, Mac only) or `a` (Android emulator) in the terminal instead.
5. **If the phone can't connect** (for example, on a network that blocks direct connections), stop the server with Ctrl+C and use tunnel mode. It's slower but routes through Expo's servers:
   ```bash
   npx expo start --tunnel
   ```

**Troubleshooting:**
- **"Project needs a different SDK version":** update Expo Go from the app store. Expo Go must support SDK 58.
- **The app acts strangely:** press `r` in the terminal to reload, or restart `npx expo start`.

**Dependencies beyond the starter:**
- `@react-native-async-storage/async-storage` saves the best scores.
- `expo-haptics` gives heartbeat and shot vibrations.
- `react-native-gesture-handler` (already in the starter) lets you aim and hold SHOOT at the same time with two thumbs.

Expo Go includes both, so no custom build is needed.

**Checks:**
```bash
npm test           # 19 unit tests for the game rules (src/game/engine.test.ts)
npx tsc --noEmit   # type check
npx eslint .       # lint
```

## Review decisions

<!-- AI draft, written with professor's permission. Andrew: polish before submitting. -->
REVIEW.md had no [FAIL] findings. I fixed all of the [WARN] findings except the ones below, in the commit "Fixes after AI review".

I fixed findings 5, 7, 14 (first point), 15, 19, 21, 33 and 35–48. That included switching aiming and SHOOT to `react-native-gesture-handler` so two thumbs work at once, and adding unit tests.

**Not fixed, and why:**
- **1 (minor note, double-tapping START):** the screen changes on the first tap, so a second tap in time is unlikely. I'll guard it if it happens when I test.
- **6 (nit, aim bounds not scaled):** the 12 pt edge margin only keeps the reticle on screen and doesn't need to scale.
- **14 (second point, on-target balls fly to the rim's center):** this is on purpose. A make should look like it goes through the hoop, and the difference is at most 18 pt.
- **18 (nit, more shake on 120 Hz screens):** the shake is meant to look random, and AC18 only sets how far it can move, not how often.
- **30 (nit, vignette is a hard border):** it's clearly visible, and React Native has no simple blur or gradient without adding another package.
- **42 (Alert on web):** the spec only targets Expo Go on a phone, not the web.
- **45 (re-rendering every frame):** the spec chose this design, and it is fast enough for about 60 simple shapes. I'd move to Reanimated only if testing on my phone shows dropped frames.
- **47 (unused starter dependencies):** I deleted the unused template files and fixed the `app.json` colors, but kept the starter packages. Removing them risks breaking Expo Router for no benefit to the app.
