#!/usr/bin/env node
/**
 * The visitors, in ten frames each.
 *
 *   npm run characters                  # write public/art/characters/*.png
 *   npm run characters -- --sheet x.png # and a contact sheet to look at
 *
 * Hand-plotted rather than built from boxes: at eleven pixels tall a cat is
 * all silhouette, and the box primitive that draws the furniture would give
 * a ginger brick. Each frame is a string grid, one character per pixel.
 *
 * This is a first pass and it knows it. What makes Kibou *Kibou* — the
 * plume tail, the orange cap breaking over a white blaze, the ear tufts —
 * is exactly what gets lost at this size by anyone writing code and found
 * by someone drawing. Repaint these in Aseprite and drop them back in; the
 * scene reads the PNGs and nothing else needs to change.
 *
 * Reference: photos/raw/kibou/.
 */
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const PALETTE = {
  '.': null,                       // transparent
  K: [26, 20, 32],                 // outline
  O: [207, 138, 78],               // ginger
  D: [122, 78, 46],                // ginger in shadow
  W: [246, 236, 216],              // white fur
  S: [205, 176, 138],              // white fur, shaded
  P: [217, 140, 160],              // nose
  Y: [79, 158, 74],                // eye
  C: [232, 196, 138],              // Peanut's cream coat
  T: [166, 124, 85],               // her darker, folded ears
  N: [26, 20, 32],                 // black nose
  G: [217, 140, 160],              // tongue
  H: [32, 24, 30],                 // Suraj's hair
  S: [166, 124, 85],               // skin
  L: [205, 176, 138],              // skin, lit side
  D: [122, 78, 46],                // skin, shadow
  E: [232, 236, 240],              // the clear glasses frame
  R: [109, 122, 140],              // shirt
  B: [39, 48, 74],                 // trousers
  M: [58, 38, 34],                 // Caitlin's dark brown hair
  V: [107, 74, 122],               // her top
  A: [59, 43, 64],                 // the office chair
  Q: [109, 122, 140],              // its frame and arms
}

/**
 * Each character declares its own frame size: Peanut is nearly twice
 * Kibou's height and would be clipped by his.
 */

/**
 * Body and head, down-right: walking toward the camera, face visible.
 *
 * He's an orange-AND-white cat, and that split is what makes him himself at
 * this size. Orange is a cap over the head and ears and a saddle over the
 * back; white is the blaze up the muzzle, the bib, the belly, the socks and
 * the tail tip. A sprite that's ginger all over is just a ginger cat.
 *
 * The head sits a clear five rows above the back so there's a neck notch —
 * without it a cat this small reads as a dachshund.
 */
const BODY_DOWN = [
  '.KKK................',
  '.KWWK...............',
  '.KWOK........KK.KK..',
  '.KOOK.......KOOKOOK.',
  '.KOOK......KOOOOOOK.',
  '.KOOK.....KOWWWWWOK.',
  '..KOOKKKKKOWWPWYWOK.',
  '..KOOOOOOOOOWWWWWK..',
  '..KOOOOOOOOOOOOOK...',
  '..KWWWWWWWWWWWWK....',
]

/** Body and head, up-right: walking away, so it's back, ears and plume. */
const BODY_UP = [
  '.KKK................',
  '.KWWK...............',
  '.KWOK........KK.KK..',
  '.KOOK.......KODKDOK.',
  '.KOOK......KOOOOOOK.',
  '.KOOK.....KOOOOOOOK.',
  '..KOOKKKKKOOODDOOOK.',
  '..KOOOOOOOOOOOOOOK..',
  '..KOOOOOOOOOOOOOK...',
  '..KWOOOOOOOOOOWK....',
]

/**
 * Two leg positions, alternating. Two pixels wide with a white sock and a
 * paw a pixel wider than the leg — a cat at this size is a shape with feet,
 * not a loaf on pins.
 */
const LEGS = [
  ['..KKK........KKK....', '..KOOK.......KOOK...', '..KWWK.......KWWK...'],
  ['...KKK......KKK.....', '...KOOK.....KOOK....', '...KWWK.....KWWK....'],
  ['..KKK.........KKK...', '..KOOK........KOOK..', '..KWWK........KWWK..'],
  ['...KKK......KKK.....', '...KOOK.....KOOK....', '...KWWK.....KWWK....'],
]

/** Sitting, facing down-right. The settled pose, with the tail curled round. */
const SIT = [
  [
    '........KK.KK.......',
    '.......KOOKOOK......',
    '.......KOOOOOOK.....',
    '......KOWWWWWWOK....',
    '......KOWYWPWYWK....',
    '.......KWWWWWWK.....',
    '......KOWWWWWOK.....',
    '.....KOWWWWWWOK.....',
    '.....KOWWWWWWOK.....',
    '....KKOWWWWWWOK.....',
    '...KWWKWWWWWWKK.....',
    '...KWOKKWWWWWK......',
    '....KKK.KWWKK.......',
  ],
  [
    '....................',
    '........KK.KK.......',
    '.......KOOKOOK......',
    '.......KOOOOOOK.....',
    '......KOWWWWWWOK....',
    '......KOWYWPWYWK....',
    '.......KWWWWWWK.....',
    '......KOWWWWWOK.....',
    '.....KOWWWWWWOK.....',
    '.....KOWWWWWWOK.....',
    '....KKOWWWWWWOK.....',
    '...KWWKWWWWWWKK.....',
    '...KWOKKWWWWWK......',
    '....KKK.KWWKK.......',
  ],
]

function drawRows(data, rows, offsetX, offsetY, stripW) {
  rows.forEach((row, y) => {
    ;[...row].forEach((ch, x) => {
      const col = PALETTE[ch]
      if (!col) return
      const px = offsetX + x
      const py = offsetY + y
      const i = (py * stripW + px) * 4
      data[i] = col[0]
      data[i + 1] = col[1]
      data[i + 2] = col[2]
      data[i + 3] = 255
    })
  })
}

/** One horizontal strip, frames evenly spaced, transparent between them. */
async function strip(name, frames, fw, fh) {
  const w = fw * frames.length
  const data = new Uint8ClampedArray(w * fh * 4)
  frames.forEach((rows, i) => {
    // Stand on the frame's bottom edge, whatever the pose's height — so a
    // sitting cat and a walking one have their feet in the same place.
    drawRows(data, rows, i * fw, fh - rows.length, w)
  })
  const out = `public/art/characters/${name}.png`
  await sharp(Buffer.from(data.buffer), { raw: { width: w, height: fh, channels: 4 } })
    .png()
    .toFile(out)
  console.log(`${out}  ${w}x${fh}  ${frames.length} frames`)
  return { name, out, w, fh }
}

await mkdir('public/art/characters', { recursive: true })

// A one-pixel bob on the off-beats, which is what sells a walk.
const walk = (body) =>
  LEGS.map((legs, i) => {
    const bob = i % 2 === 1 ? [''] : []
    return [...bob, ...body, ...legs]
  })

/**
 * Peanut: pale, lean and leggy, where Kibou is ginger, low and round. At 18px
 * at the shoulder she's nearly twice his height, which leaves room for
 * markings he couldn't carry.
 *
 * The two things that identify her in silhouette: the folded darker ears,
 * which are the only dark mass on a pale animal and so carry the whole read
 * of the head, and the thin whip tail with its white tip — the opposite of
 * his plume. Tail shape is the fastest way to tell two animals apart.
 */
const PEANUT_W = 26
const PEANUT_H = 22

/**
 * Down-right: walking toward the camera.
 *
 * Three things keep her from reading as a cat. The ears **hang down the
 * side of the skull** rather than standing up — a dropped ear is the single
 * clearest dog signal in silhouette. The **snout projects** past the skull
 * instead of stopping at a flat face. And the **tongue** is out, because
 * it usually is.
 */
const P_DOWN = [
  '...K......................',
  '..KWK.....................',
  '..KWK............KCCCCK...',
  '..KCK...........KCCCCCCK..',
  '..KCK..........KTCCWWCCCK.',
  '..KCKKKKKKKKKKKKTCWYWCCCK.',
  '..KCCCCCCCCCCCCKTTCCWWCCK.',
  '..KCCCCCCCCCCCCKTTCWWWNNK.',
  '..KWWCCCCCCCCCCKTKCWWWNK..',
  '...KCCK......KCCKK.KGGK...',
]

/** Up-right: walking away. Ears still hang; no face, so the tail carries it. */
const P_UP = [
  '...K......................',
  '..KWK.....................',
  '..KWK...........KCCCCCK...',
  '..KCK..........KCCCCCCCK..',
  '..KCK.........KTCCCCCCTK..',
  '..KCKKKKKKKKKKKTTCCCCTTK..',
  '..KCCCCCCCCCCCKTTCCCCTTK..',
  '..KCCCCTTCCCCCKTKCCCCKTK..',
  '..KWCCCCCCCCCCCKCCCCCK....',
  '...KCCK......KCCK.........',
]

/** Long legs, which is most of what makes her read as a dog and not a cat. */
const P_LEGS = [
  ['..KCK........KCK..........', '..KCK........KCK..........', '..KWWK......KWWK.........'],
  ['...KCK......KCK...........', '...KCK......KCK...........', '...KWWK....KWWK..........'],
  ['..KCK.........KCK.........', '..KCK.........KCK.........', '..KWWK.......KWWK........'],
  ['...KCK......KCK...........', '...KCK......KCK...........', '...KWWK....KWWK..........'],
]

/**
 * Lying down — her settled beat, not sitting. Head up, ears hanging, tongue
 * out: the two frames are a breath apart, and the tongue moves between them.
 */
const P_LIE = [
  [
    '..........................',
    '.................KCCCCK...',
    '................KCCCCCCK..',
    '...............KTCCWWCCCK.',
    '....K..........KTCWYWCCCK.',
    '...KWKKKKKKKKKKKTTCCWWCCK.',
    '...KCCCCCCCCCCCKTTCWWWNNK.',
    '...KCCCCCCCCCCCKTKCWWWNK..',
    '...KWWCCCCCCCCCKK..KGGK...',
    '....KKKKKKKKKKKK..........',
  ],
  [
    '..........................',
    '.................KCCCCK...',
    '................KCCCCCCK..',
    '...............KTCCWWCCCK.',
    '....K..........KTCWYWCCCK.',
    '...KWKKKKKKKKKKKTTCCWWCCK.',
    '...KCCCCCCCCCCCKTTCWWWNNK.',
    '...KCCCCCCCCCCCKTKCWWWNK..',
    '...KWCCCCCCCCCCKK...KGK...',
    '....KKKKKKKKKKKKK.........',
  ],
]

async function peanut() {
  const walkP = (body) =>
    P_LEGS.map((legs, i) => [...(i % 2 === 1 ? [''] : []), ...body, ...legs])
  return [
    await strip('peanut-down-right', walkP(P_DOWN), PEANUT_W, PEANUT_H),
    await strip('peanut-up-right', walkP(P_UP), PEANUT_W, PEANUT_H),
    await strip('peanut-idle', P_LIE, PEANUT_W, PEANUT_H),
  ]
}

/**
 * Suraj at the desk.
 *
 * He is NOT a visitor — no scheduler, no phases, no door. He's the constant
 * the room is organised around, and everyone else is an interruption.
 *
 * FACING: three-quarter back view, which is what someone at a desk against
 * a wall actually looks like. The cost is his face; the compensation is the
 * clear-framed glasses, visible as a pale edge on the near cheek. If that
 * doesn't read at size, the fallback is to seat him at the corner of the L
 * turned toward the room — less true to the photo, far more legible.
 *
 * What identifies him at 44px: dark curly hair drawn as a mass wider than
 * the skull, the glasses, a short beard.
 */
const SURAJ_W = 22
const SURAJ_H = 44

/** Standing at the raised desk. */
const SURAJ_STAND = [
  '.......KHHHHK.......',
  '......KHHHHHHK......',
  '.....KHHHHHHHHK.....',
  '....KHHHHHHHHHHK....',
  '....KHHHHHHHHHHK....',
  '....KHHHHHHHHHHHK...',
  '....KHHHHHHHHHSEK...',
  '....KHHHHHHHHSSEK...',
  '.....KHHHHHHHSSLK...',
  '.....KHHHHHHSSSLK...',
  '......KDDDDSSSLK....',
  '.......KSSSSSLK.....',
  '........KSSSLK......',
  '........KRRRK.......',
  '.....KKKRRRRKKK.....',
  '...KKRRRRRRRRRRKK...',
  '..KRRRRRRRRRRRRRRK..',
  '..KRRRRRRRRRRRRRRK..',
  '..KSRRRRRRRRRRRRSK..',
  '..KSKRRRRRRRRRRKSK..',
  '..KSKRRRRRRRRRRKSK..',
  '..KSKRRRRRRRRRRKSK..',
  '..KSKRRRRRRRRRRKSK..',
  '..KLKRRRRRRRRRRKLK..',
  '...KKRRRRRRRRRRKK...',
  '....KRRRRRRRRRRK....',
  '....KRRRRRRRRRRK....',
  '....KBBBBBBBBBBK....',
  '....KBBBBBBBBBBK....',
  '....KBBBBBBBBBBK....',
  '....KBBBBKKBBBBK....',
  '....KBBBK.KBBBBK....',
  '....KBBBK.KBBBBK....',
  '....KBBBK.KBBBBK....',
  '....KBBBK.KBBBBK....',
  '....KBBBK.KBBBBK....',
  '....KBBBK.KBBBBK....',
  '....KBBBK.KBBBBK....',
  '....KKKKK.KKKKKK....',
]

/**
 * Seated at the lowered desk: head, shoulders and the top of the torso
 * only.
 *
 * This sprite is drawn sitting ON the chair's seat, not standing on the
 * floor — the renderer places it at seat height. Anchoring it to the floor
 * is what put his head level with the chair back and hid him completely.
 * A seated head is about three quarters of a standing one, which the
 * shorter sprite plus the seat height gives for free.
 */
const SURAJ_SIT = [
  '.......KHHHHK.......',
  '......KHHHHHHK......',
  '.....KHHHHHHHHK.....',
  '....KHHHHHHHHHHK....',
  '....KHHHHHHHHHHK....',
  '....KHHHHHHHHHHHK...',
  '....KHHHHHHHHHSEK...',
  '....KHHHHHHHHSSEK...',
  '.....KHHHHHHHSSLK...',
  '.....KHHHHHHSSSLK...',
  '......KDDDDSSSLK....',
  '.......KSSSSSLK.....',
  '........KSSSLK......',
  '.......KKRRRKK......',
  '....KKKRRRRRRKKK....',
  '..KKQQRRRRRRRRQQKK..',
  '..KQQQRRRRRRRRQQQK..',
  '..KQAAARRRRRRAAAQK..',
  '..KQAAAAAAAAAAAAQK..',
  '..KQAAAAAAAAAAAAQK..',
  '..KKAAAAAAAAAAAAKK..',
  '...KAAAAAAAAAAAAK...',
  '....KKAAAAAAAAKK....',
  '......KQQQQQQK......',
  '........KQQK........',
  '........KQQK........',
  '.....KKKKQQKKKK.....',
  '....KQQKKKKKKQQK....',
]

/**
 * Facing the camera.
 *
 * No mouth. At sixteen pixels across, a mouth is two or three pixels and
 * reads as a grimace however it's drawn — the glasses carry the identity on
 * their own, and the beard is a shape rather than a face. Leaving a feature
 * out is usually the right call at this size.
 */
const SURAJ_FRONT = [
  '.......KHHHHK.......',
  '......KHHHHHHK......',
  '.....KHHHHHHHHK.....',
  '....KHHHHHHHHHHK....',
  '....KHHHHHHHHHHK....',
  '....KHSSSSSSSSHK....',
  '....KHSSSSSSSSHK....',
  '....KSEEKSSKEESK....',
  '....KSEKKSSKKESK....',
  '....KSSSSSSSSSSK....',
  '....KSDDDDDDDDSK....',
  '.....KDDDDDDDDK.....',
  '......KSSSSSSK......',
  '.......KRRRRK.......',
  '....KKKRRRRRRKKK....',
  '..KKRRRRRRRRRRRRKK..',
  '..KSRRRRRRRRRRRRSK..',
  '..KSRRRRRRRRRRRRSK..',
  '..KSKRRRRRRRRRRKSK..',
  '..KSKRRRRRRRRRRKSK..',
  '..KSKRRRRRRRRRRKSK..',
  '..KLKRRRRRRRRRRKLK..',
  '...KKRRRRRRRRRRKK...',
  '....KRRRRRRRRRRK....',
  '....KBBBBBBBBBBK....',
  '....KBBBBBBBBBBK....',
  '....KBBBBBBBBBBK....',
]

/** Walking away: the back of him, same build. */
const SURAJ_BACK = [
  '.......KHHHHK.......',
  '......KHHHHHHK......',
  '.....KHHHHHHHHK.....',
  '....KHHHHHHHHHHK....',
  '....KHHHHHHHHHHK....',
  '....KHHHHHHHHHHK....',
  '....KHHHHHHHHHHK....',
  '....KHHHHHHHHHHK....',
  '....KHHHHHHHHHHK....',
  '.....KHHHHHHHHK.....',
  '.....KHHHHHHHHK.....',
  '......KDDDDDDK......',
  '......KSSSSSSK......',
  '.......KRRRRK.......',
  '....KKKRRRRRRKKK....',
  '..KKRRRRRRRRRRRRKK..',
  '..KSRRRRRRRRRRRRSK..',
  '..KSRRRRRRRRRRRRSK..',
  '..KSKRRRRRRRRRRKSK..',
  '..KSKRRRRRRRRRRKSK..',
  '..KSKRRRRRRRRRRKSK..',
  '..KLKRRRRRRRRRRKLK..',
  '...KKRRRRRRRRRRKK...',
  '....KRRRRRRRRRRK....',
  '....KBBBBBBBBBBK....',
  '....KBBBBBBBBBBK....',
  '....KBBBBBBBBBBK....',
]

/** Four leg positions. A person's walk is two legs swapping; at this size
 *  anything more detailed is noise. */
const SURAJ_LEGS = [
  ['...KBBBK.KBBBK......', '...KBBBK.KBBBK......', '...KBBBK.KBBBK......', '...KBBBK.KBBBK......', '...KKKKK.KKKKK......'],
  ['....KBBBKBBBK.......', '....KBBBKBBBK.......', '....KBBBKBBBK.......', '....KBBBKBBBK.......', '....KKKKKKKKK.......'],
  ['..KBBBK...KBBBK.....', '..KBBBK...KBBBK.....', '..KBBBK...KBBBK.....', '..KBBBK...KBBBK.....', '..KKKKK...KKKKK.....'],
  ['....KBBBKBBBK.......', '....KBBBKBBBK.......', '....KBBBKBBBK.......', '....KBBBKBBBK.......', '....KKKKKKKKK.......'],
]

/**
 * Seated at the writing side of the L, facing the room.
 *
 * Head and shoulders only, like the other seated pose — the desk hides the
 * rest, which is what a desk does. This is the angle that shows his face
 * without him leaving the desk at all.
 */
const SURAJ_SIT_FRONT = [
  '.......KHHHHK.......',
  '......KHHHHHHK......',
  '.....KHHHHHHHHK.....',
  '....KHHHHHHHHHHK....',
  '....KHHHHHHHHHHK....',
  '....KHSSSSSSSSHK....',
  '....KHSSSSSSSSHK....',
  '....KSEEKSSKEESK....',
  '....KSEKKSSKKESK....',
  '....KSSSSSSSSSSK....',
  '....KSDDDDDDDDSK....',
  '.....KDDDDDDDDK.....',
  '......KSSSSSSK......',
  '.......KRRRRK.......',
  '....KKKRRRRRRKKK....',
  '..KKQQRRRRRRRRQQKK..',
  '..KQQSRRRRRRRRSQQK..',
  '..KQASRRRRRRRRSAQK..',
  '..KQALRRRRRRRRLAQK..',
  '..KQAKRRRRRRRRKAQK..',
  '..KKAABBBBBBBBAAKK..',
  '...KAABBBBBBBBAAK...',
  '....KKBBBBBBBBKK....',
  '......KQQQQQQK......',
  '........KQQK........',
  '........KQQK........',
  '.....KKKKQQKKKK.....',
  '....KQQKKKKKKQQK....',
]

/** A one-pixel bob, which is all it takes to read as typing. */
const typing = (rows) => [rows, ['', ...rows]]

/**
 * Caitlin.
 *
 * She and Suraj are the same height and both dark-haired, so the thing that
 * separates them at this size is the **hair mass**: hers falls past the
 * shoulders and breaks the shoulder line on both sides, where his stops at
 * the skull. That silhouette is doing all the work — at 44px you won't read
 * a face across a room, but you will read an outline.
 */
const CAIT_FRONT = [
  '......KMMMMMMK......',
  '.....KMMMMMMMMK.....',
  '....KMMMMMMMMMMK....',
  '....KMMMMMMMMMMK....',
  '....KMMLLLLLLMMK....',
  '....KMMLLLLLLMMK....',
  '....KMLKLLLLKLMK....',
  '....KMLLLLLLLLMK....',
  '....KMLLLCCLLLMK....',
  '....KMMLLLLLLMMK....',
  '...KMMMLLLLLLMMMK...',
  '...KMMMMKKKKMMMMK...',
  '...KMMMMVVVVMMMMK...',
  '..KKMMMVVVVVVMMMKK..',
  '..KMMMVVVVVVVVMMMK..',
  '..KLMMVVVVVVVVMMLK..',
  '..KLKMVVVVVVVVMKLK..',
  '..KLKMVVVVVVVVMKLK..',
  '..KLKKVVVVVVVVKKLK..',
  '..KCK.VVVVVVVV.KCK..',
  '...KK.VVVVVVVV.KK...',
  '......KVVVVVVK......',
  '......KBBBBBBK......',
  '......KBBBBBBK......',
  '......KBBBBBBK......',
]

/** Walking away: hair all the way down, which is the whole silhouette. */
const CAIT_BACK = [
  '......KMMMMMMK......',
  '.....KMMMMMMMMK.....',
  '....KMMMMMMMMMMK....',
  '....KMMMMMMMMMMK....',
  '....KMMMMMMMMMMK....',
  '....KMMMMMMMMMMK....',
  '....KMMMMMMMMMMK....',
  '....KMMMMMMMMMMK....',
  '....KMMMMMMMMMMK....',
  '....KMMMMMMMMMMK....',
  '...KMMMMMMMMMMMMK...',
  '...KMMMMMMMMMMMMK...',
  '...KMMMMMMMMMMMMK...',
  '..KKMMMMMMMMMMMMKK..',
  '..KMMMMMMMMMMMMMMK..',
  '..KLMMMMMMMMMMMMLK..',
  '..KLKMMMMMMMMMMKLK..',
  '..KLKMMVVVVVVMMKLK..',
  '..KLKKVVVVVVVVKKLK..',
  '..KCK.VVVVVVVV.KCK..',
  '...KK.VVVVVVVV.KK...',
  '......KVVVVVVK......',
  '......KBBBBBBK......',
  '......KBBBBBBK......',
  '......KBBBBBBK......',
]

/** A person's walk: body plus alternating legs, with a bob on the off-beat. */
const walkPerson = (body) =>
  SURAJ_LEGS.map((legs, i) => [...(i % 2 === 1 ? [''] : []), ...body, ...legs])

const KIBOU_W = 20
const KIBOU_H = 16

const written = [
  await strip('kibou-down-right', walk(BODY_DOWN), KIBOU_W, KIBOU_H),
  await strip('kibou-up-right', walk(BODY_UP), KIBOU_W, KIBOU_H),
  await strip('kibou-idle', SIT, KIBOU_W, KIBOU_H),
  ...(await peanut()),
  await strip('suraj-type', typing(SURAJ_STAND), SURAJ_W, SURAJ_H),
  await strip('suraj-sit', typing(SURAJ_SIT), SURAJ_W, SURAJ_H),
  await strip('suraj-down-right', walkPerson(SURAJ_FRONT), SURAJ_W, SURAJ_H),
  await strip('suraj-up-right', walkPerson(SURAJ_BACK), SURAJ_W, SURAJ_H),
  await strip('suraj-idle', typing(SURAJ_FRONT.concat(SURAJ_LEGS[1])), SURAJ_W, SURAJ_H),
  await strip('suraj-sit-front', typing(SURAJ_SIT_FRONT), SURAJ_W, SURAJ_H),
  await strip('caitlin-down-right', walkPerson(CAIT_FRONT), SURAJ_W, SURAJ_H),
  await strip('caitlin-up-right', walkPerson(CAIT_BACK), SURAJ_W, SURAJ_H),
  await strip('caitlin-idle', typing(CAIT_FRONT.concat(SURAJ_LEGS[1])), SURAJ_W, SURAJ_H),
]

if (process.argv.includes('--sheet')) {
  const path = process.argv[process.argv.indexOf('--sheet') + 1]
  const Z = 6
  const comps = []
  for (const [i, s] of written.entries()) {
    comps.push({
      input: await sharp(s.out).resize({ width: s.w * Z, kernel: 'nearest' }).toBuffer(),
      left: 8,
      top: 8 + written.slice(0, i).reduce((a, p) => a + p.fh * Z + 8, 0),
    })
  }
  await sharp({
    create: {
      width: Math.max(...written.map((s) => s.w)) * Z + 16,
      height: written.reduce((a, p) => a + p.fh * Z + 8, 0) + 8,
      channels: 4,
      background: '#6b5340',
    },
  })
    .composite(comps)
    .png()
    .toFile(path)
  console.log(`${path}`)
}
