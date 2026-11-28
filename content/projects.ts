/**
 * The project list. Quality bar: every project gets a case study with the
 * problem, the key decision, the result, and what you'd change.
 *
 * `visibility: 'private'` keeps a project off the site entirely — use it for
 * anything built for an employer or client that you haven't cleared yet.
 *
 * Everything written here is checked against the repos themselves, not against
 * memory or a résumé line. If a claim can't be traced to code, it doesn't ship.
 */
export type Project = {
  slug: string
  title: string
  /** One-line pitch. Shown on the overworld node. */
  pitch: string
  year: number
  stack: readonly string[]
  visibility: 'public' | 'private'
  /**
   * Whether the thing is finished. `building` is a feature, not an apology: a
   * project in progress is the only kind a visitor can watch you think about.
   */
  status: 'shipped' | 'building'
  links?: { readonly label: string; readonly href: string }[]
  /** The case study. Four sections, in this order, always. */
  study?: {
    problem: string
    decision: string
    result: string
    nextTime: string
  }
  /** Position on the overworld map, in grid cells. See app/projects/page.tsx. */
  node: { x: number; y: number }
}

// Ordered oldest first, which is also the order the dotted path walks the map.
export const projects: readonly Project[] = [
  {
    slug: 'talktor',
    title: 'Talktor',
    pitch:
      'A medical interpreter that transcribes Spanish speech, translates it, and checks the drug names against a real drug database before anyone trusts them.',
    year: 2025,
    stack: [
      'Python',
      'FastAPI',
      'Whisper',
      'PyTorch',
      'Transformers',
      'WebSocket',
      'SQLAlchemy',
      'React',
      'TypeScript',
    ],
    visibility: 'public',
    status: 'shipped',
    // Clear of the pond painted into the terrain sprite. The dotted path is
    // drawn between consecutive nodes, so these two sit level with each other.
    node: { x: 1, y: 1 },
    links: [{ label: 'Source on GitHub', href: 'https://github.com/surajgopal85/talktor' }],
    study: {
      problem:
        'A Spanish-speaking patient and an English-speaking clinician have to get through an appointment, and a professional interpreter is not always in the building. A general-purpose translator gets the conversational half roughly right and the clinical half dangerously wrong: medication names come back as near-homophones, dosages drift, and specialty vocabulary has no equivalent in the training data. The failure is quiet, which is the problem. Nobody in the room can tell a good translation from a confident bad one.',
      decision:
        'Do not hand the whole conversation to one model and hope. The pipeline is split so that each stage can be checked: Whisper (the base model, running locally) transcribes, a general translator handles the sentence, and a separate pass over the original Spanish extracts medical entities using a biomedical Spanish RoBERTa, PlanTL-GOB-ES/roberta-base-biomedical-clinical-es. Candidate medications are then validated against RxNorm and openFDA rather than against the model that proposed them, so a drug name either resolves to a real identifier or gets flagged. Embeddings are cached on disk, because the same twenty terms recur all appointment long and recomputing them is pure latency. The alternative, prompting one large model for transcription, translation and clinical judgment at once, was rejected for a specific reason: it produced no evidence. There was nothing to show a clinician except the answer.',
      result:
        'The system runs end to end. Audio streams over a WebSocket into a rolling ten-second buffer with voice-activity detection, transcription and translation come back per utterance, and the interface keeps a running conversation summary that feeds the next extraction. An OB/GYN specialty engine routes that specialty to its own vocabulary and extraction rules, which was the first proof that the specialty layer could be added without touching the core. Every extraction attempt, its candidates and its outcome are persisted to the database. It is a beta, with synthetic and self-recorded conversations as its only test traffic, and no clinical validation behind it.',
      nextTime:
        'Two things, both honest. First, the latency story: the pipeline is serial where it should be pipelined. Transcription waits for a complete buffer, translation is a blocking HTTP call, and nothing produces interim results, so the user watches a spinner through stages that could be overlapping. There is no endpointing beyond the buffer, no barge-in, no request timeouts, no vendor failover, and no instrumentation to tell me which stage actually costs the most. If I rebuilt it under a real latency budget, streaming interim transcripts would come first and everything else second. Second, the naming: the database of extraction attempts and feedback is infrastructure for reinforcement learning, not reinforcement learning. The training loop was never closed. Saying otherwise would be the kind of claim this case study exists to avoid.',
    },
  },
  {
    slug: 'recon-desk',
    title: 'Recon Desk',
    pitch:
      'Reconciles an internal payment ledger against Stripe, diagnoses what disagrees, and never lets a model move money on its own.',
    year: 2026,
    stack: ['Python', 'Stripe Connect', 'Postgres', 'pytest', 'mypy', 'ruff', 'GitHub Actions'],
    visibility: 'public',
    status: 'building',
    node: { x: 3, y: 1 },
    links: [{ label: 'Source on GitHub', href: 'https://github.com/surajgopal85/recon-desk' }],
    study: {
      problem:
        'A nonprofit runs regional payments through Stripe Connect: the parent account is ours, regional affiliates hold the child accounts, and a fixed share of fees comes back to the backend after Stripe takes its cut. Some regions decline a child account, so the parent holds their funds and settles a lump sum at period end. At the end of every period somebody has to prove two numbers are right, what we received and what we owe each affiliate, and the usual instrument for that is a spreadsheet. A spreadsheet reconciles in aggregate, and aggregates hide offsetting errors: two rows in the same region off by plus and minus fifteen cents sum to zero, the region ties out, and both rows are still wrong. Worse, an aggregate check can say that a region disagrees but never which row caused it, so it produces nothing you could hand to a human.',
      decision:
        'Deterministic rules first, and the model only where arithmetic genuinely runs out. The pipeline is fixed in order: match Stripe payment IDs across both reports, verify each matched pair field by field, list every disagreement, then propose dollars owed per region with the evidence behind each number. Rules one through three have no model in them at all, so every mechanical match is reproducible and auditable. Only the ambiguous leftovers, a missing webhook, a refund that never propagated, a payment straddling a period boundary, reach an LLM, which returns a root cause from a fixed list, the record IDs it reasoned from, and a proposed fix. Cost and latency then scale with the number of hard cases rather than with total volume. The hard rule on top of all of it: nothing the engine proposes ever executes. The human approval gate is the product, not a safety feature bolted to the side of it.',
      result:
        'In progress, and the parts that exist are the parts the rest depends on. Rules one through three are implemented and tested: set-matching on Stripe payment IDs, row-level parity on amount and fee with one mismatch record per disagreeing field, and a unified discrepancy type that rules one and two both report into. An amount drift and a fee drift are emitted separately on purpose, because a stale price and a stale fee assumption have different root causes and want different diagnoses. CI runs ruff, mypy and pytest on every push. Each significant choice is written down as a numbered decision record in the repo before the code lands, which is the part of this build I would keep regardless of what it is reconciling. Rule four, the money question, and the web app are next. Every payment ID, region and amount in the repo is invented; the domain is modeled on a real Connect setup but none of the data is real.',
      nextTime:
        "Three open questions I would rather state than paper over. The fee split percentage is still undecided, which rule four cannot be finished without. Duplicate payment IDs within one side of the reconciliation are currently assumed away rather than handled, and real exports will eventually contain them. And the LLM layer needs an eval set before it is allowed near an ambiguous case in anger: the argument for this architecture is that the model only gets the hard problems, which is also precisely the condition under which nobody notices it is wrong. Asking when a model should not be in the loop is the easy half. Proving it is right on the cases that do reach it is the half that takes work.",
    },
  },
]

export const publicProjects = projects.filter((p) => p.visibility === 'public')
