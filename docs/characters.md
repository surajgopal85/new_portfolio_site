# Character reference

Three characters wander through the office: **Kibou** (cat), **Peanut** (dog)
and **Caitlin**. Suraj is the fourth, at the desk.

Colors below were sampled off the reference photos in `photos/raw/` and then
snapped to the nearest palette entry, so what you draw in Aseprite matches what
the room is already made of. Palette: `scripts/palette.json`.

## Scale

The scene is 384×216 art px — 24×13.5 tiles at 16px. Everything should sit on
that grid:

| | height | length |
|---|---|---|
| Standing person | 56–64 px (≈4 tiles) | — |
| Peanut | 28 px at the shoulder | ~44 px nose to rump, + 20 px tail |
| Kibou | 22 px at the shoulder | ~34 px, + a tail nearly as long again |

At these sizes, detail is not what makes someone recognizable — silhouette and
two or three color blocks are. Draw the silhouette first, in one flat color,
and only shade it once it already reads from across the room.

## Kibou

Long-haired orange-and-white. The three things that survive pixelation:

1. **The tail.** A full plume, nearly as long as the body, carried high. It's
   the single most recognizable thing about him at 22 px — give it its own
   outline and let it break the body silhouette.
2. **The face split.** Orange cap over the head and ears, white blaze running
   up the muzzle between the eyes, white chin.
3. **White chest and front paws** against the orange saddle.

Pink nose, pale hazel-green eyes, ear tufts. Ramp, dark to light:

| part | color |
|---|---|
| outline, pupil | `#1a1420` ink |
| deep fur shadow, ear interior | `#4a2f1d` bark-dark |
| shadowed orange | `#7a4e2e` bark |
| mid orange saddle | `#cf8a4e` ginger |
| sunlit orange | `#e8c48a` tan |
| white fur, in shadow | `#cdb08a` sand |
| white fur, lit | `#f6ecd8` cream → `#fffdf6` paper |
| nose | `#d98ca0` rose |

## Peanut

Pale cream short-haired mix, lean and leggy. Identifiers:

1. **The ears** — darker tan, folded over, set wide. Nearly the only dark mass
   on an otherwise pale animal, so they carry the whole read of the head.
2. **The white blaze** from forehead down the muzzle to a black nose.
3. **A long thin whip tail with a white tip**, and white speckled front paws.

Ramp:

| part | color |
|---|---|
| outline, nose, eye | `#1a1420` ink |
| ear fold, deepest shadow | `#4a2f1d` bark-dark |
| ear, shadowed coat | `#7a4e2e` bark |
| coat in shadow | `#a67c55` clay |
| mid coat | `#cdb08a` sand |
| lit coat | `#e8c48a` tan |
| blaze, chest, paws | `#f6ecd8` cream → `#fffdf6` paper |
| tongue | `#d98ca0` rose |

## Suraj

Dark curly hair with real volume — draw it as a block that's wider than the
head, not a cap. **Clear-framed glasses are the identifier**: at 60 px tall
they're two light pixels across each eye, and without them the sprite is just
a man. Beard kept short. Skin ramp `#4a2f1d` → `#7a4e2e` → `#a67c55` →
`#cdb08a`, lit side `#e8c48a`.

## Caitlin

Long dark-brown hair falling past the shoulders with a soft wave, parted off
-center — the hair mass is the silhouette, so let it break the shoulder line on
one side. Lighter skin: ramp `#7a4e2e` → `#a67c55` → `#cdb08a` → `#e8c48a`,
highlight `#f6ecd8`.

## Frames each character needs

Matching the phases in `lib/characters.ts`:

| phase | frames | view |
|---|---|---|
| `walking-in` / `walking-out` | 4-frame cycle, mirrored for the other direction | side-on |
| `paused` | 2 frames (breathing, tail flick, ear twitch) | side-on or ¾ |

Six frames per character. Export as one horizontal strip per character into
`public/art/characters/<name>.png`, frames evenly spaced, transparent
background.

## Reference photos: what worked

Running the existing photos through `npm run pixelate` was a palette test, not
a sprite test — and that's the honest limit of the tool. What it showed:

- **Good:** `peanut/IMG_0165.jpeg`. Daylight, pale dog against a dark floor and
  a white wall. The 64px version in `photos/pixel-refs/` is legible enough to
  trace over — face, ears, eyes, front legs all survive.
- **Unusable:** `kibou/IMG_9720.jpeg` (orange cat in a brown cardboard box) and
  `peanut/IMG_0417.jpeg` (tan dog on tan bedding, lamplight). The subject and
  the background quantize to the same browns and the silhouette dissolves.

The rule that falls out of this: **contrast at the outline is everything.** A
photo where you can't trace the animal's edge with your eye won't survive
quantization either.

## Still needed

- [ ] Kibou, standing, **side-on**, against the white wall.
- [ ] Peanut, standing, **side-on**, against the white wall.
- [ ] Both sitting, side-on — the `paused` pose.
- [ ] Caitlin standing, side-on and ¾, in the doorway she usually comes through.
      (She's in — asked and said yes.)
- [ ] Suraj at the desk, side-on, seated and standing.

Side-on matters because the whole state machine is walk in / pause / walk out
across the room. None of the current photos is a profile.
