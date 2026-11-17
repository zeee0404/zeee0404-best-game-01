// Neon Reef — everything drawn on the canvas: the reef backdrop, the creatures, the
// HUD, and the title / victory / game-over screens. Pure drawing; no game rules here.

import { COLORS, MOTE, VIEW, WAVES } from './config.js';

const TAU = Math.PI * 2;

function drawBackdrop(ctx, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  grad.addColorStop(0, COLORS.deepTop);
  grad.addColorStop(1, COLORS.deep);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // Light shafts drifting slowly across the water.
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#bfe9ff';
  for (let i = 0; i < 3; i += 1) {
    const x = 140 + i * 300 + Math.sin(time * 0.11 + i * 2.1) * 26;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 90, 0);
    ctx.lineTo(x + 190, VIEW.height);
    ctx.lineTo(x + 60, VIEW.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Two parallax layers of reef silhouettes along the floor.
  reefLayer(ctx, time * 2, 0.55, COLORS.reefA, 64);
  reefLayer(ctx, time * 4 + 300, 0.8, COLORS.reefB, 40);

  ctx.fillStyle = COLORS.sand;
  ctx.fillRect(0, VIEW.height - 18, VIEW.width, 18);
}

function reefLayer(ctx, offset, scale, color, baseHeight) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, VIEW.height);
  for (let x = 0; x <= VIEW.width; x += 16) {
    const y = VIEW.height - 14 - baseHeight * scale
      - Math.abs(Math.sin((x + offset) * 0.011)) * 44 * scale
      - Math.abs(Math.sin((x + offset) * 0.031)) * 16 * scale;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW.width, VIEW.height);
  ctx.closePath();
  ctx.fill();
  // Coral nubs on the ridge.
  ctx.fillStyle = color;
  for (let i = 0; i < 7; i += 1) {
    const x = ((i * 173 + offset * 1.7) % (VIEW.width + 60)) - 30;
    const y = VIEW.height - 26 - Math.abs(Math.sin((x + offset) * 0.011)) * 40 * scale;
    ctx.beginPath();
    ctx.arc(x, y, 5 * scale + 2, 0, TAU);
    ctx.fill();
  }
}

function drawMote(ctx, mote, time) {
  const pulse = 1 + Math.sin(mote.phase + time * 2) * 0.15;
  const r = mote.radius * pulse;
  ctx.save();
  ctx.shadowColor = COLORS.mote;
  ctx.shadowBlur = 16;
  ctx.fillStyle = COLORS.mote;
  ctx.beginPath();
  ctx.arc(mote.x, mote.y + Math.sin(mote.phase) * 3, r, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#eafff7';
  ctx.beginPath();
  ctx.arc(mote.x - r * 0.3, mote.y - r * 0.3 + Math.sin(mote.phase) * 3, r * 0.34, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawJelly(ctx, jelly) {
  const squash = 1 + Math.sin(jelly.phase) * 0.12;
  ctx.save();
  ctx.translate(jelly.x, jelly.y);
  ctx.scale(1, squash);
  ctx.shadowColor = COLORS.jelly;
  ctx.shadowBlur = 12;
  ctx.fillStyle = COLORS.jelly;
  ctx.beginPath();
  ctx.arc(0, 0, jelly.radius, Math.PI, 0);
  ctx.quadraticCurveTo(jelly.radius, jelly.radius * 0.5, 0, jelly.radius * 0.4);
  ctx.quadraticCurveTo(-jelly.radius, jelly.radius * 0.5, -jelly.radius, 0);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = COLORS.jelly;
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * jelly.radius * 0.45, jelly.radius * 0.4);
    ctx.quadraticCurveTo(
      i * jelly.radius * 0.45 + Math.sin(jelly.phase + i) * 4,
      jelly.radius * 0.95,
      i * jelly.radius * 0.4,
      jelly.radius * 1.25,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawHunter(ctx, hunter) {
  const stunned = hunter.stunTime > 0;
  ctx.save();
  ctx.translate(hunter.x, hunter.y);
  const angle = Math.atan2(hunter.vy, hunter.vx);
  ctx.rotate(Number.isFinite(angle) ? angle : 0);
  ctx.shadowColor = stunned ? COLORS.hunterStunned : COLORS.hunter;
  ctx.shadowBlur = 12;
  ctx.fillStyle = stunned ? COLORS.hunterStunned : COLORS.hunter;
  // A dart body with a tail fin — drawn pointing along +x, rotated to its velocity.
  ctx.beginPath();
  ctx.moveTo(hunter.radius + 5, 0);
  ctx.lineTo(-hunter.radius * 0.6, -hunter.radius * 0.75);
  ctx.lineTo(-hunter.radius * 0.25, 0);
  ctx.lineTo(-hunter.radius * 0.6, hunter.radius * 0.75);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#2b0d0d';
  ctx.beginPath();
  ctx.arc(hunter.radius * 0.35, -hunter.radius * 0.2, 2.6, 0, TAU);
  ctx.arc(hunter.radius * 0.35, hunter.radius * 0.2, 2.6, 0, TAU);
  ctx.fill();
  ctx.restore();
  if (stunned) {
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ ★', hunter.x, hunter.y - hunter.radius - 8);
  }
}

function drawPlayer(ctx, player, time) {
  const blink = player.invulnTime > 0 && Math.floor(time * 14) % 2 === 0;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.facing);
  if (blink) ctx.globalAlpha = 0.35;
  const dashing = player.dashTime > 0;
  ctx.shadowColor = COLORS.player;
  ctx.shadowBlur = dashing ? 26 : 14;
  ctx.fillStyle = dashing ? COLORS.playerDash : COLORS.player;
  // Guardian drone: a rounded diamond hull with a bright core.
  ctx.beginPath();
  ctx.moveTo(player.radius + 4, 0);
  ctx.lineTo(0, -player.radius * 0.8);
  ctx.lineTo(-player.radius - 2, 0);
  ctx.lineTo(0, player.radius * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#7a4b00';
  ctx.beginPath();
  ctx.arc(1, 0, 5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff3cf';
  ctx.beginPath();
  ctx.arc(2, -1, 2.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawHud(ctx, world) {
  const wave = WAVES[world.waveIndex];
  ctx.save();
  ctx.fillStyle = 'rgba(4, 18, 30, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, 52);
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(0, 52, VIEW.width, 2);

  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Wave ${world.waveIndex + 1} / ${WAVES.length}`, 18, 33);
  ctx.textAlign = 'center';
  ctx.fillText(`Score ${world.score}`, VIEW.width / 2, 33);
  ctx.textAlign = 'right';
  ctx.fillText(`Motes ${world.gatheredThisWave} / ${wave.quota}`, VIEW.width - 18, 33);

  // Hull hearts.
  for (let i = 0; i < 3; i += 1) {
    const x = 150 + i * 26;
    const y = 26;
    ctx.fillStyle = i < world.player.hull ? COLORS.danger : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(x, y + 7);
    ctx.bezierCurveTo(x - 11, y - 4, x - 5, y - 12, x, y - 5);
    ctx.bezierCurveTo(x + 5, y - 12, x + 11, y - 4, x, y + 7);
    ctx.fill();
  }

  // Combo meter under the score.
  if (world.combo > 1) {
    const mult = 1 + Math.floor(world.combo / MOTE.comboStep);
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd166';
    ctx.fillText(`Combo ×${mult} (${world.combo})`, VIEW.width / 2, 72);
    ctx.fillStyle = 'rgba(255, 209, 102, 0.35)';
    const w = 110 * Math.max(0, world.comboTimer / MOTE.comboWindow);
    ctx.fillRect(VIEW.width / 2 - 55, 78, w, 4);
  }
  ctx.restore();
}

function panel(ctx, title, titleColor, lines, footer) {
  ctx.save();
  ctx.fillStyle = 'rgba(3, 12, 22, 0.66)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = 'rgba(6, 24, 40, 0.92)';
  roundRect(ctx, VIEW.width / 2 - 300, 138, 600, 330, 18);
  ctx.fill();
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 2;
  roundRect(ctx, VIEW.width / 2 - 300, 138, 600, 330, 18);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = titleColor;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText(title, VIEW.width / 2, 208);
  ctx.fillStyle = COLORS.text;
  ctx.font = '17px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 258 + i * 28));
  ctx.fillStyle = COLORS.accent;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(footer, VIEW.width / 2, 258 + lines.length * 28 + 22);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function render(ctx, world) {
  ctx.save();
  if (world.shake > 0) {
    const s = world.shake * 14;
    ctx.translate(Math.sin(world.time * 91) * s * 0.5, Math.cos(world.time * 113) * s * 0.5);
  }
  drawBackdrop(ctx, world.time);
  for (const mote of world.motes) drawMote(ctx, mote, world.time);
  for (const jelly of world.jellies) drawJelly(ctx, jelly);
  for (const hunter of world.hunters) drawHunter(ctx, hunter);
  if (world.state !== 'lost') drawPlayer(ctx, world.player, world.time);

  for (const pt of world.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  if (world.state === 'playing' || world.state === 'won' || world.state === 'lost') drawHud(ctx, world);

  if (world.banner && world.time < world.banner.until && world.state === 'playing') {
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText(world.banner.text, VIEW.width / 2, 108);
    ctx.fillStyle = COLORS.dim;
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(world.banner.sub, VIEW.width / 2, 134);
  }
  ctx.restore();

  if (world.state === 'title') {
    panel(ctx, 'NEON REEF', COLORS.accent, [
      'Gather energy motes to charge the reef heart.',
      'Calm all 8 waves before your hull gives out.',
      '',
      'Move: WASD or arrow keys · Dash: Shift, Space or click',
      'Dash through hunters to stun them. Jellies sting — keep clear.',
      'Chain motes quickly to raise your combo multiplier.',
    ], 'Press Enter or click to dive in');
  } else if (world.state === 'won') {
    panel(ctx, 'THE REEF GLOWS AGAIN', '#5df2c8', [
      `Final score ${world.score}`,
      `Motes gathered ${world.gatheredTotal} · Hunters stunned ${world.stuns}`,
      `Best combo ${world.bestCombo}`,
    ], 'Press R to play again');
  } else if (world.state === 'lost') {
    panel(ctx, 'THE REEF GOES DARK', COLORS.danger, [
      `You reached wave ${world.waveIndex + 1} of ${WAVES.length}.`,
      `Final score ${world.score}`,
      `Motes gathered ${world.gatheredTotal} · Hunters stunned ${world.stuns}`,
    ], 'Press R to try again');
  }
}
