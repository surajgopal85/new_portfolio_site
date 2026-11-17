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


- [ ] The office, wide and straight-on. This one becomes the scene, so shoot it
      from where a visitor should feel they're standing.
- [ ] The desk, raised.
- [ ] The desk, lowered. Same camera position as the shot above, so the two can
      be diffed into one animation.
- [ ] The piano keyboard.
- [ ] Each doorway people and pets come through.
- [x] The cat — `kibou/`. Good color reference, no usable sprite pose.
- [x] The dog — `peanut/`. `IMG_0165` is the one that pixelates cleanly.
- [x] Caitlin and Suraj — `wife_and_i/`. Faces and coloring, all ¾ or head-on.
- [ ] **Side-on standing shots of all four.** The characters walk across the
      room, so every walk frame is a profile and none of the current photos is
      one. One side only — the other direction is the sprite mirrored.
- [ ] **The pause pose, also in profile** — sitting for the pets, standing
      relaxed for people.
- [x] Caitlin's okay on being drawn in — yes.

Then: `npm run pixelate -- photos/raw/office.jpg --width 384 --dither --preview 4`
