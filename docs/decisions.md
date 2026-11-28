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

## Shipping the first two projects

- **Two projects, not five** — Talktor and Recon Desk. Three to five was the
  original target; two real case studies beat five thin ones, and the list is
  generated from `content/projects.ts`, so adding the third is one object.
- **Link work in progress, and say so** — Recon Desk is mid-build. It carries a
  `status: 'building'` flag that shows as "In progress" on the map and on the
  case study. A visitor who can watch you think is worth more than a visitor
  who only sees finished things; what isn't allowed is pretending.
- **Every claim traced to the repo** — both case studies were written against
  the code, not the résumé. Talktor's "reinforcement learning" is named as what
  it is: a database of extraction attempts and feedback, with the training loop
  never closed. The one thing a case study cannot survive is a claim that
  doesn't check out.

## Writing

- **Markdown in the repo, not a CMS** — the site is a static export with no
  server, so a CMS would mean standing up a backend to hold six paragraphs. Git
  is the CMS: a post is a file, review is a diff, publishing is a deploy.
- **A hand-written Markdown subset** — `lib/markdown.ts`, about 150 lines, with
  a test file next to it. The alternative was a dependency, and the posts need
  eight constructs. Every caller goes through `renderMarkdown`, so the day the
  subset stops being enough it's one file to replace.
- **The laptop is the hotspot** — the monitor is already Projects, and the
  laptop beside it is where the writing actually happens. `/writing/`, not
  `/blog/`: the point is to show thinking about current problems, and "blog"
  undersells that.
- **Drafts live in the repo and don't build** — `draft: true` or a leading
  underscore. A half-written post should be reviewable on a branch without
  being publishable by accident.

## Open

- [ ] Launch date — set deliberately, not guessed. Work, freelance and tutoring
      all compete for the same hours.
- [ ] Domain, and the ACM certificate in us-east-1.
- [x] The project list — Talktor and Recon Desk, both public, both personal
      repos, so no clearance needed. The next one to add is the first one built
      for someone else, and that one does need the check.
- [ ] Hosting, decided twice. The settled decision above is S3 + CloudFront,
      because real AWS practice is the point; `infra/bootstrap.sh` already
      exists. Vercel is on the table as a temporary host to get the site in
      front of people sooner. Pick one deliberately — two deploy paths is the
      thing to avoid.
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
