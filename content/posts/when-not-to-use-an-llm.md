---
title: The best thing I did with an LLM was keep it out of the way
date: 2026-11-27
summary: Reconciling payments taught me that the interesting architectural question isn't where to put the model. It's where arithmetic already has the answer.
tags: [architecture, llm, payments]
---

I'm building a reconciliation app. It compares a nonprofit's internal payment ledger against Stripe, finds everything that disagrees, and works out what each regional affiliate is owed at the end of a period. It's the sort of problem that currently lives in a spreadsheet, and the sort of problem that, in 2026, everyone's first instinct is to point a model at.

That instinct is wrong, and being precise about *why* it's wrong turned out to be the most useful design work I've done this year.

# Most mismatches are not ambiguous

Here's what reconciliation actually looks like once you open the two reports. A Stripe payment ID appears on both sides. The amounts tie out once you subtract Stripe's fee. Done. No judgment required, no context needed, nothing to explain. This is the overwhelming majority of rows, and it is arithmetic.

A minority are genuinely hard. A webhook that never arrived, so our side has no record of a payment Stripe definitely took. A refund that didn't propagate. A payment that straddles a period boundary and gets counted in the wrong month. These need a judgment call *and an explanation*, which is a different kind of work from matching.

Sending everything to a model gets you three things you didn't want. You pay per call on rows a subtraction would have settled. You add latency that scales with total volume instead of with difficulty. And worst, you invite a confident wrong answer on a case where the right answer was never in doubt.

So the pipeline is fixed in order, and the order is the whole design:

1. Deterministic rules match payment IDs and verify each matched pair.
2. Only the leftovers — the cases the rules flagged but couldn't settle — reach the model, which returns a root cause from a fixed list, the record IDs it reasoned from, and a proposed fix.
3. Every proposal goes to a human before anything happens.

Cost and latency now scale with the number of *ambiguous* cases, not with volume. Every mechanical match is reproducible with no model in the path, which means I can re-run last quarter and get the same answer. And the model is doing the only thing it's uniquely good at here: explaining a weird case in terms a person can check.

# Aggregates are where errors go to hide

The second decision was smaller and I think it generalizes further.

The original spec for the parity rule said something like "ensure the dollars collected in Stripe match the transactions per region, less fees." Read one way, that means compare each matched pair field by field. Read another way, it means compare per-region sums. I spent a while not noticing those were different, which is its own lesson about specs.

They're very different. Two rows in the same region, one off by plus fifteen cents and one off by minus fifteen, sum to zero. The region ties out. Both rows are still wrong. An aggregate check would report a clean bill of health on data that is, in fact, broken in two places.

It gets worse. Even when an aggregate check *does* fire, all it can tell you is that a region disagrees. It can't say which row caused it, which means it produces no evidence — nothing to diagnose with and nothing to hand a human who has to approve a payout. The rule after it needs to list every discrepancy, and the rule after *that* has to justify a dollar figure. Both of them need rows.

So parity is checked row by row, one mismatch record per disagreeing field, with the signed delta. A row that's wrong on both the amount and the fee produces two mismatches rather than one, because an amount drift and a fee drift have different causes — a stale price versus a stale fee assumption — and I want them diagnosed separately.

Aggregation happens exactly once, at the end, over rows that have already been verified.

# What I'd watch out for

The argument for this architecture is that the model only sees the hard cases. That is also, precisely, the condition under which nobody notices it's wrong. There's no arithmetic sitting behind it to catch the error, and by construction these are the cases where a human doesn't already know the answer.

Which means the deterministic-first design buys me a real cost and auditability win, and hands me a harder evaluation problem than I'd have had otherwise. "When should a model not be in the loop" is the easy half of the question. Proving it's right on the cases that do reach it is the half that takes work, and it's the next thing I'm building.

The approval gate isn't a safety feature bolted onto the side of this app. It's the product.
