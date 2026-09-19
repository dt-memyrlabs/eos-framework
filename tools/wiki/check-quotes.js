#!/usr/bin/env node
// check-quotes.js — deterministic check of every quotation on a session page against the transcript.
// A small model sometimes puts its own paraphrase inside quotation marks. This script takes each quoted
// string of 4+ words from a session page, looks for it word for word in what the user actually typed
// (and, failing that, in what Claude wrote), and records the result on the page under
// "## Limits of this page". It rewrites only its own "Quote check" line. Run it after every ingest.
//
// Usage: node check-quotes.js [--dry]

const fs = require('fs');
const path = require('path');

const VAULT = (process.env.EOS_VAULT || path.resolve(__dirname, '..', '..')).split(path.sep).join('/');
const WIKI = path.join(VAULT, 'wiki');
const DRY = process.argv.includes('--dry');
const today = (() => { const d = new Date(); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();

const norm = s => s.toLowerCase().replace(/[‘’“”"'`*_]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

function transcriptText(file) {
  let human = '', claude = '', tools = '';
  if (!fs.existsSync(file)) return null;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o.isSidechain || !o.message) continue;
    const c = o.message.content;
    const parts = typeof c === 'string' ? [{ type: 'text', text: c }] : (Array.isArray(c) ? c : []);
    for (const p of parts) {
      if (p.type === 'text' && p.text) { if (o.type === 'user') human += ' ' + p.text; else if (o.type === 'assistant') claude += ' ' + p.text; }
      else if (p.type === 'tool_use') tools += ' ' + JSON.stringify(p.input || {}).slice(0, 20000);
      else if (p.type === 'tool_result') tools += ' ' + (typeof p.content === 'string' ? p.content : (Array.isArray(p.content) ? p.content.filter(x => x.type === 'text').map(x => x.text).join(' ') : '')).slice(0, 60000);
    }
  }
  return { human: norm(human), claude: norm(claude), tools: norm(tools) };
}

function walk(dir) { return fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]) : []; }

const manifest = JSON.parse(fs.readFileSync(path.join(WIKI, 'raw', 'manifest.json'), 'utf8'));
const pages = walk(path.join(WIKI, 'sessions')).filter(f => f.endsWith('.md') && !f.split(path.sep).join('/').includes('/_by-project/'));
const totals = { pages: 0, quotes: 0, user: 0, claudeOnly: 0, toolText: 0, notFound: 0, pagesWithProblems: 0 };
const report = [];

for (const file of pages) {
  let text = fs.readFileSync(file, 'utf8');
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const flat = text.split('\r').join('');
  const id = (flat.match(/^session_id:\s*"?([0-9a-f-]{36})/m) || [])[1];
  const row = manifest.find(m => m.id === id);
  if (!row) continue;
  // body only: skip frontmatter, code spans, and the Links / Limits sections
  const body = flat.replace(/^---\n[\s\S]*?\n---\n/, '').split('\n## Limits of this page')[0].split('`').filter((_, i) => i % 2 === 0).join(' ');
  const quotes = [...new Set([...body.matchAll(/["“]([^"“”\n]{12,400})["”]/g)].map(m => m[1].trim()).filter(q => norm(q).split(' ').length >= 4))];
  totals.pages++;
  if (!quotes.length) continue;
  const t = transcriptText(row.transcript);
  if (!t) { report.push(`TRANSCRIPT MISSING  ${path.basename(file)}`); continue; }
  const bad = [], claudeOnly = [];
  for (const q of quotes) {
    // an elided quote ("a ... b") is checked piece by piece
    const pieces = q.split(/\s*(?:\.\.\.|…|\[[^\]]*\])\s*/).map(norm).filter(p => p.split(' ').length >= 3);
    if (!pieces.length) continue;
    totals.quotes++;
    if (pieces.every(p => t.human.includes(p))) totals.user++;
    else if (pieces.every(p => t.human.includes(p) || t.claude.includes(p))) { totals.claudeOnly++; claudeOnly.push(q); }
    else if (pieces.every(p => t.human.includes(p) || t.claude.includes(p) || t.tools.includes(p))) totals.toolText++;
    else { totals.notFound++; bad.push(q); }
  }
  const short = q => '"' + (q.length > 90 ? q.slice(0, 87) + '...' : q) + '"';
  let line = `Quote check (script, ${today}): ${quotes.length} quotation(s) on this page. `;
  if (!bad.length && !claudeOnly.length) line += 'All found word for word in the transcript (user text or tool output).';
  else {
    totals.pagesWithProblems++;
    if (claudeOnly.length) line += `${claudeOnly.length} are Claude's words, not the user's: ${claudeOnly.map(short).join('; ')}. `;
    if (bad.length) line += `${bad.length} NOT found word for word in the transcript, treat as paraphrase: ${bad.map(short).join('; ')}.`;
    report.push(`${path.basename(file)}  claude-words=${claudeOnly.length} not-found=${bad.length}`);
  }
  if (DRY) continue;
  let out = flat.split('\n').filter(l => !l.startsWith('Quote check (script,')).join('\n');
  const h = '\n## Limits of this page\n';
  const i = out.indexOf(h);
  if (i < 0) continue;
  const after = i + h.length;
  out = out.slice(0, after) + line.trim() + '\n\n' + out.slice(after).replace(/^\n+/, '');
  fs.writeFileSync(file, eol === '\r\n' ? out.split('\n').join('\r\n') : out, 'utf8');
}

fs.writeFileSync(path.join(WIKI, 'quote-report.md'), `# Quote check report\n\nRun ${today}${DRY ? ' (dry run)' : ''}. ${totals.quotes} quotations on ${totals.pages} session pages: ${totals.user} found word for word in the user's text, ${totals.claudeOnly} found only in Claude's text, ${totals.toolText} found in tool input or output (file content, commands, error messages), ${totals.notFound} found nowhere in the transcript. ${totals.pagesWithProblems} pages carry at least one problem; each has a "Quote check" line under "Limits of this page".\n\n` + report.map(r => `- ${r}`).join('\n') + '\n', 'utf8');
console.log(JSON.stringify(totals, null, 2));
