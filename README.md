# The office

A portfolio site whose landing page is a pixel-art version of my home office.
The objects in the room are the navigation. Projects live on an overworld map,
one node per case study.

SMB3 is the influence — palette, chunky blocks, map-style level nodes — but
every pixel here is drawn from scratch. No Nintendo sprites, no Nintendo music.

## Commands

| | |
|---|---|
| `npm run dev` | local dev at http://localhost:3000 |
| `npm run build` | static export to `out/` |
| `npm run preview` | build, then serve `out/` — the actual static files CloudFront will serve |
| `npm run lint` | typecheck |
| `npm run pixelate -- <photo> [options]` | photo → pixel-art base |
| `npm run deploy` | build, upload to S3, invalidate CloudFront |

There is no `npm start`. `next start` runs a Next server, and this site doesn't
have one — it's a static export. `npm run preview` is the equivalent.

## Navigation map

| Object in the scene | Opens |
|---|---|
| Monitor | `/projects/` — the overworld |
| Piano | `/about/` — fun / about corner |
| Door | `/contact/` |

The map lives in one place: `hotspots` in `content/site.ts`. The scene and the
static fallback both render from it, so the two can't drift apart.

## Two landing experiences, on purpose

The server always renders the **static** version (`components/StaticFallback.tsx`).
That's what's in the exported HTML, what a crawler indexes, what a screen reader
reads, and what a slow phone gets. After mount, `lib/capability.ts` upgrades to
the animated scene only if the device looks capable and the visitor hasn't asked
for reduced motion. Either version can be forced with a visible button, and the
choice sticks in `localStorage`.

This is the lesson from felixrieseberg.com: the weak-device path has to be a
deliberate design, not a fallback that looks broken.

## Layout

```
app/                     routes (static export, trailing slashes)
  page.tsx               landing: scene or static fallback
  projects/              overworld map + [slug] case studies
components/scene/        the room
  layers.ts              layer manifest — swap `src: null` for real art
  Scene.tsx              layer stack, parallax, desk animation, hotspots
content/site.ts          all non-project copy + the nav map
content/projects.ts      the project list and case-study text
lib/capability.ts        which experience to render
lib/characters.ts        character state machine — MINE to write
lib/piano.ts             Web Audio, off by default
scripts/pixelate.mjs     photo → downscale → 16-color palette
scripts/palette.json     the palette, mirrored in app/globals.css
infra/                   CloudFormation + deploy scripts
photos/raw/              source photos (gitignored)
public/art/              exported pixel art
```

## Art pipeline

1. Shoot the photo (see `photos/README.md` for the shot list).
2. ```bash
   # a room, against the full palette
   npm run pixelate -- photos/raw/office.jpg --width 384 --dither --preview 4
   # one character, cropped out of a photo, fur tones only
   npm run pixelate -- photos/raw/peanut/IMG_0165.jpeg \
     --crop 0.04,0.28,0.99,0.82 --width 64 --group fur --preview 8
   ```
   `--crop` takes fractions of the photo (left,top,right,bottom) so a sprite
   doesn't spend most of its pixels on the room behind the subject.
   `--group` restricts quantization to one slice of the palette — a cat matched
   against all 21 colors picks up sky blue in its shadows.
3. Open the result in Aseprite or Piskel and fix it by hand. A quantized photo
   reads as a quantized photo until the silhouettes are redrawn — that part is
   not automatable.
4. Export one transparent PNG per layer at 384×216 into `public/art/office/`.
5. Set its `src` in `components/scene/layers.ts`. The CSS placeholder for that
   layer disappears on its own.

The scene is 384×216 art pixels. Every color must come from
`scripts/palette.json` — 21 colors in four groups (`room`, `outside`, `fur`,
`skin`). `docs/characters.md` maps each character's markings onto that ramp.

The pipeline is a color and proportion study, not a sprite generator. It only
produces something traceable when the subject's outline is already high
contrast against its background in the photo; otherwise subject and background
quantize to the same colors and the silhouette dissolves.

## Deploy

```bash
# once
bash infra/bootstrap.sh <bucket-name>                     # CloudFront URL only
bash infra/bootstrap.sh <bucket-name> example.com <cert-arn-us-east-1> <zone-id>
cp infra/.env.example infra/.env                          # paste the outputs

# every time
npm run deploy
```

Private S3 bucket, CloudFront with origin access control, and a CloudFront
Function that rewrites `/projects/` to `/projects/index.html` — S3 REST origins
don't serve directory indexes. `_next/static/*` is immutable for a year;
everything else revalidates and gets invalidated on deploy.

## Quality bar

- Every project gets a case study: problem, key decision, result, what I'd change.
  The route refuses to pretend otherwise — no `study`, no sections.
- First paint feels instant. No webfonts, no third-party scripts, no images on
  the critical path.
- Works on a phone.

## Phases

1. **Foundation** — repo, deploy, static landing page. ✅
2. **Scene** — real art, character state machine, piano.
3. **Projects** — overworld map and case studies.
4. **Polish** — performance, accessibility, `public/og.png`, launch.
