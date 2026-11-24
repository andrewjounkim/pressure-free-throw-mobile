/**
 * Saved best scores (AsyncStorage). Only whole-number game scores are stored,
 * no personal data. Every function catches its own errors so storage problems
 * never crash the game.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MAX_SCORE } from '@/game/constants';
import type { Bests } from '@/game/engine';

const KEYS = {
  bestRound1: 'pft:bestRound1',
  bestFinal: 'pft:bestFinal',
} as const;

export const NO_BESTS: Bests = { bestRound1: null, bestFinal: null };

/** Turns a stored string into a score, or null if it is missing or corrupted. */
function parseScore(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 && value <= MAX_SCORE ? value : null;
}

export async function loadBests(): Promise<{ bests: Bests; failed: boolean }> {
  try {
    const entries = await AsyncStorage.multiGet([KEYS.bestRound1, KEYS.bestFinal]);
    const lookup = new Map(entries);
    return {
      bests: {
        bestRound1: parseScore(lookup.get(KEYS.bestRound1)),
        bestFinal: parseScore(lookup.get(KEYS.bestFinal)),
      },
      failed: false,
    };
  } catch (error) {
    console.warn('Could not load best scores', error);
    return { bests: NO_BESTS, failed: true };
  }
}

async function saveScore(key: string, value: number): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, String(Math.min(MAX_SCORE, Math.max(0, Math.floor(value)))));
    return true;
  } catch (error) {
    console.warn(`Could not save ${key}`, error);
    return false;
  }
}

export const saveBestRound1 = (value: number) => saveScore(KEYS.bestRound1, value);
export const saveBestFinal = (value: number) => saveScore(KEYS.bestFinal, value);

export async function clearBests(): Promise<boolean> {
  try {
    await AsyncStorage.multiRemove([KEYS.bestRound1, KEYS.bestFinal]);
    return true;
  } catch (error) {
    console.warn('Could not clear best scores', error);
    return false;
  }
}
