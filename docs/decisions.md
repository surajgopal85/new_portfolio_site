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
