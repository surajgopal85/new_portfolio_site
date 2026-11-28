---
title: What I got wrong about latency in a voice pipeline
date: 2026-11-28
summary: Talktor transcribes, translates and extracts medical terms. Every stage waits for the one before it, and that was a choice I didn't know I was making.
tags: [latency, voice, ml]
draft: true
---

This one is a draft — `draft: true` in the front matter above keeps it off the
built site entirely. Delete that line to publish.

The skeleton below is the honest gap analysis, with the facts pulled from the
repo rather than from memory. The takes are yours to write.

# The pipeline as it actually runs

Audio arrives over a WebSocket into a rolling ten-second buffer with voice
activity detection. When the buffer closes, Whisper's `base` model transcribes
it locally. The transcript goes out to a translator over a blocking HTTP call.
Separately, a biomedical Spanish RoBERTa runs over the original Spanish to pull
out medical entities, and candidate medication names get validated against
RxNorm and openFDA before anyone sees them.

Every one of those arrows is serial. Nothing starts before the stage ahead of
it finishes.

# The four stalls

TODO(suraj): for each of these, say what the user is actually experiencing
during the wait. That's the part a reader can't get from the code.

1. **Buffering.** Nothing happens until the buffer closes, so the ceiling on responsiveness is set before any model runs.
2. **Transcription.** `base` was chosen for speed on a laptop, not accuracy. Say what you'd pick now, and under what budget.
3. **Translation.** A blocking HTTP round trip, with no timeout and no second vendor behind it.
4. **Extraction.** Runs after translation rather than beside it, even though it reads the Spanish and doesn't depend on the English at all.

# What I'd change, in order of impact

TODO(suraj): the order matters more than the list. Interim transcripts first?
Or parallelising extraction, which is the one change that's nearly free?

# The thing I'd say differently

TODO(suraj): the extraction-attempt database is infrastructure for
reinforcement learning. The training loop was never closed. Write the honest
version of that claim once, here, and reuse the sentence everywhere.
