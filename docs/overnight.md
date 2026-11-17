# Overnight run

How to let Claude work unattended on the scene, and what it should and
shouldn't touch.

## Starting it

Three terminals, or three tabs.

```bash
# 1. keep the machine awake
caffeinate -dims

# 2. the dev server — screenshots need something to point at
cd ~/future/new_portfolio_site && npm run dev

# 3. the loop, in Claude Code
/loop work through docs/overnight.md, one item at a time
```

`/loop` with no interval lets Claude pace itself: it works, stops, schedules
its own next wake-up, and continues until you stop it or the account hits a
limit. Stop it any time with `/loop stop` or by interrupting.

## About sleep — read this part

`caffeinate -dims` keeps the display, the system and the disks awake:

| flag | stops |
|---|---|
| `-d` | display sleep |
| `-i` | idle sleep |
| `-m` | disk sleep |
| `-s` | system sleep while on AC power |

**Closing the lid will still sleep the machine.** No `caffeinate` flag
overrides that on a modern MacBook — the lid switch is handled below it. The
only exception is clamshell mode: external display *and* power *and* an
external keyboard or mouse attached.

So: **leave the lid open**, plugged in, screen brightness all the way down.

If the machine does sleep, the run doesn't crash — it pauses. On wake the
processes are still there, but the API connection has usually dropped and the
dev server may need a restart, so in practice the night ends there.

(There is a `sudo pmset -a disablesleep 1` that defeats the lid switch. It's a
system-level change, it survives reboots until you set it back to 0, and it's
your call, not Claude's.)

## Guardrails

- **Work on a branch.** `scene/overnight`. Never commit to `main`.
- **Never push.** Everything stays local until we're happy with it.
- **Never touch AWS.** No `bootstrap.sh`, no `deploy.sh`, no credentials.
- **Small commits**, each one building and typechecking, each message saying
  what changed and why, so the night reads back in five minutes.
- **Verify by looking.** `npm run shot` after any visual change, and actually
  look at the PNG. A change that can't be verified doesn't get committed.
- **Leave the placeholders working.** Never break the scene to half-finish a
  sprite; a thing keeps its CSS placeholder until its PNG is genuinely better.

## What to work on, in order

Each item is verifiable without a human and without art that doesn't exist.

1. ~~**Tune the night lighting** against screenshots.~~ **Done.** The grey was
   a blue wash over a cream wall. Fixed by warming the wash and dropping the
   wall's base from `--cream` to `--sand`: a lamplit wall at night is a mid
   warm tone, and fighting a near-white base with a dark overlay only ever
   produces mauve. Lamp pool now centred on the desk, upper wall falls off,
   corners pulled down. The remaining bright spots are placeholder fills —
   the piano's cream slab, the Ligeti white — which item 3 replaces.
2. ~~**Density pass.**~~ **Done.** Added only things that are actually in the
   photos: curtains flanking both windows, books on the cube shelf, the cable
   run from the desk down to the power strip, the side table by the piano
   with the burger-cat plush and sheet music on it, the amp's cable. 37
   things now.

   One thing NOT to fill: the centre of the floor. See the note in
   `art-direction.md` — that's the stage.
3. ~~**Real sprites for the simple props.**~~ **Done.** 23 sprites drawn in
   code by `npm run sprites`, every prop in the room now art rather than a
   CSS box. The monitor's bezel is a sprite with a transparent screen hole
   and the live screen renders behind it, so the art and the cycling content
   stay separate.

   The only placeholders left are the characters, which are Suraj's.
4. ~~**The rug.**~~ **Done.** One gul built symmetrically by construction
   (a woven motif IS symmetrical, and the eye catches it instantly when it
   isn't), tiled in offset rows across a dark field, inside a banded border.
   Reads as a Bokhara at 144x56 where the quantized photo was mush.
5. **A test suite for the character contract**, so the state machine has
   something to run against the moment it's written: one visitor at a time,
   never two; every visit reaches `away`; phases advance in order; no NaN
   positions. The machine itself is Suraj's to write — write the tests, not
   the implementation.
6. **The piano.** Web Audio, off by default, short plucked tones, no sampled
   piano.
7. **The overworld map** at the same scale and drawing rules as the room.
8. **Performance and accessibility**: keyboard path through every hotspot,
   focus visibility, the static version at 420px wide, Lighthouse-ish checks
   on the exported build.
9. **The social preview image**, 1200×630, rendered from the scene.

## What NOT to do

- Character sprites for Kibou, Peanut, Caitlin or Suraj. Those are Suraj's, in
  Aseprite, from photos that mostly don't exist yet.
- The character state machine itself (`step` and the scheduler).
- Case-study copy, the about page copy, the three-sentence intent.
- Anything that needs a taste call that hasn't been made. Write it down in
  this file under "Questions" instead and move on.

## Questions for the morning

(Claude appends here rather than guessing.)
