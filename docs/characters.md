# Character reference

Three characters wander through the office: **Kibou** (cat), **Peanut** (dog)
and **Caitlin**. Suraj is the fourth, at the desk, and doesn't move.

Positions are tiles on the isometric floor — the same coordinates the
furniture uses. See `lib/characters.ts` for each visitor's spot and beat,
and `npm test` for the contract the state machine has to satisfy.

Colors below were sampled off the reference photos in `photos/raw/` and then
snapped to the nearest palette entry, so what you draw in Aseprite matches what
the room is already made of. Palette: `scripts/palette.json`.

## Scale

The room is isometric now (see `docs/art-direction.md` and
`components/scene/iso.ts`), which changes every number below.

Height is measured in pixels, and the wall is 64px for an 8-foot room — so
**8 pixels to the foot**. A floor tile is 32x16px and about 1.2 feet square.

| | height | footprint |
|---|---|---|
| A person | 44–48 px | 0.5 x 0.5 tiles |
| Peanut | 18 px at the shoulder | 0.5 x 0.8 tiles |
| Kibou | 11 px at the shoulder | 0.4 x 0.7 tiles |

Check them against the furniture: the desk is 26px (3¼ ft), the chair 32px,
the credenza 28px. A person at 46px stands head and shoulders above the desk,
which is what you want.

## Frames: draw two directions, mirror for the other two

In isometric a character faces four ways, named for where they travel on
screen: `down-right`, `down-left`, `up-right`, `up-left`. But **down-left is
down-right mirrored, and up-left is up-right mirrored** — so you only draw
two and flip them.

| view | drawn | used for |
|---|---|---|
| down-right | yes | walking toward the camera |
| up-right | yes | walking away, toward the desk or the windows |
| down-left | mirror of down-right | — |
| up-left | mirror of up-right | — |

Per character:

- **4-frame walk cycle** in each of the two drawn directions — 8 frames.
- **2-frame idle** in down-right, for the `settled` beat — breathing, a tail
  flick, an ear twitch.

**Ten frames per character, not the twenty the four directions suggest.**
Export one horizontal strip per direction into
`public/art/characters/<name>-<down|up>-right.png`, frames evenly spaced,
transparent background. The renderer flips with `transform: scaleX(-1)`,
which is lossless on a whole-pixel sprite.

Mirroring does mean asymmetric markings swap sides — Kibou's face blaze, a
collar, a logo on a shirt. At this size nobody notices, and it halves the
work.

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

## The beats

Matching the phases in `lib/characters.ts`:

Each visitor enters through the door on the west wall, crosses to their spot,
does their beat, and leaves. One at a time, with quiet stretches between.

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

**Two three-quarter views of each character**, matching the room's camera:
one from roughly 45 degrees in front and above, one from 45 degrees behind
and above. Not front/back/side — that list was written for the top-down
camera and the isometric one replaced it.

The camera height matters more than the angle: shoot from above the subject,
looking down at roughly the angle the room is drawn at. For Kibou that means
standing over him; for Peanut, crouching slightly above.

- [ ] Kibou: three-quarter front and three-quarter back. Standing, plus one
      sitting for the idle.
- [ ] Peanut: the same two, standing, plus one lying down.
- [ ] Caitlin: the same two, standing. (She's in — asked and said yes.)
- [ ] Suraj: the same two, plus seated at the desk from behind-right, which
      is how the scene sees him.
