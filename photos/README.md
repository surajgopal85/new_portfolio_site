# Reference photos

`photos/raw/` is gitignored — these are source material, not site assets.

Shot list, all in good daylight, camera straight on and level.

Three rules that decide whether a photo survives quantization:

1. **Camera at the subject's height.** Shot from standing, a cat becomes a
   foreshortened blob. Get the lens down to Kibou's shoulder. Stand back and
   let the lens do the work rather than leaning in — phone lenses stretch
   whatever is closest.
2. **Background is the tonal opposite of the subject**, so the outline
   survives. Peanut is cream: shoot her against the dark floor or a dark
   doorway, never the white wall. Kibou's orange reads against the white wall,
   but not against anything cardboard-brown.
3. **Daylight.** Warm lamplight collapsed dog, bedding and headboard into the
   same three browns, and the sprite came out unreadable.

Whole body in frame every time — Kibou's plume tail and Peanut's whip tail are
their strongest identifiers at sprite size, and a cropped tail costs more than
a cropped paw.


- [x] The office — `office/`. Night shots; the room is drawn at night, see
      `docs/decisions.md`. These are layout and contents reference: the scene
      is built from a top-down angle no photo can capture directly.
- [ ] The desk, raised.
- [ ] The desk, lowered. Same camera position as the shot above, so the two can
      be diffed into one animation.
- [ ] The piano keyboard.
- [ ] Each doorway people and pets come through.
- [x] The cat — `kibou/`. Good color reference, no usable sprite pose.
- [x] The dog — `peanut/`. `IMG_0165` is the one that pixelates cleanly.
- [x] Caitlin and Suraj — `wife_and_i/`. Faces and coloring, all ¾ or head-on.
- [ ] **Two three-quarter views of all four**, matching the room's isometric
      camera: 45 degrees in front and above, and 45 degrees behind and above.
      Only two, because the other two directions are these mirrored. See
      `docs/characters.md`.
- [ ] **The pause pose** — sitting for the pets, standing relaxed for people,
      from the three-quarter front.
- [x] Caitlin's okay on being drawn in — yes.

---

# Fleshing out the room

Every object in `components/scene/room.ts` is a blank box until it has a
sprite. Each needs **one straight-on photo, flat to the wall or front, the
object filling the frame, even light**. These get traced individually, so a
clean single-object shot beats a good photo of the whole room every time.

## 1. Facts first — these set the scale for everything else

- [ ] **A hand sketch of the floor plan.** Rough rectangle, mark which wall has
      the desk, the windows, the door, the piano, the credenza, and where the
      cork board and each poster hang. Photograph the napkin. This is the
      single most useful thing on this list.
- [ ] **Room dimensions**, roughly — width and depth in feet. Everything in
      room.ts is currently sized by eye; real numbers turn art px per inch into
      a fixed ratio and make every object's size follow automatically.
- [ ] **Desk travel** — height lowered and raised, so the animation moves the
      right distance instead of a guessed 11%.
- [ ] **Which doorway do Kibou, Peanut and Caitlin actually come through?**
      That's where the state machine spawns them.

## 2. Props already boxed out in room.ts, each needing a photo

The desk group:
- [x] Standing desk — `IMG_0722`. Shows the L: the standing desk along the
      back wall, a wooden return along the right wall with the M-Audio
      controller on it, cork board hung above that.
- [ ] Standing desk, straight on, **lowered**
- [ ] Standing desk, straight on, **raised** — same camera position, so the two
      can be diffed
- [ ] The desktop from above: keyboard, mouse, water bottle, whatever lives there
- [ ] Monitor, screen **off** (so the bezel reads) and screen **on** (for the
      glow color)
- [ ] Laptop, open
- [ ] Office chair, front and side
- [ ] The cube shelf under the desk

The music corner:
- [ ] Roland keyboard, straight on, whole instrument
- [ ] The X-stand on its own
- [ ] The amp, straight on
- [ ] The credenza, and the MIDI keyboard sitting on it

The rest of the room:
- [x] **The rug** — `IMG_0721`. Shot from above, which is already the right
      projection. Built by tiling, not pixelating: see below.
- [ ] Blue futon / floor chair, front
- [ ] The door, closed, straight on; and the door trim
- [ ] The windows at night, straight on, curtains as they normally hang
- [ ] **The view out the window** — driveway, trees, street, streetlight. This
      becomes its own layer behind the glass.
- [ ] Ceiling fan from below
- [ ] Any lamp that's actually on at night

Small things that make a room look lived in (one photo each, any angle):
- [ ] The burger-cat plush
- [ ] Peanut's bone
- [ ] The little gold frame on the desk
- [ ] Mug, water bottle, headphones, cables — whatever is genuinely always there

Already done:
- [x] Ligeti *Artikulation* score — `IMG_0717`
- [x] Schiele self-portrait — `IMG_0718`
- [x] Cork board — `IMG_0720`

## The rug, and anything else with a repeating pattern

Running the whole rug through `pixelate` gives mush — eleven güls across 176
art px is roughly 16 px each, and the photo's keystone makes the rows drift.
The answer is to do what the weaver did: draw **one** motif cleanly and repeat
it.

`photos/pixel-refs/rug-gul-20.png` is a single gül pulled out of the photo at
20 px, and `rug-tiled-draft.png` is that motif tiled across the rug's actual
footprint with alternating row offsets. The rhythm is right; the motif is
still a noisy photo crop. Redraw it by hand — symmetrical, three colors plus
the outline, 20×14 or so — and the whole rug follows.

The border bands get the same treatment: one repeating unit, tiled.

## 3. Decisions that change what gets drawn

- [x] **Time of day: night.** Locked.
- [x] **Ceiling fan** — in, as a turning shadow on the floor. On probation.
- [x] **Is the cork board interactive?** Yes — it's where whatever you're
      studying goes, so it opens `/now/`. Four hotspots now.
- [x] **The monitor** shows the overworld map, drifting occasionally to a
      terminal or to Kibou.

Then: `npm run pixelate -- photos/raw/office/IMG_0714.jpeg --width 384 --preview 2`
