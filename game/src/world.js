// Neon Reef — the simulation. A guardian drone gathers energy motes to charge the reef
// heart across eight waves. Drift jellies are harmless scenery until touched; hunters
// chase the drone and can be stunned by dashing through them. Gather each wave's quota
// to calm the reef; lose all hull and the reef goes dark.

import { HUNTER, JELLY, MOTE, PLAYER, VIEW, WAVES } from './config.js';
import { makeRng } from './random.js';

const TAU = Math.PI * 2;

export function createWorld(seed) {
  const rng = makeRng(seed);
  const world = {
    rng,
    time: 0,
    state: 'title', // title | playing | won | lost
    waveIndex: 0,
    score: 0,
    gatheredThisWave: 0,
    gatheredTotal: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    stuns: 0,
    banner: null, // { text, sub, until }
    shake: 0,
    player: null,
    motes: [],
    jellies: [],
    hunters: [],
    particles: [],
    floaters: [], // rising score labels
    moteClock: 0,
    events: [], // sound cues for main.js: collect, stun, hurt, dash, wave, win, lose
  };

  const freshPlayer = () => ({
    x: VIEW.width / 2,
    y: VIEW.height / 2 + 60,
    vx: 0,
    vy: 0,
    radius: PLAYER.radius,
    hull: PLAYER.startHull,
    dashTime: 0,
    dashCooldown: 0,
    invulnTime: 0,
    facing: -Math.PI / 2,
  });

  const spawnMote = () => {
    world.motes.push({
      x: rng.range(40, VIEW.width - 40),
      y: rng.range(70, VIEW.height - 40),
      radius: MOTE.radius,
      phase: rng.range(0, TAU),
      drift: rng.range(4, 11),
    });
  };

  const spawnJelly = () => {
    world.jellies.push({
      x: rng.range(50, VIEW.width - 50),
      y: rng.range(80, VIEW.height - 60),
      radius: JELLY.radius,
      phase: rng.range(0, TAU),
      vx: rng.range(-1, 1) * JELLY.driftSpeed,
      vy: rng.range(-0.4, 0.4) * JELLY.driftSpeed,
    });
  };

  const spawnHunter = () => {
    // Hunters slip in from a screen edge, away from the player.
    const edge = rng.int(0, 3);
    const pos = [
      { x: rng.range(0, VIEW.width), y: -24 },
      { x: rng.range(0, VIEW.width), y: VIEW.height + 24 },
      { x: -24, y: rng.range(0, VIEW.height) },
      { x: VIEW.width + 24, y: rng.range(0, VIEW.height) },
    ][edge];
    world.hunters.push({ ...pos, vx: 0, vy: 0, radius: HUNTER.radius, stunTime: 0, phase: rng.range(0, TAU) });
  };

  const setBanner = (text, sub, seconds = 2.2) => {
    world.banner = { text, sub, until: world.time + seconds };
  };

  const startWave = (index) => {
    world.waveIndex = index;
    world.gatheredThisWave = 0;
    world.motes = [];
    world.jellies = [];
    world.hunters = [];
    world.moteClock = 0;
    const wave = WAVES[index];
    for (let i = 0; i < 5; i += 1) spawnMote();
    for (let i = 0; i < wave.jellies; i += 1) spawnJelly();
    for (let i = 0; i < wave.hunters; i += 1) spawnHunter();
    setBanner(`Wave ${index + 1}`, `Gather ${wave.quota} motes to calm the reef`);
  };

  world.start = () => {
    world.player = freshPlayer();
    world.score = 0;
    world.gatheredTotal = 0;
    world.combo = 0;
    world.comboTimer = 0;
    world.bestCombo = 0;
    world.stuns = 0;
    world.particles = [];
    world.floaters = [];
    world.state = 'playing';
    startWave(0);
  };

  const burst = (x, y, color, count, speed) => {
    for (let i = 0; i < count; i += 1) {
      const angle = rng.range(0, TAU);
      const v = rng.range(speed * 0.3, speed);
      world.particles.push({
        x, y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        life: rng.range(0.3, 0.7),
        maxLife: 0.7,
        color,
        size: rng.range(1.5, 3.5),
      });
    }
  };

  const floater = (x, y, text, color) => {
    world.floaters.push({ x, y, text, color, life: 0.9 });
  };

  const hurtPlayer = (fromX, fromY) => {
    const p = world.player;
    if (p.invulnTime > 0 || world.state !== 'playing') return;
    p.hull -= 1;
    p.invulnTime = PLAYER.hurtInvulnTime;
    world.shake = 0.35;
    world.combo = 0;
    world.comboTimer = 0;
    const angle = Math.atan2(p.y - fromY, p.x - fromX);
    p.vx = Math.cos(angle) * 420;
    p.vy = Math.sin(angle) * 420;
    burst(p.x, p.y, '#ff5d5d', 16, 240);
    world.events.push('hurt');
    if (p.hull <= 0) {
      world.state = 'lost';
      burst(p.x, p.y, '#ffd166', 42, 320);
      world.events.push('lose');
    }
  };

  const updatePlayer = (dt, input) => {
    const p = world.player;
    const axis = input.axis();
    p.vx += axis.x * PLAYER.accel * dt;
    p.vy += axis.y * PLAYER.accel * dt;
    const damp = Math.max(0, 1 - PLAYER.friction * dt);
    if (!axis.active) {
      p.vx *= damp;
      p.vy *= damp;
    }
    const speed = Math.hypot(p.vx, p.vy);
    const dashing = p.dashTime > 0;
    const cap = dashing ? PLAYER.dashSpeed : PLAYER.maxSpeed;
    if (speed > cap) {
      p.vx = (p.vx / speed) * cap;
      p.vy = (p.vy / speed) * cap;
    }
    if (speed > 12) p.facing = Math.atan2(p.vy, p.vx);

    p.dashCooldown -= dt;
    if ((input.dashHeld() || input.consume('PointerDash')) && p.dashCooldown <= 0 && p.dashTime <= 0) {
      p.dashTime = PLAYER.dashTime;
      p.dashCooldown = PLAYER.dashCooldown;
      const dir = axis.active ? axis : { x: Math.cos(p.facing), y: Math.sin(p.facing) };
      p.vx = dir.x * PLAYER.dashSpeed;
      p.vy = dir.y * PLAYER.dashSpeed;
      world.events.push('dash');
    }
    p.dashTime -= dt;
    p.invulnTime -= dt;

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.x = Math.min(VIEW.width - p.radius, Math.max(p.radius, p.x));
    p.y = Math.min(VIEW.height - p.radius, Math.max(56 + p.radius, p.y));
  };

  const updateMotes = (dt) => {
    const wave = WAVES[world.waveIndex];
    world.moteClock -= dt;
    if (world.moteClock <= 0 && world.motes.length < 9) {
      spawnMote();
      world.moteClock = wave.moteRate;
    }
    const p = world.player;
    world.motes = world.motes.filter((mote) => {
      mote.phase += dt * 2;
      const dx = mote.x - p.x;
      const dy = mote.y - p.y;
      if (dx * dx + dy * dy < (mote.radius + p.radius + 4) ** 2) {
        world.combo = world.comboTimer > 0 ? world.combo + 1 : 1;
        world.comboTimer = MOTE.comboWindow;
        world.bestCombo = Math.max(world.bestCombo, world.combo);
        const multiplier = 1 + Math.floor(world.combo / MOTE.comboStep);
        const gained = MOTE.value * multiplier;
        world.score += gained;
        world.gatheredThisWave += 1;
        world.gatheredTotal += 1;
        burst(mote.x, mote.y, '#5df2c8', 10, 150);
        floater(mote.x, mote.y - 14, `+${gained}`, '#5df2c8');
        world.events.push('collect');
        return false;
      }
      return true;
    });
    if (world.comboTimer > 0) {
      world.comboTimer -= dt;
      if (world.comboTimer <= 0) world.combo = 0;
    }
  };

  const updateJellies = (dt) => {
    const p = world.player;
    for (const jelly of world.jellies) {
      jelly.phase += dt * JELLY.pulseRate;
      jelly.x += jelly.vx * dt;
      jelly.y += jelly.vy * dt + Math.sin(jelly.phase) * 6 * dt;
      if (jelly.x < jelly.radius || jelly.x > VIEW.width - jelly.radius) jelly.vx *= -1;
      if (jelly.y < 70 || jelly.y > VIEW.height - jelly.radius) jelly.vy *= -1;
      jelly.x = Math.min(VIEW.width - jelly.radius, Math.max(jelly.radius, jelly.x));
      jelly.y = Math.min(VIEW.height - jelly.radius, Math.max(64, jelly.y));
      const dx = jelly.x - p.x;
      const dy = jelly.y - p.y;
      if (dx * dx + dy * dy < (jelly.radius + p.radius) ** 2) hurtPlayer(jelly.x, jelly.y);
    }
  };

  const updateHunters = (dt) => {
    const p = world.player;
    for (const hunter of world.hunters) {
      hunter.phase += dt * 3;
      if (hunter.stunTime > 0) {
        hunter.stunTime -= dt;
        hunter.vx *= 0.9;
        hunter.vy *= 0.9;
      } else {
        const dx = p.x - hunter.x;
        const dy = p.y - hunter.y;
        const dist = Math.hypot(dx, dy) || 1;
        hunter.vx += (dx / dist) * 340 * dt;
        hunter.vy += (dy / dist) * 340 * dt;
        const speed = Math.hypot(hunter.vx, hunter.vy);
        if (speed > HUNTER.chaseSpeed) {
          hunter.vx = (hunter.vx / speed) * HUNTER.chaseSpeed;
          hunter.vy = (hunter.vy / speed) * HUNTER.chaseSpeed;
        }
      }
      hunter.x += hunter.vx * dt;
      hunter.y += hunter.vy * dt;
      const dx = hunter.x - p.x;
      const dy = hunter.y - p.y;
      const touching = dx * dx + dy * dy < (hunter.radius + p.radius) ** 2;
      if (touching && hunter.stunTime <= 0) {
        if (p.dashTime > 0) {
          hunter.stunTime = HUNTER.stunTime;
          world.stuns += 1;
          world.score += HUNTER.stunValue;
          burst(hunter.x, hunter.y, '#9fb7c9', 14, 200);
          floater(hunter.x, hunter.y - 18, `STUN +${HUNTER.stunValue}`, '#9fb7c9');
          world.events.push('stun');
        } else {
          hurtPlayer(hunter.x, hunter.y);
        }
      }
    }
  };

  const updateFx = (dt) => {
    world.particles = world.particles.filter((pt) => {
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.96;
      pt.vy *= 0.96;
      return pt.life > 0;
    });
    world.floaters = world.floaters.filter((f) => {
      f.life -= dt;
      f.y -= 34 * dt;
      return f.life > 0;
    });
    world.shake = Math.max(0, world.shake - dt);
  };

  world.step = (dt, input) => {
    world.time += dt;
    if (world.state !== 'playing') {
      updateFx(dt);
      return;
    }
    updatePlayer(dt, input);
    updateMotes(dt);
    updateJellies(dt);
    updateHunters(dt);
    updateFx(dt);
    const wave = WAVES[world.waveIndex];
    if (world.gatheredThisWave >= wave.quota && world.state === 'playing') {
      world.score += 100 + world.waveIndex * 25;
      if (world.waveIndex === WAVES.length - 1) {
        world.state = 'won';
        world.events.push('win');
      } else {
        world.events.push('wave');
        startWave(world.waveIndex + 1);
      }
    }
  };

  // Screenshot/demo helper: play a scripted run so a still frame shows real action.
  world.demoInput = (t) => {
    const angle = t * 0.7;
    return {
      axis: () => {
        const x = Math.cos(angle);
        const y = Math.sin(angle * 1.3) * 0.8;
        const len = Math.hypot(x, y) || 1;
        return { x: x / len, y: y / len, active: true };
      },
      dashHeld: () => Math.sin(t * 0.9) > 0.86,
      consume: () => false,
    };
  };

  world.player = freshPlayer();
  return world;
}
