/**
 * Unit tests for the game rules in SPEC.md Section 4 (run with `npm test`).
 * The engine is plain TypeScript, so these run without a phone.
 */
import { describe, expect, it } from '@jest/globals';

import {
  computeLayout,
  createGame,
  type GameEvent,
  type GameState,
  isOnTarget,
  perfectZone,
  pressShoot,
  rateRelease,
  releaseShoot,
  reticlePosition,
  rimCenter,
  snapshot,
  swipe,
  update,
} from './engine';

const layout = computeLayout(360, 740); // s = 1
const NO_BESTS = { bestRound1: null, bestFinal: null };
const FRAME = 1 / 60;

/** Runs the engine for `seconds`, collecting every event. */
function run(state: GameState, seconds: number, eachFrame?: () => void): GameEvent[] {
  const events: GameEvent[] = [];
  for (let t = 0; t < seconds; t += FRAME) {
    eachFrame?.();
    events.push(...update(state, FRAME));
  }
  return events;
}

/** Clears breathing breaks as soon as they start, so they don't stall a long run. */
function autoClearBreaks(state: GameState) {
  return () => {
    if (state.phase === 'break' && state.breathing) {
      swipe(state, state.breathing.sequence[state.breathing.progress]);
    }
  };
}

describe('perfect zone and ratings (AC11, AC12)', () => {
  it('is 85–95% at or below 90 BPM', () => {
    expect(perfectZone(70)).toEqual({ low: 85, high: 95 });
    expect(perfectZone(90)).toEqual({ low: 85, high: 95 });
  });

  it('shrinks to 4% wide, centered at 90%, at 180 BPM', () => {
    expect(perfectZone(180)).toEqual({ low: 88, high: 92 });
  });

  it('rates Perfect inside, Good within 10 points outside, Bad beyond', () => {
    expect(rateRelease(90, 70)).toBe('Perfect');
    expect(rateRelease(80, 70)).toBe('Good');
    expect(rateRelease(100, 70)).toBe('Good');
    expect(rateRelease(74, 70)).toBe('Bad');
  });
});

describe('aiming (AC7, AC8, AC9)', () => {
  it('sways ±12 pt horizontally at 120 BPM with no sway at 60 BPM', () => {
    const state = createGame(layout, NO_BESTS);
    state.bpm = 120;
    state.swayPhase = Math.PI / 2;
    expect(reticlePosition(state).x - state.aim.x).toBeCloseTo(12);
    state.bpm = 60;
    expect(reticlePosition(state).x).toBeCloseTo(state.aim.x);
  });

  it('sways vertically at the same rate as horizontally, at half the size', () => {
    const state = createGame(layout, NO_BESTS);
    state.bpm = 120;
    state.swayPhase = 0;
    expect(reticlePosition(state).y - state.aim.y).toBeCloseTo(6);
    state.swayPhase = 2 * Math.PI;
    expect(reticlePosition(state).y - state.aim.y).toBeCloseTo(6);
  });

  it('is on target within 18 pt horizontally and 12 pt vertically', () => {
    const rim = { x: 100, y: 100 };
    expect(isOnTarget({ x: 118, y: 112 }, rim, 1)).toBe(true);
    expect(isOnTarget({ x: 119, y: 100 }, rim, 1)).toBe(false);
    expect(isOnTarget({ x: 100, y: 113 }, rim, 1)).toBe(false);
  });
});

describe('shooting (AC10, AC14, AC15)', () => {
  it('auto-releases as Bad after holding 0.5 s past full', () => {
    const state = createGame(layout, NO_BESTS);
    pressShoot(state);
    const events = run(state, 1.55);
    expect(events).toContainEqual({ type: 'rating', rating: 'Bad' });
    expect(state.charging).toBe(false);
  });

  it('blocks a new shot until 1.0 s after release', () => {
    const state = createGame(layout, NO_BESTS);
    pressShoot(state);
    run(state, 0.9);
    releaseShoot(state);
    run(state, 0.5);
    expect(pressShoot(state)).toBe(false);
    run(state, 0.55);
    expect(pressShoot(state)).toBe(true);
  });

  it('always misses (and adds 5 BPM) when off target', () => {
    const state = createGame(layout, NO_BESTS);
    pressShoot(state);
    run(state, 0.9);
    releaseShoot(state);
    const bpmBefore = state.bpm;
    const events = run(state, 0.85);
    expect(events).toContainEqual({ type: 'miss' });
    expect(state.score).toBe(0);
    expect(state.bpm).toBeGreaterThanOrEqual(bpmBefore + 5);
  });
});

describe('heartbeat (AC16, AC17, AC19)', () => {
  it('rises 0.5/s normally and 1.5/s in the final 10 seconds', () => {
    const state = createGame(layout, NO_BESTS);
    run(state, 10);
    expect(state.bpm).toBeCloseTo(75, 0);

    const late = createGame(layout, NO_BESTS);
    late.timeLeft = 10;
    late.nextBreakIndex = 2; // skip breaks
    run(late, 2);
    expect(late.bpm).toBeCloseTo(73, 0);
  });

  it('shows the jumbotron from the unrounded BPM', () => {
    const state = createGame(layout, NO_BESTS);
    state.bpm = 99.6;
    expect(snapshot(state).jumbotron).toBe(false);
    state.bpm = 100;
    expect(snapshot(state).jumbotron).toBe(true);
  });
});

describe('breathing breaks (AC21, AC23)', () => {
  it('starts at 40 s and pauses the timer', () => {
    const state = createGame(layout, NO_BESTS);
    const events = run(state, 20.1);
    expect(events).toContainEqual({ type: 'breakStart' });
    const frozen = state.timeLeft;
    run(state, 1);
    expect(state.timeLeft).toBe(frozen);
  });

  it('waits for the shot and its make/miss animation to finish', () => {
    const state = createGame(layout, NO_BESTS);
    state.timeLeft = 40.2;
    pressShoot(state);
    run(state, 0.5);
    releaseShoot(state);
    run(state, 1.0); // ball has landed but is still animating
    expect(state.phase).toBe('playing');
    run(state, 0.5);
    expect(state.phase).toBe('break');
  });

  it('drops BPM by 20 after four correct swipes, not below 70', () => {
    const state = createGame(layout, NO_BESTS);
    state.bpm = 120;
    run(state, 20.1);
    const before = state.bpm;
    const sequence = state.breathing!.sequence;
    sequence.forEach((direction) => swipe(state, direction));
    expect(state.phase).toBe('playing');
    expect(state.bpm).toBeCloseTo(before - 20);

    const calm = createGame(layout, NO_BESTS);
    run(calm, 20.1);
    calm.bpm = 75;
    calm.breathing!.sequence.forEach((direction) => swipe(calm, direction));
    expect(calm.bpm).toBe(70);
  });

  it('a wrong swipe ends the break with no BPM change', () => {
    const state = createGame(layout, NO_BESTS);
    run(state, 20.1);
    const bpm = state.bpm;
    const wrong = state.breathing!.sequence[0] === 'up' ? 'down' : 'up';
    swipe(state, wrong);
    expect(state.phase).toBe('playing');
    expect(state.bpm).toBe(bpm);
  });
});

describe('rounds, bests and records (AC3, AC24, AC28)', () => {
  it('always goes to Round 2 on a first play', () => {
    const state = createGame(layout, NO_BESTS);
    const events = run(state, 61, autoClearBreaks(state));
    expect(events).toContainEqual(
      expect.objectContaining({ type: 'round1End', qualified: true, newBestRound1: 0 }),
    );
    expect(state.phase).toBe('roundIntro');
  });

  it('ends after Round 1 when the score is below the saved best', () => {
    const state = createGame(layout, { bestRound1: 5, bestFinal: 10 });
    const events = run(state, 61, autoClearBreaks(state));
    const over = events.find((e) => e.type === 'gameOver');
    expect(over).toEqual({
      type: 'gameOver',
      result: {
        round1: 0,
        newBestRound1: null,
        round2: null,
        final: 0,
        newRecord: false,
        bestFinal: 10,
      },
    });
  });

  it('says "Too late!" when SHOOT is still held at the buzzer', () => {
    const state = createGame(layout, NO_BESTS);
    state.timeLeft = 0.3;
    state.nextBreakIndex = 2;
    run(state, 0.1);
    pressShoot(state);
    run(state, 0.3);
    expect(state.charging).toBe(false);
    expect(snapshot(state).message).toBe('Too late!');
  });

  it('counts a ball already in the air when time runs out', () => {
    const state = createGame(layout, NO_BESTS);
    state.nextBreakIndex = 2;
    state.timeLeft = 0.5;
    state.aim = { ...rimCenter(state) };
    state.bpm = 60; // no sway
    pressShoot(state);
    run(state, 0.3);
    releaseShoot(state);
    run(state, 0.3);
    expect(state.phase).toBe('finishing');
    run(state, 0.6);
    expect(state.round1Score).not.toBeNull();
  });
});
