/**
 * Pure TypeScript game engine (no React). The game screen owns one GameState,
 * calls `update` every animation frame, and renders from `snapshot`.
 * Functions return GameEvents so side effects (haptics, saving, navigation)
 * stay in the screen, not in the game rules.
 */
import {
  BALL_ARC_HEIGHT,
  BALL_SIZE_HANDS,
  BALL_SIZE_HOOP,
  BASE_WIDTH,
  BPM_BREAK_RELIEF,
  BPM_MAX,
  BPM_MIN,
  BPM_MISS_PENALTY,
  BPM_RISE_FINAL_PER_SECOND,
  BPM_RISE_PER_SECOND,
  BPM_START,
  BREAK_AT_SECONDS,
  BREAK_SECONDS,
  BREAK_SEQUENCE_LENGTH,
  FINAL_SECONDS,
  FLIGHT_SECONDS,
  GOOD_MARGIN,
  HAND_SHAKE_DIVISOR,
  HAPTIC_HEARTBEAT_BPM,
  HOOP_RANGE,
  HOOP_SPEED,
  MAKE_CHANCE,
  MAX_FRAME_SECONDS,
  MESSAGE_SHOW_SECONDS,
  METER_FILL_SECONDS,
  METER_OVERHOLD_SECONDS,
  OUTCOME_SECONDS,
  PERFECT_ZONE_CENTER,
  PERFECT_ZONE_SHRINK_FROM_BPM,
  PERFECT_ZONE_WIDTH_CALM,
  PERFECT_ZONE_WIDTH_MIN,
  RATING_SHOW_SECONDS,
  ROUND_INTRO_SECONDS,
  ROUND_SECONDS,
  SHOT_COOLDOWN_SECONDS,
  SWAY_PER_BPM,
  TARGET_HALF_HEIGHT,
  TARGET_HALF_WIDTH,
} from './constants';

export type Direction = 'left' | 'up' | 'right' | 'down';
export type Rating = 'Perfect' | 'Good' | 'Bad';
export type Phase = 'playing' | 'break' | 'roundIntro' | 'finishing' | 'over';

export interface Point {
  x: number;
  y: number;
}

export interface Bests {
  bestRound1: number | null;
  bestFinal: number | null;
}

export interface GameResult {
  round1: number;
  round2: number | null;
  final: number;
  newRecord: boolean;
  bestFinal: number | null;
}

export type GameEvent =
  | { type: 'heartbeat' }
  | { type: 'rating'; rating: Rating }
  | { type: 'make' }
  | { type: 'miss' }
  | { type: 'breakStart' }
  | { type: 'breakEnd'; success: boolean }
  | { type: 'round1End'; score: number; newBestRound1: number | null; qualified: boolean }
  | { type: 'gameOver'; result: GameResult };

/** Screen positions for the scene, derived from the measured play area. */
export interface Layout {
  width: number;
  height: number;
  /** Scale factor: screen width / 360. */
  s: number;
  centerX: number;
  signTop: number;
  signHeight: number;
  crowdTop: number;
  courtTop: number;
  rimY: number;
  hands: Point;
  aimStart: Point;
  aimMin: Point;
  aimMax: Point;
}

interface Ball {
  t: number;
  from: Point;
  /** Where an off-target ball flies (fixed at release). */
  missPoint: Point;
  /** Reticle offset from the rim at release (for on-target misses hitting the rim). */
  rimOffset: Point;
  onTarget: boolean;
  made: boolean;
  resolved: boolean;
  bounceDir: 1 | -1;
}

interface BreathingBreak {
  sequence: Direction[];
  progress: number;
  timeLeft: number;
}

export interface GameState {
  layout: Layout;
  bests: Bests;
  phase: Phase;
  round: 1 | 2;
  round1Score: number | null;
  timeLeft: number;
  score: number;
  bpm: number;
  clock: number;
  crowdTime: number;
  swayPhase: number;
  beatPhase: number;
  aim: Point;
  hoopX: number;
  hoopDir: 1 | -1;
  charging: boolean;
  chargeTime: number;
  lastFill: number;
  sinceRelease: number;
  ball: Ball | null;
  rating: { value: Rating; age: number } | null;
  message: { text: string; age: number } | null;
  nextBreakIndex: number;
  breakPending: boolean;
  breathing: BreathingBreak | null;
  introLeft: number;
  shake: Point;
}

const DIRECTIONS: Direction[] = ['left', 'up', 'right', 'down'];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function computeLayout(width: number, height: number): Layout {
  const s = width / BASE_WIDTH;
  const centerX = width / 2;
  const signTop = 70;
  const signHeight = 58 * s;
  const crowdTop = signTop + signHeight + 6;
  const courtTop = crowdTop + 3 * 28 * s + 20 * s;
  const rimY = courtTop + 10 * s;
  return {
    width,
    height,
    s,
    centerX,
    signTop,
    signHeight,
    crowdTop,
    courtTop,
    rimY,
    hands: { x: centerX, y: height - 110 * s },
    aimStart: { x: centerX, y: rimY + 120 * s },
    aimMin: { x: 12, y: crowdTop },
    aimMax: { x: width - 12, y: height * 0.72 },
  };
}

export function createGame(layout: Layout, bests: Bests): GameState {
  const state: GameState = {
    layout,
    bests: { ...bests },
    phase: 'playing',
    round: 1,
    round1Score: null,
    timeLeft: ROUND_SECONDS,
    score: 0,
    bpm: BPM_START,
    clock: 0,
    crowdTime: 0,
    swayPhase: 0,
    beatPhase: 0,
    aim: { ...layout.aimStart },
    hoopX: layout.centerX,
    hoopDir: 1,
    charging: false,
    chargeTime: 0,
    lastFill: 0,
    sinceRelease: Infinity,
    ball: null,
    rating: null,
    message: null,
    nextBreakIndex: 0,
    breakPending: false,
    breathing: null,
    introLeft: 0,
    shake: { x: 0, y: 0 },
  };
  return state;
}

function startRound(state: GameState, round: 1 | 2) {
  state.round = round;
  state.phase = 'playing';
  state.timeLeft = ROUND_SECONDS;
  state.score = 0;
  state.aim = { ...state.layout.aimStart };
  state.hoopX = state.layout.centerX;
  state.hoopDir = 1;
  state.charging = false;
  state.chargeTime = 0;
  state.sinceRelease = Infinity;
  state.ball = null;
  state.rating = null;
  state.nextBreakIndex = 0;
  state.breakPending = false;
  state.breathing = null;
}

/** Perfect zone (in meter percent) for a BPM. 85–95 at ≤90 BPM, shrinking to 4 wide at 180. */
export function perfectZone(bpm: number): { low: number; high: number } {
  const t = clamp((bpm - PERFECT_ZONE_SHRINK_FROM_BPM) / (BPM_MAX - PERFECT_ZONE_SHRINK_FROM_BPM), 0, 1);
  const width = lerp(PERFECT_ZONE_WIDTH_CALM, PERFECT_ZONE_WIDTH_MIN, t);
  return { low: PERFECT_ZONE_CENTER - width / 2, high: PERFECT_ZONE_CENTER + width / 2 };
}

export function rateRelease(fillPercent: number, bpm: number): Rating {
  const { low, high } = perfectZone(bpm);
  if (fillPercent >= low && fillPercent <= high) return 'Perfect';
  if (fillPercent >= low - GOOD_MARGIN && fillPercent <= high + GOOD_MARGIN) return 'Good';
  return 'Bad';
}

export function rimCenter(state: GameState): Point {
  return { x: state.hoopX, y: state.layout.rimY };
}

export function reticlePosition(state: GameState): Point {
  const amplitude = Math.max(0, state.bpm - 60) * SWAY_PER_BPM * state.layout.s;
  return {
    x: state.aim.x + amplitude * Math.sin(state.swayPhase),
    y: state.aim.y + (amplitude / 2) * Math.sin(2 * state.swayPhase),
  };
}

export function isOnTarget(reticle: Point, rim: Point, s: number): boolean {
  return (
    Math.abs(reticle.x - rim.x) <= TARGET_HALF_WIDTH * s &&
    Math.abs(reticle.y - rim.y) <= TARGET_HALF_HEIGHT * s
  );
}

export function canStartShot(state: GameState): boolean {
  return (
    state.phase === 'playing' &&
    !state.charging &&
    state.timeLeft > 0 &&
    state.sinceRelease >= SHOT_COOLDOWN_SECONDS
  );
}

function addBpm(state: GameState, amount: number) {
  state.bpm = clamp(state.bpm + amount, BPM_MIN, BPM_MAX);
}

/** Move the aim point by a finger drag delta. Ignored while SHOOT is held. */
export function aimBy(state: GameState, dx: number, dy: number) {
  if (state.phase !== 'playing' || state.charging) return;
  const { aimMin, aimMax } = state.layout;
  state.aim = {
    x: clamp(state.aim.x + dx, aimMin.x, aimMax.x),
    y: clamp(state.aim.y + dy, aimMin.y, aimMax.y),
  };
}

export function pressShoot(state: GameState): boolean {
  if (!canStartShot(state)) return false;
  state.charging = true;
  state.chargeTime = 0;
  return true;
}

export function releaseShoot(state: GameState): GameEvent[] {
  if (!state.charging) return [];
  return releaseShot(state, false);
}

function releaseShot(state: GameState, forcedBad: boolean): GameEvent[] {
  const fill = clamp(state.chargeTime / METER_FILL_SECONDS, 0, 1) * 100;
  const rating = forcedBad ? 'Bad' : rateRelease(fill, state.bpm);
  const reticle = reticlePosition(state);
  const rim = rimCenter(state);
  const onTarget = isOnTarget(reticle, rim, state.layout.s);
  const made = onTarget && Math.random() < MAKE_CHANCE[rating];

  state.charging = false;
  state.lastFill = fill;
  state.sinceRelease = 0;
  state.rating = { value: rating, age: 0 };
  state.ball = {
    t: 0,
    from: { x: state.layout.hands.x + state.shake.x, y: state.layout.hands.y + state.shake.y },
    missPoint: reticle,
    rimOffset: { x: reticle.x - rim.x, y: 0 },
    onTarget,
    made,
    resolved: false,
    bounceDir: Math.random() < 0.5 ? -1 : 1,
  };
  return [{ type: 'rating', rating }];
}

function startBreak(state: GameState, events: GameEvent[]) {
  const sequence = Array.from(
    { length: BREAK_SEQUENCE_LENGTH },
    () => DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)],
  );
  state.phase = 'break';
  state.breakPending = false;
  state.nextBreakIndex += 1;
  state.ball = null;
  state.breathing = { sequence, progress: 0, timeLeft: BREAK_SECONDS };
  events.push({ type: 'breakStart' });
}

function endBreak(state: GameState, success: boolean, events: GameEvent[]) {
  if (success) addBpm(state, -BPM_BREAK_RELIEF);
  state.message = { text: success ? `Calm! −${BPM_BREAK_RELIEF} BPM` : 'Missed it', age: 0 };
  state.breathing = null;
  state.phase = 'playing';
  events.push({ type: 'breakEnd', success });
}

/** Handle one swipe during a breathing break. */
export function swipe(state: GameState, direction: Direction): GameEvent[] {
  const breathing = state.breathing;
  if (state.phase !== 'break' || !breathing) return [];
  const events: GameEvent[] = [];
  if (breathing.sequence[breathing.progress] === direction) {
    breathing.progress += 1;
    if (breathing.progress >= breathing.sequence.length) endBreak(state, true, events);
  } else {
    endBreak(state, false, events);
  }
  return events;
}

function finishGame(state: GameState, events: GameEvent[]) {
  const round1 = state.round1Score ?? state.score;
  const round2 = state.round === 2 ? state.score : null;
  const final = round1 + (round2 ?? 0);
  const previousBest = state.bests.bestFinal;
  const newRecord = previousBest === null ? final > 0 : final > previousBest;
  if (newRecord) state.bests.bestFinal = final;
  state.phase = 'over';
  state.charging = false;
  events.push({
    type: 'gameOver',
    result: { round1, round2, final, newRecord, bestFinal: state.bests.bestFinal },
  });
}

function endRound(state: GameState, events: GameEvent[]) {
  if (state.round === 1) {
    const score = state.score;
    const best = state.bests.bestRound1;
    const qualified = best === null || score >= best;
    const newBestRound1 = best === null || score > best ? score : null;
    if (newBestRound1 !== null) state.bests.bestRound1 = newBestRound1;
    state.round1Score = score;
    events.push({ type: 'round1End', score, newBestRound1, qualified });
    if (qualified) {
      state.phase = 'roundIntro';
      state.introLeft = ROUND_INTRO_SECONDS;
      state.ball = null;
      state.rating = null;
    } else {
      finishGame(state, events);
    }
  } else {
    finishGame(state, events);
  }
}

function updateBall(state: GameState, dt: number, events: GameEvent[]) {
  const ball = state.ball;
  if (!ball) return;
  ball.t += dt;
  if (!ball.resolved && ball.t >= FLIGHT_SECONDS) {
    ball.resolved = true;
    if (ball.made) {
      state.score += 1;
      events.push({ type: 'make' });
    } else {
      addBpm(state, BPM_MISS_PENALTY);
      events.push({ type: 'miss' });
    }
  }
  if (ball.t >= FLIGHT_SECONDS + OUTCOME_SECONDS) state.ball = null;
}

/** Advance the game by `dtSeconds`. Returns what happened this frame. */
export function update(state: GameState, dtSeconds: number): GameEvent[] {
  const events: GameEvent[] = [];
  if (state.phase === 'over') return events;
  const dt = clamp(dtSeconds, 0, MAX_FRAME_SECONDS);
  const { s } = state.layout;

  state.clock += dt;
  if (state.rating) {
    state.rating.age += dt;
    if (state.rating.age >= RATING_SHOW_SECONDS) state.rating = null;
  }
  if (state.message) {
    state.message.age += dt;
    if (state.message.age >= MESSAGE_SHOW_SECONDS) state.message = null;
  }

  const shakeMax = ((state.bpm - BPM_MIN) / HAND_SHAKE_DIVISOR) * s;
  state.shake = {
    x: (Math.random() * 2 - 1) * shakeMax,
    y: (Math.random() * 2 - 1) * shakeMax,
  };

  if (state.phase === 'roundIntro') {
    state.crowdTime += dt;
    state.introLeft -= dt;
    if (state.introLeft <= 0) startRound(state, 2);
    return events;
  }

  if (state.phase === 'break') {
    const breathing = state.breathing;
    if (breathing) {
      breathing.timeLeft -= dt;
      if (breathing.timeLeft <= 0) endBreak(state, false, events);
    }
    return events;
  }

  // 'playing' or 'finishing'
  state.crowdTime += dt;
  state.swayPhase += 2 * Math.PI * (state.bpm / 60) * dt;
  state.beatPhase += (state.bpm / 60) * dt;
  if (state.beatPhase >= 1) {
    state.beatPhase -= Math.floor(state.beatPhase);
    if (state.bpm >= HAPTIC_HEARTBEAT_BPM) events.push({ type: 'heartbeat' });
  }

  if (state.round === 2) {
    const edge = HOOP_RANGE * s;
    state.hoopX += state.hoopDir * HOOP_SPEED * s * dt;
    if (state.hoopX > state.layout.centerX + edge) {
      state.hoopX = state.layout.centerX + edge;
      state.hoopDir = -1;
    } else if (state.hoopX < state.layout.centerX - edge) {
      state.hoopX = state.layout.centerX - edge;
      state.hoopDir = 1;
    }
  }

  state.sinceRelease += dt;
  if (state.charging) {
    state.chargeTime += dt;
    if (state.chargeTime >= METER_FILL_SECONDS + METER_OVERHOLD_SECONDS) {
      events.push(...releaseShot(state, true));
    }
  }
  updateBall(state, dt, events);

  if (state.phase === 'playing') {
    state.timeLeft -= dt;
    const rise = state.timeLeft <= FINAL_SECONDS ? BPM_RISE_FINAL_PER_SECOND : BPM_RISE_PER_SECOND;
    addBpm(state, rise * dt);

    const nextBreakAt = BREAK_AT_SECONDS[state.nextBreakIndex];
    if (!state.breakPending && nextBreakAt !== undefined && state.timeLeft <= nextBreakAt) {
      state.breakPending = true;
    }
    const shotInProgress = state.charging || (state.ball !== null && !state.ball.resolved);
    if (state.breakPending && !shotInProgress && state.timeLeft > 0) {
      startBreak(state, events);
      return events;
    }

    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.charging = false;
      state.breakPending = false;
      state.phase = 'finishing';
    }
  }

  if (state.phase === 'finishing' && (state.ball === null || state.ball.resolved)) {
    endRound(state, events);
  }
  return events;
}

/** Everything the screen needs to draw one frame (a fresh object every time). */
export interface GameView {
  layout: Layout;
  phase: Phase;
  round: 1 | 2;
  round1Score: number | null;
  timer: number;
  finalSeconds: boolean;
  clock: number;
  score: number;
  bpm: number;
  crowdTime: number;
  reticle: Point;
  rim: Point;
  shake: Point;
  ball: { x: number; y: number; size: number; opacity: number; behindNet: boolean } | null;
  showHeldBall: boolean;
  meter: { visible: boolean; fill: number; zoneLow: number; zoneHigh: number };
  canShoot: boolean;
  rating: Rating | null;
  message: string | null;
  breathing: { sequence: Direction[]; progress: number; timeLeft: number } | null;
}

function ballView(state: GameState): GameView['ball'] {
  const ball = state.ball;
  if (!ball) return null;
  const { s } = state.layout;
  const rim = rimCenter(state);
  const target = ball.onTarget
    ? { x: rim.x + (ball.made ? 0 : ball.rimOffset.x), y: rim.y - 4 * s }
    : ball.missPoint;

  if (ball.t < FLIGHT_SECONDS) {
    const p = ball.t / FLIGHT_SECONDS;
    return {
      x: lerp(ball.from.x, target.x, p),
      y: lerp(ball.from.y, target.y, p) - BALL_ARC_HEIGHT * s * 4 * p * (1 - p),
      size: lerp(BALL_SIZE_HANDS, BALL_SIZE_HOOP, p) * s,
      opacity: 1,
      behindNet: false,
    };
  }

  const q = clamp((ball.t - FLIGHT_SECONDS) / OUTCOME_SECONDS, 0, 1);
  const size = BALL_SIZE_HOOP * s;
  if (ball.made) {
    return { x: target.x, y: target.y + q * 40 * s, size, opacity: 1 - q * 0.6, behindNet: true };
  }
  if (ball.onTarget) {
    // Clanks off the rim and bounces away to one side.
    return {
      x: target.x + ball.bounceDir * q * 70 * s,
      y: target.y - Math.sin(Math.PI * q) * 30 * s + q * 30 * s,
      size,
      opacity: 1 - q * 0.5,
      behindNet: false,
    };
  }
  return { x: target.x, y: target.y + q * 60 * s, size, opacity: 1 - q, behindNet: false };
}

export function snapshot(state: GameState): GameView {
  const zone = perfectZone(state.bpm);
  const meterFill = state.charging
    ? clamp(state.chargeTime / METER_FILL_SECONDS, 0, 1) * 100
    : state.lastFill;
  const breathing = state.breathing;
  return {
    layout: state.layout,
    phase: state.phase,
    round: state.round,
    round1Score: state.round1Score,
    timer: Math.ceil(state.timeLeft),
    finalSeconds:
      (state.phase === 'playing' || state.phase === 'finishing') && state.timeLeft <= FINAL_SECONDS,
    clock: state.clock,
    score: state.score,
    bpm: Math.round(state.bpm),
    crowdTime: state.crowdTime,
    reticle: reticlePosition(state),
    rim: rimCenter(state),
    shake: state.shake,
    ball: ballView(state),
    showHeldBall: state.phase !== 'over' && state.sinceRelease >= SHOT_COOLDOWN_SECONDS,
    meter: {
      visible: state.charging || state.rating !== null,
      fill: meterFill,
      zoneLow: zone.low,
      zoneHigh: zone.high,
    },
    canShoot: canStartShot(state),
    rating: state.rating?.value ?? null,
    message: state.message?.text ?? null,
    breathing: breathing
      ? { sequence: [...breathing.sequence], progress: breathing.progress, timeLeft: breathing.timeLeft }
      : null,
  };
}
