// Neon Reef — tuning constants in one place so the world's rules are easy to read and balance.

export const VIEW = { width: 960, height: 600 };

export const PLAYER = {
  radius: 14,
  accel: 2600,
  maxSpeed: 320,
  friction: 6.5,
  dashSpeed: 780,
  dashTime: 0.16,
  dashCooldown: 0.9,
  hurtInvulnTime: 1.6,
  startHull: 3,
};

export const MOTE = {
  radius: 8,
  value: 10,
  comboWindow: 2.5, // seconds between pickups before the combo resets
  comboStep: 5, // every 5 combo adds +1 to the score multiplier
};

export const JELLY = {
  radius: 16,
  driftSpeed: 42,
  pulseRate: 1.7,
};

export const HUNTER = {
  radius: 15,
  chaseSpeed: 118,
  stunTime: 3.2,
  stunValue: 50,
  firstWave: 3,
};

// One entry per wave: motes to gather before the reef calms, and how crowded it gets.
export const WAVES = [
  { quota: 6, jellies: 2, hunters: 0, moteRate: 1.15 },
  { quota: 8, jellies: 3, hunters: 0, moteRate: 1.05 },
  { quota: 9, jellies: 3, hunters: 1, moteRate: 0.98 },
  { quota: 10, jellies: 4, hunters: 1, moteRate: 0.9 },
  { quota: 11, jellies: 4, hunters: 2, moteRate: 0.84 },
  { quota: 12, jellies: 5, hunters: 2, moteRate: 0.78 },
  { quota: 13, jellies: 5, hunters: 3, moteRate: 0.72 },
  { quota: 14, jellies: 6, hunters: 3, moteRate: 0.66 },
];

export const COLORS = {
  deep: '#06121f',
  deepTop: '#0a2036',
  sand: '#0d2f33',
  reefA: '#0f4c5c',
  reefB: '#14635a',
  player: '#ffd166',
  playerDash: '#ffe9a8',
  mote: '#5df2c8',
  jelly: '#f28ad8',
  hunter: '#ff5d5d',
  hunterStunned: '#9fb7c9',
  text: '#eaf6ff',
  dim: '#8fb8cc',
  accent: '#5df2c8',
  danger: '#ff5d5d',
};
