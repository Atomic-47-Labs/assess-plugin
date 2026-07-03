---
name: assess-reporter
description: >
  Render assessment outputs for an org: L0 silhouette brief (door-opener),
  readiness report with confidence intervals, and the opportunity map that
  maps confirmed workflows onto the vertical's opportunity anchors. Trigger:
  /assess-reporter org: ORG-NNN [silhouette | readiness | opportunity-map]
---

# assess-reporter — output rendering

**Reads:** org beliefs, evidence, scores; vertical archetype
`opportunity_anchors`; rubric bands.
**Writes:** `orgs/ORG-NNN/reports/` (the one path workers own directly).

## Honesty rules (apply to every artifact)
- The fidelity layer is stated in the title block. An L0 output is a **hypothesis** and says so.
- Every claim carries its provenance class inline where it matters: *(inferred)*, *(public signal)*, *(reported by role)*, *(confirmed)*.
- Scores never appear without intervals. Open tensions are findings, listed — never smoothed over.
- The harvest disclosure list (every public source consulted) appears in an appendix.

## Artifacts

### silhouette (L0) → `reports/silhouette-L0.md`
The door-opener. Structure:
1. **What we think your systems landscape looks like** — the belief graph as prose, hedged honestly, strongest signals first ("your mail runs through Google (public DNS); we'd guess the claim workbook is Excel (it almost always is)").
2. **What we're probably wrong about** — the low-confidence branches, framed as the interesting questions.
3. **The invitation** — "want to find out how right we are? ~15 minutes."
Voice: confident about the method, humble about the specifics. This artifact sells the L1 conversation.

### readiness (L1+) → `reports/readiness-L{n}.md`
1. Title block: org, vertical, layer reached, date, rubric version.
2. Confirmed system inventory (with owners where known).
3. Workflow findings per hotspot reached: system-of-record, the manual glue, elapsed-time costs (claim_prep days, reporting hours).
4. Dimension table: score ± CI, band, one-line evidence basis each.
5. Tensions & unknowns — open contradictions and what one more session would tighten.
6. Appendix: harvest disclosure, evidence counts, respondent roles (names only with permission).

### opportunity-map (L2+) → `reports/opportunity-map-L{n}.md`
For each of the vertical's `opportunity_anchors`, evaluate `requires:`
against current beliefs/scores → status:
- **ready now** — requirements met; expected payoff stated in the org's own numbers (e.g. "claim assembly: your 4 days/quarter → target < 1")
- **blocked** — name the exact blocker and the unblocking move ("blocked on time_tracking = none; timesheet_hygiene is the enabler, start there")
- **unknown** — which layer/question would resolve it
Order: ready-now first, by payoff. This section is the deliverable the org pays attention to — concrete workflows, their numbers, no generic AI advice.
