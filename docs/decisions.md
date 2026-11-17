# Decisions

Settled before the build:

- **Framework** — Next.js, static export. Already known; no new learning curve
  in the way of the actual work.
- **Hosting** — S3 + CloudFront + Route 53. The point is real AWS practice I can
  explain in an interview, not the cheapest click-to-deploy.
- **Scene** — layered pixel art in CSS, not a game engine. A room with a handful
  of moving parts doesn't need a renderer.
- **Characters** — one small state machine per character on a random scheduler.
  I write this myself; it's the part that builds the most skill.
- **Piano** — Web Audio, off by default, with a visible toggle.
- **Fallback** — a clean static page for reduced motion, slow devices and screen
  readers. It's the server-rendered default, not an afterthought.

- **Camera** — a shallow top-down three-quarter angle, the Cult of the Lamb
  camera, drawn in SMB3 style. It's the only way the desk, piano and door —
  which are on three different walls — fit in one frame. SMB3's own overworld
  uses this camera, so the landing scene and the projects map agree.
- **Time of day** — night. The room photographs as a night room, and it makes
  the monitor the brightest thing in the scene, which is right: the monitor is
  the Projects link.
- **Four hotspots, not three** — the cork board opens `/now/`, because that's
  where Suraj actually pins what he's studying.
- **The ceiling fan stays, on probation.** It's above the camera, so what you
  see is its shadow turning on the floor, stepped rather than smooth. One line
  in `room.ts`; delete it if it reads as noise instead of life.
- **The monitor shows the overworld** by default — it's the Projects link, so
  the screen previews where it goes and the navigation explains itself without
  a label. It drifts to a terminal or to Kibou occasionally, because a screen
  that never changes reads as a painting of a screen.

## Open

- [ ] Launch date — set deliberately, not guessed. Work, freelance and tutoring
      all compete for the same hours.
- [ ] Domain, and the ACM certificate in us-east-1.
- [ ] The project list: 3–5, each with a one-line pitch and a visibility call.
      Anything built for an employer or client needs a clearance check first.
- [ ] First-5-seconds / first-30-seconds copy, in three sentences.
- [x] Caitlin's okay on being drawn in — yes, asked and confirmed.

## What to look at first

Both of these make a scene or a character the experience. Worth naming precisely
what works, because precise admiration is how you learn to ask sharper design
questions.

- **felixrieseberg.com** — the scene *is* the site: a night desk, a small TV, a
  VCR, labelled tapes. Weaker devices get a static version, which is why an
  ambitious site doesn't feel fragile.
- **kenji** — a small knight shows visitors around. The copy stays minimal and
  projects live on their own page.
