---
title: Everything this renderer supports
date: 2026-11-27
summary: Not a post. The format reference, kept as a file so it can't go stale.
tags: [meta]
---

Filenames starting with `_` never build — no page, no listing, no sitemap
entry. So this file is the format reference, and it stays correct because it's
real input to the real renderer. Copy it, rename it, delete everything below.

The front matter above is the whole grammar: `key: value`, plus `[a, b]` lists
and `true`/`false`. A missing `title`, `date` or `summary` fails the build on
purpose, rather than shipping a broken card to the index.

# Headings

`#` renders as an `<h2>`, `##` as an `<h3>`, and so on down to `<h6>`. The page
owns the `<h1>`, so a post can't accidentally emit a second one. Every heading
gets an id, so `/writing/this-post/#headings` links straight here.

# Text

A paragraph is any run of lines with no blank line in it; the lines get joined,
so hard-wrapping at eighty columns in the editor is free. Emphasis is
**asterisks** for bold and *single asterisks* for italics. Underscores are left
alone, because `stripe_payment_id` is not italics.

Inline `code` uses backticks, and markdown inside a code span stays literal.
[Internal links](/projects/) stay in the tab.
[External ones](https://github.com/surajgopal85) open a new one and get
`rel="noopener noreferrer"` automatically. A link target that isn't an http,
mailto, `/` or `#` URL renders as plain text instead of a live href.

# Lists

- A list item can hard-wrap onto the next line, the way a paragraph does;
  it stays one item. What it can't do is nest.
- A run of bullets is one list. The run ends at the first line that isn't one,
  so a bullet list and a numbered list below it stay two separate lists.

1. Numbered lists work the same way.
2. The numbers you type are ignored; the browser counts.

# Code

Fenced blocks keep their whitespace and take a language for styling:

```python
def match_by_spi(ledger, stripe):
    """Pair payment IDs across both sides. Identity only, no amounts."""
    by_id = {record.stripe_payment_id: record for record in stripe}
    return [(entry, by_id[entry.stripe_payment_id]) for entry in ledger
            if entry.stripe_payment_id in by_id]
```

# Quotes and rules

> A block quote is a run of `>` lines. Three or more dashes on their own line
> is a horizontal rule.

---

Raw HTML is escaped rather than rendered, so `<script>` in a post is text. The
renderer is deliberately a subset: see the comment at the top of
`lib/markdown.ts` for what it does and doesn't do, and `lib/markdown.test.ts`
for the executable version of this file.
