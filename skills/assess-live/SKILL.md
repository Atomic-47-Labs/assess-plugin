---
name: assess-live
description: >
  Live-session conductor: run an assessment as a participatory experience
  with an audience in the room. Background research agents fill in the org's
  story in real time while the audience answers inference-anchored questions;
  a projected stage page shows the belief model converging, story beats
  landing, and live response tallies. Trigger:
  /assess-live org: ORG-NNN | seed: "<scant seed>" [mode: workshop|demo|webinar]
---

# assess-live — real-time intelligence with the audience

The show: "watch us learn your company in 20 minutes." A projected stage
shows the org's belief model filling in from two directions at once —
**background research agents** racing to discover the story from public
signals, and **the audience** confirming, denying, and correcting live.
Every landed fact is a beat; every wrong guess is a laugh; every
disagreement between two people in the room is theater.

**Modes:** `workshop` (the org's own team — the real product),
`demo` (a volunteer org at a meetup/webinar — the marketing engine),
`webinar` (remote — facilitator relays a poll tool).

**Writes:** everything through assess-state, as always. The one exception:
the stage server owns `sessions/SES-NNN/responses.ndjson` as an append-only
audience inbox (same pattern as reach's events ledger) — this skill INGESTS
it, never writes it.

## Architecture

```
Claude (this skill)                 stage server (node, no deps)
  ├─ background research strands      ├─ GET  /            stage page (projector)
  ├─ inquirer loop (audience mode)    ├─ GET  /respond     vote page (phones, LAN)
  ├─ ingest: responses + findings     ├─ GET  /api/state   serves live.json + tallies
  └─ writes live.json via             └─ POST /api/respond appends responses.ndjson
     assess-state update-live
```

The server is a dumb file bridge (`stage/server.js`, bundled with this
skill). All intelligence stays here: this skill prepares everything the
stage renders into `sessions/SES-NNN/live.json`.

## Procedure

### 1. Open the session
- `assess-state new-session` → SES-NNN under `assess-state/sessions/`; link org
  (existing ORG-NNN, or `new-org` from the scant seed live on stage — the
  strongest opening: type the company name in front of the room).
- Start the stage server in the background:
  `node <skill-dir>/stage/server.js --session SES-NNN --port 3377`
  (binds 0.0.0.0 so phones on the venue LAN can hit `/respond`; put the URL
  on the stage — the page displays it).
- Push the opening `live.json`: org name, empty belief board, story beat #1
  ("We start from almost nothing: a name.").

### 2. Launch background strands
Spawn 3–4 parallel background research agents (Agent tool,
`run_in_background: true`), each a narrow slice of assess-researcher's
angles so results land STAGGERED — a steady drip of reveals, not one dump:
- **identity/registry** — who they legally are, licenses, certifications
- **money/timeline** — funding, press, expansions (the org's arc)
- **people/roles** — team shape, role map candidates
- **digital footprint** — MX/SPF/tech fingerprint, hiring stack mentions

Each agent returns structured findings. As each completes: ingest through
assess-state (evidence → beliefs), turn the best finding into a **story
beat**, update live.json. Beats are written as narrative, second person,
with the source named: "2021: an IRAP contribution for your coating line —
public record. That's probably when the claim spreadsheet was born."

### 3. Run the audience loop (interleaved with strand landings)
The inquirer session, staged for a room:
1. Pull the top-ranked question; write it to live.json as
   `current_question` with options. Audience answers on phones
   (`/respond`) or by facilitator relay — poll `responses.ndjson` for the
   tally (2–4s is fine; announce a 30–60s window per question).
2. **Beat the model:** before showing the answer tally, show the model's
   guess WITH its confidence ("we're 78% sure you're on QuickBooks").
   Reveal. Right → confidence bar slams up, beat lands. Wrong → own it
   loudly, show the branch collapsing — the correction visibly steering
   the next question is what makes it feel like intelligence, not a quiz.
3. **Tension theater (workshop mode):** a split vote IS the finding.
   "Half the room says hours are tracked as you go; half says claim-time
   archaeology. Both true — and that gap is question one of the readout."
   Record the tension; probe both sides right there if the room's up for it.
4. Ingest every tally through assess-state (source:
   `reported: audience-vote SES-NNN, n=<count>, split=<distribution>`;
   unanimous ≥ 0.9 confidence, split → tension). Re-rank the queue.
   Meanwhile background strands keep landing beats between questions —
   interleave; never let 3 minutes pass without something moving on stage.

### 4. Close the show
- Freeze the board: L0→L1 progress meter, X facts confirmed, Y corrected,
  Z tensions opened (say all three numbers out loud — corrections are
  credibility, not failure).
- Render the story feed into the silhouette/readout draft
  (assess-reporter) — "20 minutes ago this page was empty."
- CTA by mode: workshop → book the L2 walkthroughs (name who: "we need
  40 minutes with whoever owns the claim workbook"); demo/webinar → "want
  this run on your org? — the form takes one field."
- `assess-state close-session`: archive live.json + responses into the
  session record; log a session evidence line against the org.

## Rules
- Audience data discipline: votes are anonymous by default; named
  attribution only in workshop mode with the room told first.
- Demo-mode consent: the volunteer org agreed on stage or beforehand;
  research remains public-sources-only, and the disclosure list is ON the
  stage (a "sources we touched" panel — the ethics rule as a feature).
- Never fake a beat. If the strands find nothing juicy, the honest
  "your digital footprint is quiet — that's itself a finding" plays fine.
- Budget the show: 20–30 min, 8–12 questions, strands capped at
  standard research budget. Leave them wanting the L2.
