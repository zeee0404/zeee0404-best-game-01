// Neon Reef — the hand-in program for make.fun's "Make the best game" bounty.
//
// The game itself is the static site in game/ (open game/index.html in a browser and
// play; it loads nothing over the network). This program's one job is to hand that
// game in the way the bounty asks: copy game/ and screenshots/ into the output
// directory and write dossier.json there with the vendored make.fun library, so the
// scorer can rebuild the same dossier from the same files and compare them.
//
// Run it the way the grader does (MAKEFUN_OUTPUT_DIR stands in for /output locally):
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Node 22, standard library only.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'game'), join(outputDir, 'game'), { recursive: true });

const shotsDir = join(repoDir, 'screenshots');
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The caps are the scorer's own (its gate.json): text_max_bytes shapes the dossier
// text; the rest make this program refuse exactly what the scorer would refuse —
// too many screenshots or one too large, too many files in game/, an over-long path.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
