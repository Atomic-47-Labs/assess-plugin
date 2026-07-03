#!/usr/bin/env node
// assess-live stage server — dumb file bridge, zero dependencies.
// All intelligence lives in the assess-live skill, which writes live.json.
// This server: serves the stage + respond pages, exposes live.json + vote
// tallies, and appends audience responses to responses.ndjson (the one file
// it owns — the skill ingests it, never writes it).
//
// Usage: node server.js --session SES-001 [--port 3377] [--root /path/to/project]

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
if (!args.session) { console.error('required: --session SES-NNN'); process.exit(1); }
const PORT = parseInt(args.port || '3377', 10);

// Resolve facility root: walk up from --root or cwd until assess-state/ found.
let root = path.resolve(args.root || process.cwd());
while (!fs.existsSync(path.join(root, 'assess-state')) && root !== path.dirname(root)) root = path.dirname(root);
const SESSION_DIR = path.join(root, 'assess-state', 'sessions', args.session);
if (!fs.existsSync(SESSION_DIR)) { console.error('session dir not found: ' + SESSION_DIR); process.exit(1); }
const LIVE = path.join(SESSION_DIR, 'live.json');
const RESPONSES = path.join(SESSION_DIR, 'responses.ndjson');

function readLive() {
  try { return JSON.parse(fs.readFileSync(LIVE, 'utf8')); } catch { return { status: 'waiting' }; }
}
function readResponses() {
  try { return fs.readFileSync(RESPONSES, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); }
  catch { return []; }
}
function tally(qid) {
  const t = {}; let n = 0;
  for (const r of readResponses()) if (r.qid === qid) { t[r.answer] = (t[r.answer] || 0) + 1; n++; }
  return { n, counts: t };
}
function lanIp() {
  for (const ifs of Object.values(os.networkInterfaces()))
    for (const i of ifs || []) if (i.family === 'IPv4' && !i.internal) return i.address;
  return 'localhost';
}
function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json', 'Cache-Control': 'no-store' });
  res.end(body);
}

const PAGE = fs.readFileSync(path.join(__dirname, 'stage.html'), 'utf8');

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/respond')) {
    const mode = url.pathname === '/respond' ? 'respond' : 'stage';
    return send(res, 200, PAGE.replace('__MODE__', mode).replace('__RESPOND_URL__', 'http://' + lanIp() + ':' + PORT + '/respond'), 'text/html');
  }
  if (req.method === 'GET' && url.pathname === '/api/state') {
    const live = readLive();
    const qid = live.current_question && live.current_question.id;
    return send(res, 200, JSON.stringify({ live, tally: qid ? tally(qid) : null, respond_url: 'http://' + lanIp() + ':' + PORT + '/respond' }));
  }
  if (req.method === 'POST' && url.pathname === '/api/respond') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 4096) req.destroy(); });
    req.on('end', () => {
      try {
        const r = JSON.parse(body);
        if (!r.qid || typeof r.answer !== 'string' || r.answer.length > 500) return send(res, 400, '{"ok":false}');
        fs.appendFileSync(RESPONSES, JSON.stringify({ ts: new Date().toISOString(), qid: String(r.qid), answer: r.answer, note: (r.note || '').slice(0, 500) }) + '\n');
        send(res, 200, '{"ok":true}');
      } catch { send(res, 400, '{"ok":false}'); }
    });
    return;
  }
  send(res, 404, '{"error":"not found"}');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('assess-live stage: http://localhost:' + PORT + '  (audience: http://' + lanIp() + ':' + PORT + '/respond)');
});
