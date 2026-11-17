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
5. ~~**A test suite for the character contract.**~~ **Done.** `npm test` —
   25 tests. 4 check the visit data and hold now; 21 specify `step` and skip
   themselves until it stops being a stub, then activate automatically.

   Verified against a throwaway implementation (22/25, then 25/25 after one
   spec fix) and reverted, so the suite is known satisfiable rather than
   merely green-by-vacuum. The implementation is still yours.

   Writing them exposed a hole in the contract: a pure `step` had nowhere to
   store how long someone had been settled, making the stay-duration rule
   impossible to satisfy. `CharacterState` now carries a `timer`.
6. ~~**The piano.**~~ **Done.** Web Audio, off until the toggle, no
   AudioContext created before that click. Each note is a triangle for the
   body plus a quiet detuned square for the attack, through a decaying
   envelope and a lowpass that closes as the note dies — which is what makes
   a pluck sound plucked rather than like a beep ending.

   Notes are C major pentatonic over two octaves, because the piano is played
   by sweeping a pointer across it: there is no wrong order, so nothing a
   visitor does can sound like a mistake. Key strips only mount while sound
   is on (verified: 0 before the toggle, 11 after).

   **I cannot hear it.** The note maths is unit-tested and the graph builds
   without errors, but nobody has listened to the timbre.
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

**1. Should clicking the piano play a note or open the page?** Right now the
keys make sound on pointer *hover* and a click still opens `/about/`, so the
two gestures never fight. The alternative is clicking keys to play and moving
"Fun & about" onto something else — but the nav map says piano, so I left it.

**2. The piano is mouse-only.** A pointer sweep plays it; keyboard users get
the link and no notes. Making each key focusable would put eleven tab stops
in the middle of the scene, which seems worse. Worth a decision.

**3. Does the timbre actually sound good?** Unverifiable from here. If it's
wrong, the knobs are in `playNote`: `dur`, the lowpass sweep, and the square
oscillator's `edgeGain` (currently 0.2).
