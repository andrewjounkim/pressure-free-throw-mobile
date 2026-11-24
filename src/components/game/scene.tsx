/**
 * Arena art drawn with plain Views (no images): stands + crowd, sign/jumbotron,
 * court, hoop, ball, hands, reticle and the final-seconds vignette.
 */
import { StyleSheet, Text, View } from 'react-native';

import { CrowdShirts, CrowdSkins, Palette } from '@/constants/palette';
import { RETICLE_SIZE, RIM_WIDTH } from '@/game/constants';
import type { Layout, Point } from '@/game/engine';

const CROWD_ROWS = 3;
const CROWD_PER_ROW = 12;

/** Dark stands with 36 bobbing fans, plus the wooden court below. */
export function Arena({
  layout,
  crowdTime,
  finalSeconds,
}: {
  layout: Layout;
  crowdTime: number;
  /** The crowd bobs harder in the final seconds. */
  finalSeconds: boolean;
}) {
  const { s, width, crowdTop, courtTop, height } = layout;
  const spacing = width / CROWD_PER_ROW;
  const bobAmount = (finalSeconds ? 6 : 3) * s;

  const fans = [];
  for (let row = 0; row < CROWD_ROWS; row++) {
    for (let col = 0; col < CROWD_PER_ROW; col++) {
      const i = row * CROWD_PER_ROW + col;
      const x = spacing * col + spacing / 2 + (row % 2 === 0 ? 0 : spacing / 4);
      const bob = Math.sin(crowdTime * (3 + (i % 3)) + i * 1.7) * bobAmount;
      fans.push(
        <View
          key={i}
          style={[
            styles.fan,
            { left: x - 9 * s, top: crowdTop + row * 28 * s + bob, width: 18 * s },
          ]}>
          <View
            style={{
              width: 12 * s,
              height: 12 * s,
              borderRadius: 6 * s,
              backgroundColor: CrowdSkins[i % CrowdSkins.length],
            }}
          />
          <View
            style={{
              width: 18 * s,
              height: 14 * s,
              borderTopLeftRadius: 7 * s,
              borderTopRightRadius: 7 * s,
              backgroundColor: CrowdShirts[(i * 7) % CrowdShirts.length],
            }}
          />
        </View>,
      );
    }
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.stands, { height: courtTop }]} />
      {Array.from({ length: CROWD_ROWS }, (_, row) => (
        <View
          key={`row-${row}`}
          style={[
            styles.standsRow,
            { top: crowdTop + row * 28 * s + 20 * s, height: 8 * s },
          ]}
        />
      ))}
      {fans}
      <View style={[styles.court, { top: courtTop, height: height - courtTop }]}>
        <View style={[styles.courtPlank, { top: (height - courtTop) * 0.3 }]} />
        <View style={[styles.courtPlank, { top: (height - courtTop) * 0.6 }]} />
        <View
          style={[
            styles.lane,
            { left: width / 2 - 70 * s, width: 140 * s, height: (height - courtTop) * 0.55 },
          ]}
        />
      </View>
    </View>
  );
}

/** The "HALFTIME SHOW" sign, which becomes a BPM jumbotron at 100+ BPM. */
export function Sign({
  layout,
  bpm,
  jumbotron,
  clock,
}: {
  layout: Layout;
  bpm: number;
  jumbotron: boolean;
  clock: number;
}) {
  const { s, signTop, signHeight, width } = layout;
  const beat = 1 + 0.08 * Math.max(0, Math.sin(clock * Math.PI * 2 * (bpm / 60)));
  return (
    <View
      pointerEvents="none"
      style={[
        styles.sign,
        jumbotron && styles.jumbotron,
        { top: signTop, height: signHeight, left: width * 0.08, width: width * 0.84 },
      ]}>
      {jumbotron ? (
        <Text
          style={[styles.jumbotronText, { fontSize: 30 * s, transform: [{ scale: beat }] }]}
          accessibilityLabel={`Heart rate ${bpm} beats per minute`}>
          ♥ {bpm} BPM
        </Text>
      ) : (
        <Text style={[styles.signText, { fontSize: 12.5 * s }]} numberOfLines={2}>
          <Text style={styles.signHeadline}>HALFTIME SHOW: </Text>
          Beat the high score to win a MILLION DOLLARS.
        </Text>
      )}
    </View>
  );
}

/** Backboard (drawn behind the ball). */
export function Backboard({ rim, s }: { rim: Point; s: number }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.backboard,
        { left: rim.x - 55 * s, top: rim.y - 66 * s, width: 110 * s, height: 70 * s, borderWidth: 3 * s },
      ]}>
      <View
        style={[
          styles.backboardSquare,
          { width: 40 * s, height: 28 * s, marginTop: 30 * s, borderWidth: 3 * s },
        ]}
      />
    </View>
  );
}

/** Rim + net (drawn in front of a ball that is dropping through). */
export function RimAndNet({ rim, s }: { rim: Point; s: number }) {
  const rimWidth = RIM_WIDTH * s;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.net,
          {
            left: rim.x - rimWidth * 0.42,
            top: rim.y + 2 * s,
            width: rimWidth * 0.84,
            height: 26 * s,
            borderLeftWidth: 2 * s,
            borderRightWidth: 2 * s,
            borderBottomWidth: 2 * s,
          },
        ]}>
        <View style={[styles.netStrand, { left: '33%', width: 2 * s }]} />
        <View style={[styles.netStrand, { left: '66%', width: 2 * s }]} />
      </View>
      <View
        style={[
          styles.rim,
          { left: rim.x - rimWidth / 2, top: rim.y - 3 * s, width: rimWidth, height: 6 * s, borderRadius: 3 * s },
        ]}
      />
    </View>
  );
}

/** A basketball centered on (x, y). */
export function Basketball({
  x,
  y,
  size,
  opacity = 1,
}: {
  x: number;
  y: number;
  size: number;
  opacity?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.ball,
        { left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size / 2, opacity },
      ]}>
      <View style={[styles.seamVertical, { width: Math.max(1, size * 0.06) }]} />
      <View style={[styles.seamHorizontal, { height: Math.max(1, size * 0.06) }]} />
    </View>
  );
}

/** The player's hands at the bottom of the screen, shifted by the shake offset. */
export function Hands({
  layout,
  shake,
  holdingBall,
}: {
  layout: Layout;
  shake: Point;
  holdingBall: boolean;
}) {
  const { s, hands } = layout;
  const cx = hands.x + shake.x;
  const cy = hands.y + shake.y;
  const handW = 40 * s;
  const handH = 56 * s;
  const gap = 30 * s;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {holdingBall && <Basketball x={cx} y={cy - 14 * s} size={44 * s} />}
      {[-1, 1].map((side) => (
        <View
          key={side}
          style={[
            styles.arm,
            {
              left: cx + side * gap - handW / 2,
              top: cy - handH / 3,
              width: handW,
              height: handH + 120 * s,
              borderRadius: handW / 2,
              transform: [{ rotate: `${side * -18}deg` }],
            },
          ]}>
          <View style={[styles.sleeve, { top: handH, height: 120 * s }]} />
        </View>
      ))}
    </View>
  );
}

/** The aim reticle centered on its drawn (swaying) position. */
export function Reticle({ position, s }: { position: Point; s: number }) {
  const size = RETICLE_SIZE * s;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.reticle,
        {
          left: position.x - size / 2,
          top: position.y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3 * s,
        },
      ]}>
      <View style={[styles.reticleDot, { width: 4 * s, height: 4 * s, borderRadius: 2 * s }]} />
    </View>
  );
}

/** Red pulsing glow around the screen edges during the final seconds. */
export function Vignette({ pulse }: { pulse: number }) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.vignette, { opacity: 0.25 + 0.35 * pulse }]}
    />
  );
}

const styles = StyleSheet.create({
  stands: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: Palette.stands,
  },
  standsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: Palette.standsRow,
  },
  fan: {
    position: 'absolute',
    alignItems: 'center',
  },
  court: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: Palette.wood,
    borderTopWidth: 3,
    borderTopColor: Palette.courtLine,
    overflow: 'hidden',
  },
  courtPlank: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Palette.woodDark,
  },
  lane: {
    position: 'absolute',
    top: 0,
    borderWidth: 3,
    borderTopWidth: 0,
    borderColor: Palette.courtLine,
    backgroundColor: 'rgba(242, 140, 40, 0.25)',
  },
  sign: {
    position: 'absolute',
    borderRadius: 10,
    backgroundColor: Palette.navyLight,
    borderWidth: 2,
    borderColor: Palette.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  jumbotron: {
    backgroundColor: Palette.jumbotron,
    borderColor: Palette.red,
  },
  signText: {
    color: Palette.cream,
    fontWeight: '700',
    textAlign: 'center',
  },
  signHeadline: {
    color: Palette.orange,
    fontWeight: '900',
  },
  jumbotronText: {
    color: Palette.red,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  backboard: {
    position: 'absolute',
    backgroundColor: Palette.backboard,
    borderColor: Palette.navy,
    borderRadius: 4,
    alignItems: 'center',
  },
  backboardSquare: {
    borderColor: Palette.rim,
  },
  rim: {
    position: 'absolute',
    backgroundColor: Palette.rim,
  },
  net: {
    position: 'absolute',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  netStrand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  ball: {
    position: 'absolute',
    backgroundColor: Palette.orange,
    borderWidth: 1,
    borderColor: Palette.orangeDark,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  seamVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: Palette.navy,
  },
  seamHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: Palette.navy,
  },
  arm: {
    position: 'absolute',
    backgroundColor: Palette.skin,
    borderWidth: 2,
    borderColor: Palette.skinDark,
    overflow: 'hidden',
  },
  sleeve: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: Palette.navyLight,
  },
  reticle: {
    position: 'absolute',
    borderColor: Palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  reticleDot: {
    backgroundColor: Palette.cream,
  },
  vignette: {
    borderWidth: 22,
    borderColor: Palette.red,
  },
});
