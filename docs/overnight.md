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

- **Work on a branch.** Currently `kibou`; `scene/overnight` was merged into
  `main` on 18 Nov. Never commit to `main`.
- **Push the branch regularly.** A push at the end of a tick costs seconds
  and means the work survives the machine going to sleep.
- **Opening the PR is Suraj's job, not Claude's** — `gh` on this machine is
  authenticated as `ssgopal85`, which isn't a collaborator on the repo, so
  `gh pr create` fails with "must be a collaborator". Pushes work because
  they go over SSH as `surajgopal85`. Push the branch and hand over the
  compare URL.
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
5. **The new renderer.** *Built, not yet swapped in.* `IsoScene` reads
   `iso.ts`, paints in footprint order, keeps the hotspots, the night
   lighting, the desk animation and the piano keys. Live at **`/iso/`** — a
   preview route so the current scene keeps working until this one is better.

   What the first assembled look showed, in priority order:

   a. ~~The walls are mirrored against IMG_0730.~~ **Wrong call — no change
      made.** Looking again, the windows render on the upper-right wall,
      which *is* "ahead" from the doorway, with the desk below-right and the
      piano wall left. That matches the photo. Mirroring would have broken it.
   b. ~~The desk corner is a pile-up.~~ **Fixed.** The desk run pulled in off
      the room's edge, everything in it trimmed, the oversized futon moved
      back under the windows.
   c. ~~Too murky.~~ **Fixed.** Warmer lamp over the desk, cooler spill at
      the windows, a general lift so the far corners aren't holes, and less
      vignette.

   Also detailed the two plainest sprites: the futon now has a folded back
   and a seam across its cushion, the credenza has three drawer fronts with
   handles.

   ~~Then: delete `room.ts`, the old sprites and `/iso/`.~~ **Done — the
   isometric room is the landing page now.** `Scene.tsx`, `room.ts`,
   `scene.module.css`, the `/iso/` preview route and the old layout script
   are gone, along with every top-down sprite except the projects overworld,
   which is still drawn flat. The 404 uses the room's actual door.
6. ~~**Characters move on the tile grid.**~~ **Done.** Positions are tiles
   now — the same coordinates every object uses, so a character and a chair
   can't disagree about where the floor is. `facing` has four isometric
   directions named for where they go on screen, and `facingFor` derives it.

   The 31 tests moved with them: inside-the-room checks are tile bounds,
   distances are tile distances, speed is tiles per second. 10 pass, 21 still
   waiting on `step`.

   Still placeholder: Suraj at the desk and the three visitors have no
   sprites — those are Suraj's to draw, in isometric now, which changes the
   frame list in `docs/characters.md`.
7. ~~**Re-run `npm run audit` and `npm run og`.**~~ **Done.** Audit reports
   no problems; the social card is regenerated from the isometric room.

---

## Phase two is done

The perspective is rebuilt and live on `/`. What exists now:

- `components/scene/iso.ts` — the projection and the room's contents, every
  thing declaring a footprint in tiles and a height in pixels.
- `scripts/iso-sprites.mjs` — 18 sprites drawn in code, from one box
  primitive plus a wall-shearing stage.
- `components/scene/IsoScene.tsx` — painter-ordered renderer with the
  hotspots, night lighting, desk animation and piano.
- `npm run iso` — geometry check that needs no browser.

The old top-down scene is deleted. Only the projects overworld is still drawn
flat, which is correct: it's a map, not a room.

**Nobody is in the room.** The old scene had a placeholder box for Suraj at
the desk; this one has nothing, deliberately — a grey box in an otherwise
finished room reads worse than an empty chair, and the character art is
Suraj's. `lib/characters.ts` has everyone's tile positions and beats ready,
and `npm test` has the 21 tests that will activate the moment `step` moves
anyone.

### Also new

More photos landed: `photos/raw/office/IMG_0728-0730` (including the doorway
view) and five more of Kibou in `photos/raw/kibou/`. The Kibou ones are for
Suraj's sprite work, not for this phase.

---

# Phase three: Kibou

The first character. He walks in through the door on the west wall, crosses
the room, hops onto the desk, sits between Suraj and the monitor for a while,
and leaves.

**Ownership changed here.** Earlier phases reserved the character art and the
state machine for Suraj. He has explicitly asked for both to be written, on
the understanding that the sprites are a first pass: ten frames he can
repaint in Aseprite and drop in without touching any code. Don't hand this
back.

**Be honest about the limit.** A cat 11px tall drawn in code reads as "small
ginger animal", not as Kibou. The plume tail, the orange cap with the white
blaze, the ear tufts — those are exactly what code loses and a hand finds.
Draw the best silhouette possible and say so plainly.

### The order

1. ~~**The sprites.**~~ **Done.** `npm run kibou` — ten frames in three
   strips: `kibou-down-right`, `kibou-up-right` (4 each) and `kibou-sit` (2).
   Hand-plotted as string grids, one character per pixel, because the box
   primitive that draws the furniture gives a ginger brick at this size.

   Took two passes: the first read as a dachshund. The fix was a neck notch —
   the head has to sit a clear five rows above the back, or a cat this small
   is just a long low animal. The tail rises rather than sticking out.

   *Superseded instructions below, kept for the record:* ~~`npm run
   iso-sprites`. Ten frames: a 4-frame walk in
   `down-right` and in `up-right`, plus a 2-frame sit for the settled beat.
   11px at the shoulder, ~0.4 x 0.7 tiles, from `docs/characters.md`. One
   horizontal strip per direction in `public/art/characters/`.
   Reference: `photos/raw/kibou/` — orange-and-white, white chest and paws,
   white blaze up the muzzle, a tail nearly as long as the body.
2. ~~**Render characters.**~~ **Done.** A layer in `IsoScene` that places a character from
   its tile position with `toScreen`, sorts into the same painter's order as
   the furniture (so he passes behind the desk and in front of the rug), and
   mirrors with `scaleX(-1)` for the two left-going directions.
3. ~~**The state machine.**~~ **Done — all 31 tests green.** Implement `step` in `lib/characters.ts` against the
   spec in `lib/characters.test.ts`. Pure function, durations chosen on phase
   entry, `facingFor` for direction. The 21 skipped tests must go green.
4. ~~**The scheduler.**~~ **Done.** One visitor at a time, never two, with a quiet gap
   between visits — `GAP` in characters.ts. Kibou is the only one with
   sprites, so he's the only one who can be scheduled; leave the other two
   configured and inert.
5. ~~**The hop onto the desk.**~~ **Done.** His spot has `z: 26`. Interpolate height on the
   last stretch so he rises onto the desk rather than teleporting up it.
6. ~~**Check it.**~~ **Done.** `npm test`, `npm run audit`, and a screenshot — plus a
   couple of frames apart to confirm he actually moves.

### Keep

Reduced motion already drops to the plain version, so the machine never has
to care. Nothing here should make the scene fail if the sprites are missing.

## Phase three is done

Kibou walks in through the door, crosses the room, rises onto the desk, sits
between Suraj and the monitor, and leaves. Verified by sampling his position
over sixteen seconds — he moves — and by screenshots of the walk and the sit.

The one thing that isn't there: **Suraj isn't at the desk.** The room has a
cat visiting an empty chair. He needs the same ten frames, and the scheduler
already has a slot for him that nothing fills.

Peanut and Caitlin are fully configured in `lib/characters.ts` — spots,
speeds, beats — and never scheduled, because `SPRITES` in `Visitors.tsx`
only lists who has art. Draw them and they start appearing; no other change.

---

# Phase four: Kibou, properly

Three things, in this order. The depth bug first — it's a correctness
problem and it makes the cat look broken however well he's drawn.

## 1. ~~Depth: the cat walks under the rug~~ — fixed

**Confirmed, with the cause.** `sortKey` uses a thing's far corner, which is
right for a standing box and wrong for a flat one: the rug (6.5 x 6.5 tiles
at gx 1.3) scores 9.10, as though it were a tall object in the middle of the
room. A cat entering at the door scores 8.10 and is therefore painted
*under* the rug; he surfaces near the desk at 10.50.

One sorted list can't express this. Render in three layers instead:

| layer | contents | order |
|---|---|---|
| wall | things with `wall:` set | always behind everything in the room |
| floor | things with `flat:` set — rugs, mats, shadows | above the floor, below anything standing |
| objects | everything standing, plus characters | sorted by `gx + gy` |

Then a character only ever sorts against furniture, which is the only thing
it can actually be behind. Keep the existing sort inside the objects layer —
that part works, and is why he correctly passes behind the desk.

Add a guard to `npm run iso` so this can't come back: no flat thing may sort
above a standing thing.

## 2. ~~Kibou is too orange~~ — fixed

He's an orange-and-white cat and the sprite is ginger with a token white
chin. From `photos/raw/kibou/`:

- **White bib and belly**, running from under the chin along the underside.
- **White socks** on all four legs — they're one of the first things you see.
- **A white blaze** up the muzzle, breaking the orange cap between the eyes.
- **A white tail tip** on a tail that's otherwise ginger.
- Orange stays as a **cap over the head and ears** and a **saddle** over the
  back, rather than covering the whole animal.

The contrast is the point: at eleven pixels the orange/white split is what
makes him Kibou rather than a generic ginger cat.

## 3. ~~The legs are sticks~~ — fixed

One pixel wide with a paw stuck on the end. Instead:

- Two pixels wide, with **haunch and shoulder mass** where they meet the
  body, so the body and legs are one animal rather than a loaf on pins.
- **Paws a pixel wider than the leg**, which reads as a foot.
- The **tail wants to be a plume** — three pixels through most of its
  length, not two.

## 4. ~~While in there: a contact shadow~~ — added

A small dark ellipse under him, drawn in the floor layer. Standard in
isometric and it does more than anything else to stop a character looking
like a sticker floating over the room. It should shrink as he rises onto the
desk, which `state.z` already knows.

## ~~Checking it~~ — done

Sampled a full visit every 300ms for 27 seconds rather than trusting stills:

- on screen for 54 of 90 samples — genuinely away during the quiet gaps
- all three strips used: `down-right` in, `sit` settled, `up-right` out
- all four walk frames cycle
- mirroring fires on the way back to the door (`up-left` is `up-right`
  flipped)
- the shadow is present in every frame he is
- crosses 18% to 70% of the room, no page errors

`npm test` 31/31, `npm run audit` clean, build clean.

**Phase four is done.** The next thing the room needs is Suraj at the desk —
a cat currently visits an empty chair. Peanut and Caitlin stay configured and
inert until someone draws them; `SPRITES` in `Visitors.tsx` is the only
gate.

---

# Phase five: Peanut

The second visitor. Her beat is already written in `lib/characters.ts`:
*crosses to the rug, turns around twice, lies down.* She has a spot, a speed
and a stay range, and is never scheduled only because `SPRITES` in
`Visitors.tsx` lists who has art.

Reference: `photos/raw/peanut/` — `IMG_0165` is the usable one, daylight,
pale dog against a dark floor.

## 1. ~~What she looks like at this size~~ — drawn

18 px at the shoulder, 0.5 x 0.8 tiles — nearly double Kibou, so there's
room for markings he couldn't carry. From the photos:

- **Pale cream coat**, lighter than the floor. She'll read as the bright
  thing in a dark room, which is the opposite of Kibou and good for telling
  them apart at a glance.
- **Darker tan ears, folded over**, set wide. The only dark mass on an
  otherwise pale animal, so they carry the whole read of the head.
- **A white blaze** from forehead to a black nose.
- **A long thin whip tail with a white tip** — much thinner than Kibou's
  plume. Tail shape is the fastest way to tell two animals apart in
  silhouette.
- **White chest and speckled front paws.**
- Lean and leggy, where the cat is low and round.

The ramp is in `docs/characters.md`.

## 2. ~~The frames~~ — done

Same ten-frame structure as Kibou, with one difference: her settled pose is
**lying down**, not sitting.

- 4-frame walk `down-right`, 4-frame walk `up-right`
- 2-frame lie-down for the settled beat (breathing)

Plus the turn, below.

## 3. ~~"Turns around twice" needs somewhere to live~~ — `elapsed` added

The beat says she circles before lying down, which the state machine can't
currently express — `settled` goes straight to the idle frames.

The cheapest honest way: add **`elapsed`** to `CharacterState`, reset on
phase entry and incremented each tick. Then `settled` can run the turn for
its first ~1200ms — cycling `facing` through all four directions using the
walk frames — before dropping to the lying frames. `elapsed` is additive, no
existing test asserts on it, and the walk cycle can use it too instead of
counting ticks.

Don't add a phase. The four phases are load-bearing in 21 tests and a circle
before lying down is a detail of being settled, not a new state.

## 4. ~~Generalise the sprite table~~ — done

`SPRITES` in `Visitors.tsx` hardcodes `sit` and fixed frame counts. Make it
per character: strip names and frame counts together, so a dog that lies
down and a cat that sits don't need different code.

## 5. ~~Then it schedules itself~~ — confirmed

Nothing else to wire. Once Peanut is in `SPRITES` the scheduler picks
between her and Kibou — still one at a time, still with the quiet gap. That
is the whole point of the single slot.

## ~~Checking it~~ — done

Over 99 seconds both visit and never two at once: kibou 103 samples,
peanut 60, max on screen 1. All six strips used. Caught her lying on the
rug.

~~`npm run peanut -- --sheet`, then sample a full visit the way phase four did:
both characters appear across a long enough window, never two at once, she
lies down rather than standing on the rug, and the shadow tracks her. `npm
test` and `npm run audit` stay green.

---

# Phase six: Suraj at the desk

The room currently has animals visiting an empty chair, which undercuts the
whole premise. He's the constant the scene is organised around; everyone
else is an interruption.

**He is not a visitor.** No scheduler, no phases, no door. He's always
there, like the furniture, and `SURAJ` in `lib/characters.ts` already holds
his tile position.

## 1. The decision to make first: which way does he face?

He sits at the north wall desk, so realistically he faces **away from the
camera** — you'd see the back of his head and shoulders. That's honest and
it's what a person at a desk looks like, but it loses the one feature that
identifies him at this size: the clear-framed glasses.

Draw the first pass as a **three-quarter back view** — the back of the head,
one shoulder forward, and a sliver of cheek carrying the edge of the glasses
frame. If that doesn't read, the fallback is to seat him at the corner of
the L turned toward the room, which is less true to the photo and much more
legible.

Note which one is in the file. Don't silently pick the easier one.

## 2. The standing desk already tells you when he stands

`deskUp` exists in `IsoScene` and the desk animates between two heights. So:

- desk down → seated frames
- desk up → standing frames

That connects two features that currently ignore each other, and it's the
room's best small joke: the desk rises and he stands up with it.

Both poses are a **2-frame typing loop** — a one-pixel bob, nothing more.
Hands on the keyboard either way.

## 3. What identifies him at 46px

From `photos/raw/wife_and_i/`:

- **Dark curly hair with real volume** — draw it as a mass wider than the
  skull, not a cap.
- **Clear-framed glasses**, two light pixels across the eyes. The identifier.
- Short beard.
- Skin ramp in `docs/characters.md`: `#4a2f1d` → `#7a4e2e` → `#a67c55` →
  `#cdb08a`, lit side `#e8c48a`.

## 4. The chair

He should sit *in* the chair, not beside it. The chair is a separate prop at
`gx 6.9, gy 2.6`; either compose the two or fold the chair into the seated
sprite. Composing is better — the chair stays when he stands.

## 5. Render him

He isn't scheduled, so he doesn't belong in `Visitors`. Give him his own
small component, sorted into the same painter's order, with the same
contact shadow. The desk is at `gy 0.35-1.35`; he sits in front of it, so he
draws after it and in front of the rug.

## Checking it

`npm run characters -- --sheet`, then screenshots with the desk down and
up — he should be seated in one and standing in the other, hands at the
keyboard in both. Visitors still pass in front of and behind him correctly.

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
