# Art direction

Reference: Stardew Valley interiors. Cult of the Lamb set the camera; Stardew
sets everything else — scale, density, how much detail each object carries.

## The camera

Looking down at the floor, with everything on it drawn front-facing and a
little of its top showing. Not isometric, not a flat elevation. Strictly
orthographic: no vanishing point, and nothing scales with depth.

## The grid

16 px tiles. The scene is 384×216 — 24×13.5 tiles. Back wall 3 tiles, floor
10.5. Align to the grid wherever an object doesn't have a reason not to.

## Scale is set by the character, not the furniture

| | size |
|---|---|
| Person | 12 × 26–30 px |
| Peanut | 18 × 13 px |
| Kibou | 14 × 10 px (plus tail) |
| Desk | 3 tiles wide |
| Monitor | 20 × 16 px |
| Door | 2 tiles wide |

That makes a tile about two feet, and the room about 24 feet of wall — wider
than the real office. Widening a room to fit its furniture into one readable
frame is standard, and nobody notices.

The first version of this scene was drawn ~2.5× too large, which is why it
read as a close-up of one corner with big empty gaps. The fix for emptiness is
**more objects, not bigger ones**.

## Density

Stardew rooms have very little dead floor. Every gap carries something small —
a plant, a box, a cable, a rug edge. Our equivalents: the plush, Peanut's
bone, the power strip and its cable run, the shelf, cables behind the desk.
When a region of floor looks bare, the answer is another small object, not a
larger nearby one.

## Drawing rules

- Flat fills plus **one** shadow step per surface. Three tones maximum on
  small objects.
- Hard outline in `--ink`, never pure black against the warm palette.
- Floors get plank lines; large flat fills are the main thing that reads as
  unfinished.
- Never dither a room. It turns flat walls into speckle. `--dither` is for
  photographs with gradients, nothing else.
- Repeating patterns — the rug especially — are built by tiling one
  hand-drawn motif, not by quantizing a photo of the whole thing.
- 22-color palette in `scripts/palette.json`, grouped `room`, `room-night`,
  `outside`, `fur`, `skin`.

## The scene's story

**Suraj is at the desk, typing. That's the constant.** The other three are
interruptions, and they arrive **one at a time**, with quiet stretches
between — the room should feel like working alone and being interrupted, not
like a screensaver with three loops running.

One scheduler, not three. A visitor enters through the door, crosses to their
spot, does their beat, leaves. Nobody else can start until they're gone.

| | beat |
|---|---|
| Kibou | Sits on the desk between you and the monitor. Tail across the screen. |
| Peanut | Crosses to the rug, turns around twice, lies down by the bone. |
| Caitlin | Comes to the side of the desk, says something, goes back out. |

Night, always. The monitor is the brightest thing in the room, which is right:
it's the Projects link.
