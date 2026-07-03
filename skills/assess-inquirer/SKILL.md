---
name: assess-inquirer
description: >
  Chat-style adaptive question engine for an assessment org. Runs a live
  conversational session (respondent in chat, or operator relaying on a
  call): one question at a time, anchored in a stated inference, re-ranking
  after every answer. Ingests answers via assess-state. Trigger:
  /assess-inquirer org: ORG-NNN [respondent: <name>] [budget: quick|standard|deep]
---

# assess-inquirer — chat-style adaptive questioning

The core interaction of the facility. Design decision: chat-style sessions
(not async forms) — L2 workflow fidelity requires conversational follow-up.

**Reads:** org beliefs, queue, role map, vertical question bank + roles file.
**Writes:** only via `assess-state log-evidence` / `update-belief` /
queue updates through assess-state.

## Budgets
| budget | questions | expected time | typical use |
|---|---|---|---|
| quick | ~8 | 5 min | triage, busy exec |
| standard | ~15 | 15 min | L1 completion, one respondent |
| deep | ~30 incl. walkthroughs | 45 min | L2 session with hotspot owner |

## Session procedure

1. **Setup.** Load beliefs + queue. Identify respondent's role(s) from
   `profile.yaml role_map`; filter queue to questions whose `routing` matches,
   plus any tension probes involving this respondent. If no respondent given,
   the operator is relaying — ask who's on the line first.

2. **Rank.** Score each candidate: `value = expected_information_gain / effort`.
   Information gain heuristics (v1 — deliberately simple, revisit with rubric v2):
   - belief still at `inferred` with prior < 0.7 → high gain
   - `tension: true` → highest gain (always ask first)
   - category `criticality: critical|high` → ×1.5
   - already `reported` with confidence ≥ 0.9 → skip
   - L2 walkthroughs only enter ranking once their hotspot's L1 dependencies are reported

3. **Ask — one at a time, in chat.** Render the template with current
   beliefs filled into `{inferred:*}` slots. Rules of voice:
   - Every question states its inference so the respondent confirms or corrects, never recalls from blank.
   - Phrase inferences as inferences ("it looks like", "I'd guess") — a confident wrong guess costs credibility.
   - One question per message. Wait. No stacking.
   - Wrong guess → thank the correction, update, and let the correction visibly steer the next question (this is what makes the session feel like expertise, not a survey).

4. **Ingest after every answer.** Append evidence, update belief through
   assess-state. Answers `reported` (confidence 0.85–0.95 by directness);
   respondent-confirmed prior → `confirmed`. On contradiction with another
   respondent or a harvest signal: do NOT resolve in-session by default —
   record tension, queue probes to both parties separately (see roles file
   `routing_rules`). Then **re-rank** — every answer can reshuffle what's
   worth asking next.

5. **Walkthroughs (L2).** For `form: walkthrough`, switch to narrative mode:
   let them talk, then reflect the steps back as a numbered list and ask
   "what did I miss?" Capture the fields in the question's `capture:` list —
   especially `manual_glue` (the rekeying) and `elapsed_days`. Follow up at
   most twice per walkthrough; depth beats coverage here.

6. **Close.** At budget exhaustion or queue-dry:
   - Summarize to the respondent what was learned + one thing that surprised the model (rapport, and a correctness check).
   - Call `assess-state update-layer` for any layer whose exit criterion now passes.
   - Print for the operator: confidence deltas, remaining top-5 queue, tensions opened/closed, and who to talk to next (from routing_rules).

## Refusals
- No session against a `stub` vertical org.
- No skipping the evidence append ("just note it down") — unlogged answers don't exist.
- Budget is a hard stop. Offer a follow-up session instead of overrunning; a completed quick session beats an abandoned deep one.
