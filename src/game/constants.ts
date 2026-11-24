/**
 * Game tuning numbers, taken from SPEC.md Section 4.
 * Sizes marked "pt @360" are points on a 360 pt-wide screen and get multiplied
 * by the scale factor `s = screenWidth / 360` at runtime.
 */

// Rounds & timer
export const ROUND_SECONDS = 60;
export const FINAL_SECONDS = 10;
export const ROUND_INTRO_SECONDS = 2;

// Heartbeat
export const BPM_START = 70;
export const BPM_MIN = 70;
export const BPM_MAX = 180;
export const BPM_RISE_PER_SECOND = 0.5;
export const BPM_RISE_FINAL_PER_SECOND = 1.5;
export const BPM_MISS_PENALTY = 5;
export const BPM_BREAK_RELIEF = 20;
export const JUMBOTRON_BPM = 100;
export const HAPTIC_HEARTBEAT_BPM = 100;

// Shot meter
export const METER_FILL_SECONDS = 1.0;
export const METER_OVERHOLD_SECONDS = 0.5;
export const PERFECT_ZONE_CENTER = 90;
export const PERFECT_ZONE_WIDTH_CALM = 10;
export const PERFECT_ZONE_WIDTH_MIN = 4;
export const PERFECT_ZONE_SHRINK_FROM_BPM = 90;
export const GOOD_MARGIN = 10;
export const MAKE_CHANCE = { Perfect: 0.95, Good: 0.6, Bad: 0.15 } as const;

// Shot timing
export const FLIGHT_SECONDS = 0.8;
export const OUTCOME_SECONDS = 0.6;
export const SHOT_COOLDOWN_SECONDS = 1.0;
export const RATING_SHOW_SECONDS = 1.0;
export const MESSAGE_SHOW_SECONDS = 1.2;

// Breathing break
export const BREAK_AT_SECONDS = [40, 20] as const;
export const BREAK_SECONDS = 5;
export const BREAK_SEQUENCE_LENGTH = 4;

// Geometry (pt @360)
export const BASE_WIDTH = 360;
export const SWAY_PER_BPM = 0.2;
export const TARGET_HALF_WIDTH = 18;
export const TARGET_HALF_HEIGHT = 12;
export const RETICLE_SIZE = 26;
export const HAND_SHAKE_DIVISOR = 12;
export const HOOP_SPEED = 45;
export const HOOP_RANGE = 75;
export const SWIPE_MIN_DISTANCE = 30;
export const RIM_WIDTH = 44;
export const BALL_SIZE_HANDS = 34;
export const BALL_SIZE_HOOP = 16;
export const BALL_ARC_HEIGHT = 120;

/** Highest score we save or accept from storage (a sanity limit, never reached in play). */
export const MAX_SCORE = 9999;

/** Longest frame step we simulate, so returning from the background never jumps ahead. */
export const MAX_FRAME_SECONDS = 0.1;
