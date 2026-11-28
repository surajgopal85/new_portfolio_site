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
| `npm run iso-sprites` | draw the room's sprites in code |
| `npm run iso -- out.png` | render the room's geometry, flag anything outside the frame |
| `npm run shot` | screenshot any route, any width, either landing version |
| `npm run audit` | keyboard path, focus rings, reduced motion, phone width |
| `npm run og` | regenerate the social card from the live scene |
| `npm test` | the character state machine and the Markdown renderer |
| `npm run pixelate -- <photo> [options]` | photo → pixel-art base |
| `npm run deploy` | build, upload to S3, invalidate CloudFront |

There is no `npm start`. `next start` runs a Next server, and this site doesn't
have one — it's a static export. `npm run preview` is the equivalent.

## Navigation map

| Object in the scene | Opens |
|---|---|
| Monitor | `/projects/` — the overworld |
| Laptop | `/writing/` — posts |
| Piano | `/about/` — fun / about corner |
| Cork board | `/now/` — what I'm studying |
| Door | `/contact/` |

The map lives in one place: `hotspots` in `content/site.ts`. The scene and the
static fallback both render from it, so the two can't drift apart.

## The camera

You stand in the doorway and look down across the room on the diagonal —
windows ahead, desk right, piano corner left. `photos/raw/office/IMG_0730` is
that exact view, and the projection is built to match it.

2:1 dimetric, not true 30-degree isometric. 2:1 keeps every edge on whole
pixels — two across for one down — where true isometric puts diagonals on
irrational slopes and they come out furry at this size.

Everything is orthographic: no vanishing point, nothing scales with depth.
Painter's order is the sum of a thing's grid coordinates, which is correct no
matter how tall anything is.

Stardew Valley sets the density and texture; the drawing rules are in
`docs/art-direction.md`.

## Two landing experiences, on purpose

Both versions are in the exported HTML. A blocking script in `<head>`
(`MODE_SCRIPT` in `lib/capability.ts`) picks one **before first paint** by
checking reduced-motion, save-data, device memory and core count, plus any
stored override; CSS hides the other. With JavaScript off, no attribute is set
and the plain version is what shows — the correct default, not a failure.

Deciding this in a React effect instead would make every visitor watch the
plain page paint and then get replaced. It has to happen before paint.

This is the lesson from felixrieseberg.com: the weak-device path has to be a
deliberate design, not a fallback that looks broken.

## Layout

```
app/                     routes (static export, trailing slashes)
  page.tsx               landing: scene or static fallback
  projects/              overworld map + [slug] case studies
  writing/               post index + [slug] posts
  now/                   the cork board — what I'm studying
components/scene/        the room
  iso.ts                 the projection, and every thing in the room with
                         its footprint in tiles and its height in pixels
  IsoScene.tsx           painter-ordered renderer, desk animation, hotspots
content/site.ts          all non-project copy + the nav map
content/projects.ts      the project list and case-study text
content/studying.ts      what's pinned to the cork board
content/posts/*.md       the posts — one file each, front matter on top
lib/posts.ts             reads content/posts at build time
lib/markdown.ts          the Markdown subset the posts use
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
5. Set its `src` in `components/scene/iso.ts`.

The room's own props aren't traced from photos at all — they're drawn in code
by `scripts/iso-sprites.mjs`, because in isometric nearly every prop is a box
with three shaded faces and one primitive draws most of them. The photos are
reference for layout, contents and colour. The characters are the exception:
they're hand-drawn, and `docs/characters.md` says at what size.

The scene is 384×216 art pixels. Every color must come from
`scripts/palette.json` — 21 colors in four groups (`room`, `outside`, `fur`,
`skin`). `docs/characters.md` maps each character's markings onto that ramp.

The pipeline is a color and proportion study, not a sprite generator. It only
produces something traceable when the subject's outline is already high
contrast against its background in the photo; otherwise subject and background
quantize to the same colors and the silhouette dissolves.

## Writing

Posts are Markdown files in `content/posts/`. There is no CMS and no database
because there is no server: this is a static export, so git is the CMS. Write a
file, commit it, deploy, it's live.

```bash
cp content/posts/_example.md content/posts/my-post.md   # the format reference
npm run dev                                             # read it at /writing/
```

The filename is the URL. Front matter needs `title`, `date` (YYYY-MM-DD) and
`summary`; a missing one fails the build rather than shipping a broken card.
`draft: true` keeps a post off the built site entirely — no page, no listing,
no sitemap entry — and so does a filename starting with `_`, which is why
`_example.md` can stay in the directory as the living format reference.

`lib/markdown.ts` is a deliberate subset: headings, paragraphs, lists, links,
emphasis, code, quotes, rules. Raw HTML in a post is escaped rather than passed
through. Everything goes through `renderMarkdown`, so swapping in a real parser
later is one file.

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

## Hosting it somewhere temporarily

The deploy above is the decided path — real AWS practice is the point, and
`infra/bootstrap.sh` already exists. Vercel is the shortcut if the site needs
to be in front of people before the domain and certificate are sorted.

Nothing in the repo has to change for it. Vercel detects Next.js, runs
`next build`, sees `output: 'export'` in `next.config.ts` and serves `out/`
statically; `trailingSlash: true` keeps the URLs identical to the CloudFront
ones, so links written now survive the move.

```bash
npx vercel            # preview deploy, throwaway URL
npx vercel --prod     # the project's stable URL
```

Set `NEXT_PUBLIC_SITE_URL` to the deployed origin in the Vercel project's
environment variables. Without it, `site.url` falls back to
`https://example.com` and every canonical URL, the sitemap and the OG image
point at the wrong host.

Two hosts is a temporary state, not a setup. Pick one before the domain
is attached, or the deploy you forget about is the one search engines index.
