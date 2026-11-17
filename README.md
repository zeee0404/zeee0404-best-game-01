# zeee0404-best-game-01

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/zeee0404/zeee0404-best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/zeee0404/zeee0404-best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Neon Reef is an original wave-survival arcade game for the browser: pilot a guardian drone, gather energy motes to calm eight waves of reef creatures, dash through hunters to stun them, and chain pickups to raise your combo multiplier. It is plain static files under `game/` — no build step and no network — with synthesized sound and deterministic, seeded runs.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser and press Enter to play (WASD or arrow keys to move, Shift, Space or click to dash, P pauses, M mutes). To hand the game in the way the bounty grades it: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`, which copies `game/` and `screenshots/` to `out/` and writes the `dossier.json` the judge reads.

---

<sub>Entered on [make.fun](https://make.fun/?ref=zc1gf6fe&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
