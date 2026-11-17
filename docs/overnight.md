# Overnight run

**Finished 03:30, 17 Nov 2026. Fourteen items, twelve commits, all on
`scene/overnight`, nothing pushed.**

Read the night back with `git log --oneline main..scene/overnight`, or look at
it with `npm run dev` and `npm run shot`.

## What changed

The scene went from coloured CSS boxes to a drawn room: 23 sprites generated
in code, a rug woven from one hand-made motif, night lighting as a separate
layer over daylight-painted art, and 37 objects placed on a 16px grid at
Stardew proportions. The projects overworld, the cork board page, the case
study layout, the 404 and the plain version all got designed. The piano
plays. The state machine has a 25-test specification waiting for it.

Four tools exist that didn't: `npm run sprites`, `npm run layout`,
`npm run shot`, `npm run audit`, plus `npm run og` and `npm test`.

## What's still yours

- **The character sprites.** Kibou, Peanut, Caitlin, Suraj. Every slot is
  waiting; see `docs/characters.md` for sizes, ramps and the frames needed.
- **The state machine.** `npm test` is the spec; 21 tests activate the moment
  `step` moves someone.
- **The copy.** Case studies, the about page, the three-sentence intent, and
  what's actually pinned to the cork board.
- **The project list**, which also fixes level 1 sitting on the lake.
- **`site.url`**, which the sitemap and the social card both need.

## What I could not verify

- **The piano's timbre.** No ears here. The maths is tested; the sound isn't.
- **Anything about taste.** See the questions at the bottom.

## How this was run

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
7. ~~**The overworld map**~~ **Done.** Terrain is one 384x216 sprite — grass
   with a deterministic scatter, a lake with a shoreline that isn't a
   rectangle, trees, hills on the horizon. The path and the numbered level
   tiles are drawn over it from the project list, so adding a project never
   means redrawing the map.

   Pitches sit in a numbered list *under* the map rather than on it: prose on
   grass is unreadable, and a screen reader shouldn't have to walk a map to
   find out what the projects are.

   The map is daylight while the room is night, deliberately — it's a
   different place, and SMB3 overworlds are daylight.

   Placeholder project coordinates put level 1 on the lake. That fixes itself
   when the real project list lands.
8. ~~**Performance and accessibility.**~~ **Done.** `npm run audit` walks
   the keyboard path, checks focus rings, emulates reduced motion, measures
   overflow at 420px, and counts headings/landmarks/alt text on every route.
   Reports rather than gates — it's a thing to read.

   Found and fixed: no focus ring on any of the five scene hotspots (the ring
   was attached to `.ph`, which stopped existing when the props became
   `<img>` sprites); two `<main>` elements on the landing page, one per
   version; and Tab walking the room in paint order, so the interactive
   things now mount in navigation order while z-index keeps the paint order
   — which also let the duplicate sr-only nav go.

   Built weight: 20K HTML, 688K JS, 20K CSS, 100K of sprites across 24 files
   (largest is the 8K overworld). Audit now reports clean.
9. ~~**The social preview image.**~~ **Done.** `npm run og` screenshots the
   live scene and composites a name plate, so the card can never show a room
   that no longer exists. 1200x630, palette PNG — the scene is flat art plus
   a gradient, so 128 colours is indistinguishable and a third of the bytes.

---

# Extra credit

The list above is finished. These were added by Claude afterwards, on the
same guardrails: verifiable without a human, no taste calls, nothing that
belongs to Suraj.

10. ~~**The plain version deserves a design pass.**~~ **Done.** Still zero
    images and zero scripts needed, so it paints the instant the HTML lands,
    but it now belongs to the same world: pixel-font headings, navigation as
    chunky blocks with hard shadows, projects numbered like levels, headings
    with a rule running off to the right. Stacks to one column at 420px.
11. ~~**`sitemap.xml` and `robots.txt`**~~ **Done.** Generated from the
    routes and the project list, so a new project appears in the sitemap by
    existing rather than by being remembered. Both land in `out/`.

    They say `example.com` until `site.url` is the real domain.
12. ~~**The case-study page layout.**~~ **Done.** The four beats are numbered
    01-04 so the structure is visible rather than four headings run together
    as prose — the shape is the argument. Year and stack as chips, previous
    and next project at the foot. A project with no `study` says "in
    progress" instead of pretending.

    Placeholder study copy is in `content/projects.ts` on project one, so
    the layout can be seen. It's prompts, not prose — replace all four.
13. ~~**A 404 that belongs to this site.**~~ **Done.** Wrong door, using the
    room's own door sprite, with every real room listed below it.
14. ~~**Check the exported build end to end.**~~ **Done.** Built, served
    `out/` on :3001, and audited that instead of the dev server. Every route
    200s — pages, both case studies, `sitemap.xml`, `robots.txt`, `og.png`,
    the sprites. Audit reports no problems. Landing page in scene mode is
    538 KB across 48 requests.

    Also tested the claim the whole fallback rests on, which had never
    actually been checked: **with JavaScript disabled**, no `data-mode` is
    set, the scene stays hidden, and the plain version renders with all nine
    links and 105 words of copy. It works.

## Gotcha

Turbopack's cache went stale once tonight: an edit to `content/projects.ts`
didn't reach the page, and `curl` confirmed the old content was still being
served while the file on disk was correct. `rm -rf .next` and restart the dev
server if a change doesn't appear.

## What NOT to do

- Character sprites for Kibou, Peanut, Caitlin or Suraj. Those are Suraj's, in
  Aseprite, from photos that mostly don't exist yet.
- The character state machine itself (`step` and the scheduler).
- Case-study copy, the about page copy, the three-sentence intent.
- Anything that needs a taste call that hasn't been made. Write it down in
  this file under "Questions" instead and move on.

---

# Phase two: the isometric overhaul

**The perspective changes.** The straight-on top-down goes; the room is
rebuilt on the diagonal, seen from the doorway looking down across it —
windows ahead, desk right, piano corner left. `photos/raw/office/IMG_0730`
is that exact view and is the reference for the whole phase.

Stardew's density and texture still apply (`art-direction.md`); only the
camera changes. 2:1 dimetric, not true 30-degree isometric — 2:1 keeps every
edge on whole pixels, and true iso puts diagonals on irrational slopes where
they come out furry.

`components/scene/iso.ts` holds the projection and the tile layout.
`npm run iso -- out.png` renders the geometry as flat shapes and reports
anything outside the frame.

**Keep the current scene working the whole way.** Build the iso scene
alongside it and swap only when the new one is better; never leave the site
half-converted.

### The order

1. ~~**The projection.**~~ **Done.** 32x16 tiles, a 10x10 floor, 64px walls,
   384x240. Painter's order is `gx + gy`. Flat things (the rug) are diamonds
   measured in tiles, not rectangles.
2. ~~**Tune the layout against IMG_0730.**~~ **Done.** The rug now owns the
   middle of the floor with walking room all round it, the desk runs along
   the east side, the piano corner and the door are on the west wall, the
   futon sits under the windows.

   Things now declare a **footprint in tiles and a height in pixels**, and
   the sprite size is derived from that. A thing describes the space it
   occupies, not the size of its picture, so art and grid can't drift apart.
3. **Redraw the sprites in 2:1.** *In progress.* `npm run iso-sprites`.

   Done: the `isoBox` primitive — in this projection almost every prop is a
   box with a lit top, a mid face toward the camera's right and a dark face
   toward its left, so one primitive draws the desk, credenza, side table,
   futon, amp, shelf, controller and laptop, and the light falls the same way
   on all of them. Done too: the room shell, floor diamond with board grain,
   both walls, baseboards.

   Done too: a **stage** — a sprite canvas that knows its own footprint, so
   composite props are built from several boxes in tile coordinates. A desk
   is a slab on four legs, not a solid block. Drawn with it: desk, side
   table, chair, monitor, piano (keys on an X-stand), and the rug with its
   gul medallions re-laid on the diagonal.

   **Done.** Eighteen sprites. The wall-mounted ones came with step 4.
4. ~~**Wall-mounted things are sheared to their wall's plane.**~~ **Done.**
   `wallStage` draws into the wall's plane directly: inside it, `s` runs along
   the wall in tiles and `t` runs up it in pixels, so a poster is laid out as
   if the wall were flat and comes out sheared. North shears down-right, west
   down-left. Pre-sheared rather than CSS-transformed, because a transform
   resamples and turns a crisp 2:1 edge to mush.

   Drawn: both windows (night glass, streetlight, the tree outside), the
   panelled door, the Ligeti score, the Schiele, the cork board.
5. **The new renderer.** `Scene` reads `iso.ts`, sorts by `gx + gy`, keeps
   the hotspots, the night lighting layer, the desk animation and the piano
   keys. Then delete `room.ts` and the old sprites.
6. **Characters move on the tile grid.** `lib/characters.ts` spots become
   tile coordinates; the visit machine interpolates in tile space. Update the
   tests — they assert positions inside the room, which is now a diamond.
7. **Re-run `npm run audit` and `npm run og`.**

### Also new

More photos landed: `photos/raw/office/IMG_0728-0730` (including the doorway
view) and five more of Kibou in `photos/raw/kibou/`. The Kibou ones are for
Suraj's sprite work, not for this phase.

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
