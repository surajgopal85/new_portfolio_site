# Reference photos

`photos/raw/` is gitignored — these are source material, not site assets.

Shot list, all in good daylight, camera straight on and level:

- [ ] The office, wide and straight-on. This one becomes the scene, so shoot it
      from where a visitor should feel they're standing.
- [ ] The desk, raised.
- [ ] The desk, lowered. Same camera position as the shot above, so the two can
      be diffed into one animation.
- [ ] The piano keyboard.
- [ ] Each doorway people and pets come through.
- [ ] The cat.
- [ ] The dog.
- [ ] Caitlin — only after asking whether she's comfortable being drawn into the
      scene as a pixel character.

Then: `npm run pixelate -- photos/raw/office.jpg --width 384 --dither --preview 4`
