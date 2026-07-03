# assess — outside-in AI readiness assessment

A Claude Code plugin by [Atomic 47 Labs](https://github.com/Atomic-47-Labs).

Traditional readiness assessments hand an organization a blank questionnaire.
This one works **outside-in**: it builds a probabilistic model of the org's
systems *before asking anything* (archetype priors + public signals like MX
records, SPF includes, job postings), then spends every question confirming,
denying, or correcting an inference — layering fidelity until the budget or
the respondent's patience runs out. Recognition beats recall: "you're on
QuickBooks, right?" takes 2 seconds; "list your finance systems" produces gaps.

## Install

```
/plugin marketplace add Atomic-47-Labs/assess-plugin
/plugin install assess@atomic47-assess
```

## Skills

| Skill | What it does |
|---|---|
| `/assess-state` | Facility spine: init, validate, new-org, belief updates with provenance, append-only evidence ledger. Single writer of all state. |
| `/assess-harvester` | L0 quick pass — fixed signal checklist against a known domain: DNS/MX, SPF/DKIM, website fingerprint, job postings. Public sources only, all disclosed. |
| `/assess-researcher` | L0 deep pass — starts from seed info as scant as a company name: resolves identity, classifies the vertical, then runs a recursive expansion loop where every finding spawns the next queries, until the budget is spent or the trail runs dry. Writes a research dossier per org. |
| `/assess-inquirer` | Chat-style adaptive question engine: one inference-anchored question at a time, re-ranked after every answer, hard time budgets. |
| `/assess-scorer` | Six readiness dimensions scored 0–5 with confidence intervals that narrow by fidelity layer. Flags rubric recalibration after 10 assessments. |
| `/assess-reporter` | L0 silhouette brief (door-opener), readiness report, opportunity map. Every claim carries provenance; scores never appear without intervals. |
| `/assess-orchestrator` | Conductor: frontier layer, what blocks exit, who to talk to next. One recommendation at a time. |

## Fidelity layers

| Layer | Name | Cost to the org |
|---|---|---|
| L0 | Silhouette | Zero — archetype prior + harvested public signals |
| L1 | Inventory | ~10–15 confirming questions |
| L2 | Workflow | Chat walkthroughs with hotspot owners |
| L3 | Data & integration | Technical respondent |
| L4 | Human | Per-role: skills, appetite, current (incl. shadow) AI usage |

Every output states the layer it was rendered at. An L0 silhouette is
labeled a hypothesis — fidelity theater is the failure mode the scorer
exists to prevent.

## Getting started

```
/assess-state init        # scaffolds assess-state/ at your project root from templates/
# author or adapt a vertical archetype (see templates/archetype-template.yaml)
/assess-state new-org     # intake a real organization
/assess-harvester org: ORG-001
/assess-reporter org: ORG-001 silhouette
/assess-inquirer org: ORG-001 budget: standard
```

## What's included vs. not

The plugin ships the **engine**: skills, scoring rubric v1, and schema
templates for building your own vertical archetypes, role files, and
question banks (`templates/`).

It does **not** ship pre-built vertical archetypes (system priors, workflow
hotspots, question banks for specific industries). Archetype quality is
where assessment value concentrates — build yours for the verticals you
serve, and feed every completed assessment back into your priors. The
templates document the full schema.

## Design principles

- **Every question states its inference.** Confirm/deny/correct, never blank-slate recall. Wrong guesses are still profitable — they collapse branches.
- **Evidence first.** Append-only ledger; beliefs are a materialized view. Every fact carries provenance (inferred → harvested → reported → confirmed) and confidence.
- **Contradictions are findings.** Never averaged — they become tension probes, and the disagreement itself is reported (tool drift, shadow IT, aspirational self-report).
- **Honest fidelity.** Confidence intervals by layer, ±2.0 at L0 narrowing to ±0.5 at L3/L4. No score without its interval.
- **Ethics.** Harvest public sources only, and disclose every source consulted in the report appendix.

## License

MIT
