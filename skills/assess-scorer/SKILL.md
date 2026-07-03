---
name: assess-scorer
description: >
  Apply the active scoring rubric to an assessment org: six dimension scores
  with layer-appropriate confidence intervals, readiness band, layer exit
  checks, and the completed-assessment counter that triggers rubric review
  at 10. Trigger: /assess-scorer org: ORG-NNN
---

# assess-scorer — rubric application

**Reads:** org beliefs + evidence, `rubric/scoring-rubric-v1.yaml` (resolve
via manifest `scoring.rubric` — never hardcode the version), manifest layers.
**Writes:** scores block into org `beliefs.yaml` and counters in manifest —
both via assess-state.

## Procedure

1. **Determine layer reached.** Highest layer with `layer_status: complete`.
   This sets the CI half-width per the rubric's `confidence_intervals` table
   (L4 additionally tightens team_capability and leadership_alignment).

   Then check the org's vertical archetype for a `rubric_overrides` block
   (e.g. pharma-lifesciences raises governance_security weight for GxP) and
   apply it on top of the base rubric. Note applied overrides in the scores
   block (`overrides_applied:`).

2. **Score each dimension 0–5** against the rubric anchors, citing evidence:
   - Every score MUST list the belief/evidence entries it rests on.
   - Enforce `scoring_evidence_rule`: `inferred`/`harvested`-only claims cannot
     lift a dimension above L0-interval certainty; self-reports contradicted
     by observables score from the observable and the tension is recorded.
   - A dimension with insufficient evidence gets `score: null, reason: ...` —
     never a guessed number.

3. **Aggregate** per rubric (`weighted_mean`), attach the readiness band, and
   write the block:
   ```yaml
   scores:
     rubric_version: 1
     layer_reached: L2
     dimensions:
       data_accessibility: {score: 2, ci: 1.0, evidence: [GFR-L3-001-answer, ...]}
       ...
     aggregate: {score: 2.3, ci: 1.0, band: emerging}
     scored_at: <date>
   ```

4. **Counter.** If this org just completed L2 or higher for the first time,
   call `assess-state increment-counter`. When the counter hits
   `rubric_review_due_after` (10), assess-state flags review — relay that
   loudly: rubric v1 is provisional by design; the review compares scored
   predictions against what the 10 engagements actually revealed, re-anchors
   levels, re-weights dimensions, and cuts rubric v2.

5. **Report back:** dimension table with intervals, band, the 3 weakest
   evidence chains (what one more question would most tighten), and whether
   any layer exit is within a single session's reach.

## Refusals
- No scoring at L0 beyond a silhouette (all-dimension CI 2.0, clearly labeled hypothesis).
- No aggregate without intervals. Fidelity theater is the failure mode this skill exists to prevent.
