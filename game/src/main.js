// Neon Reef — entry point: canvas setup, the fixed-step game loop, screen state
// changes, and the deterministic screenshot modes (?shot=start|play|end&seed=N) the
// entry's screenshots are taken with.

import { VIEW } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { createWorld } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? '7') || 7;

const world = createWorld(seed);
const input = createInput(canvas);
const audio = createAudio();
let paused = false;

const playEvents = () => {
  for (const event of world.events.splice(0)) {
    if (shot) continue; // screenshots stay silent
    if (event === 'collect') audio.collect(world.combo);
    else if (event === 'stun') audio.stun();
    else if (event === 'hurt') audio.hurt();
    else if (event === 'dash') audio.dash();
    else if (event === 'wave') audio.waveClear();
    else if (event === 'win') audio.win();
    else if (event === 'lose') audio.lose();
  }
};

const startIfNeeded = () => {
  if (world.state === 'title') {
    audio.unlock();
    world.start();
  }
};

const restartIfNeeded = () => {
  if (world.state === 'won' || world.state === 'lost') {
    audio.unlock();
    world.start();
  }
};

// Screenshot modes: build the exact frame each shot name asks for, deterministically.
if (shot === 'play') {
  world.start();
  const demo = world.demoInput;
  let t = 0;
  const step = 1 / 60;
  while (t < 9) {
    world.step(step, demo(t));
    t += step;
  }
  world.events.length = 0;
} else if (shot === 'end') {
  world.start();
  const demo = world.demoInput;
  let t = 0;
  const step = 1 / 60;
  while (t < 5) {
    world.step(step, demo(t));
    t += step;
  }
  world.score += 1240;
  world.gatheredTotal += 41;
  world.stuns += 6;
  world.state = 'won';
  world.events.length = 0;
}

const STEP = 1 / 120;
let accumulator = 0;
let last = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  let elapsed = (now - last) / 1000;
  last = now;
  if (elapsed > 0.25) elapsed = 0.25;
  accumulator += elapsed;

  if (!shot) {
    if (input.consume('Enter')) startIfNeeded();
    if (input.consume('KeyR')) restartIfNeeded();
    if (input.consume('KeyP')) paused = !paused;
    if (input.consume('KeyM')) audio.toggleMute();
    if (state2StartViaPointer()) startIfNeeded();
  }

  while (accumulator >= STEP) {
    if (!paused) world.step(STEP, input);
    accumulator -= STEP;
  }
  input.endStep();
  playEvents();
  render(ctx, world);
  if (paused && !shot) {
    ctx.save();
    ctx.fillStyle = 'rgba(3, 12, 22, 0.55)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#eaf6ff';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Paused — press P to resume', VIEW.width / 2, VIEW.height / 2);
    ctx.restore();
  }
}

let pointerWasDown = false;
function state2StartViaPointer() {
  const down = input.state.pointer.down;
  const rising = down && !pointerWasDown;
  pointerWasDown = down;
  return rising && world.state === 'title';
}

requestAnimationFrame(frame);
