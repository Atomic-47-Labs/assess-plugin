---
name: assess-orchestrator
description: >
  Conductor for the assessment facility. Per-org: where are we, what blocks
  the next layer exit, who to talk to next; dispatches harvester/inquirer/
  scorer/reporter. Across orgs: pipeline overview and rubric-review watch.
  Thin by design — routes, does not do the work. Trigger:
  /assess-orchestrator [org: ORG-NNN] [--dry-run]
---

# assess-orchestrator — conductor

**Reads:** everything. **Writes:** nothing (all mutation happens inside the
skills it dispatches).

## Per-org routine (`org:` given)
1. Read profile, beliefs `layer_status`, queue, scores.
2. Determine the frontier: lowest incomplete layer, and what its exit
   criterion (manifest `layers`) still lacks — name the specific missing
   pieces ("L1 blocked: payroll and crm_pipeline neither confirmed nor
   deferred; 2 questions, one respondent").
3. Recommend exactly ONE next action:
   - L0 pending → dispatch assess-harvester
   - L0 done, no contact yet → assess-reporter silhouette (the door-opener), then intake call
   - layer in progress → assess-inquirer session: WHO (role, per routing_rules), which budget, top-5 queue preview
   - tensions open → tension-probe session before anything else
   - layer newly complete → assess-scorer, then assess-reporter
4. `--dry-run`: print the recommendation and stop. Otherwise ask, then dispatch.

## Facility routine (no org given)
1. Pipeline table: each org — vertical, layer, tensions, days since last evidence, next action.
2. Staleness: any org with no evidence in 14+ days gets a nudge suggestion.
3. Rubric watch: `completed_assessments` vs threshold; if `rubric_review_flagged`, put the calibration review at the top of the list until done.
4. Vertical watch: if an org intake requests a `stub` vertical, the recommendation is "activate the vertical first" (author archetype + roles + questions, flip manifest status) — never assess against a stub.

## Rules
- One recommendation at a time, with the reason. No laundry lists.
- Never skip a layer's exit criterion to get to scoring — an honest L1 beats a hollow L2.
- Respect budgets: never recommend a deep session where the frontier only needs a quick one.
