#!/usr/bin/env node
// tally-verify.js — count every fact-check result across all verify runs, and write the wiki log entry.
// Every figure it prints is a count of result rows in the workflow journals. Nothing is estimated.
//
// Usage: node tally-verify.js <workflows-dir> [--log "<note>"]
//   <workflows-dir>  the session's subagents/workflows directory (holds one folder per run)

const fs = require('fs'), path = require('path');
const VAULT = (process.env.EOS_VAULT || path.resolve(__dirname, '..', '..')).split(path.sep).join('/');
const WIKI = path.join(VAULT, 'wiki');
const dir = process.argv[2];
const LOGNOTE = process.argv.includes('--log') ? process.argv[process.argv.indexOf('--log') + 1] : null;
if (!dir || !fs.existsSync(dir)) { console.error('usage: node tally-verify.js <workflows-dir> [--log "note"]'); process.exit(1); }

// first result per page per run = the page as it stood before that run; later rows are re-checks
const runs = [];
for (const d of fs.readdirSync(dir)) {
  const j = path.join(dir, d, 'journal.jsonl');
  if (!fs.existsSync(j)) continue;
  const first = new Map(), again = [];
  for (const l of fs.readFileSync(j, 'utf8').split('\n').filter(Boolean)) {
    let o; try { o = JSON.parse(l); } catch { continue; }
    const r = o.result; if (!r || !r.verdict) continue;
    if (first.has(r.id8)) again.push(r); else first.set(r.id8, r);
  }
  if (first.size) runs.push({ run: d, first: [...first.values()], again });
}
const sum = (a, k) => a.reduce((s, r) => s + (Array.isArray(r[k]) ? r[k].length : (r[k] || 0)), 0);
const by = a => ['accurate', 'minor-errors', 'major-errors'].map(v => `${v} ${a.filter(r => r.verdict === v).length}`).join(', ');

const allFirst = new Map(), allAgain = [];
for (const r of runs) { for (const x of r.first) { if (allFirst.has(x.id8)) allAgain.push(x); else allFirst.set(x.id8, x); } allAgain.push(...r.again); }
const F = [...allFirst.values()];

const pages = fs.existsSync(path.join(WIKI, 'raw', 'manifest.json'))
  ? JSON.parse(fs.readFileSync(path.join(WIKI, 'raw', 'manifest.json'), 'utf8')).filter(m => m.status === 'ok' && fs.existsSync(path.join(VAULT, m.pageRel))).length : 0;

const out = [];
out.push(`pages fact-checked: ${F.length} of ${pages} session pages | re-checks of an already-corrected page: ${allAgain.length}`);
out.push(`first check of each page: ${by(F)}`);
out.push(`  numbers, ids and times traced: ${sum(F, 'numbers_checked')} | wrong or unsupported: ${sum(F, 'numbers_wrong_or_unsupported')}`);
out.push(`  claims checked: ${sum(F, 'claims_checked')} | unsupported: ${sum(F, 'unsupported_claims')} | important facts missing: ${sum(F, 'missing_important_facts')} | could not verify: ${sum(F, 'could_not_verify')}`);
out.push(`  pages the checker edited: ${F.filter(r => r.page_fixed).length}`);
if (allAgain.length) out.push(`re-checks: ${by(allAgain)}; still found ${sum(allAgain, 'numbers_wrong_or_unsupported')} wrong numbers, ${sum(allAgain, 'unsupported_claims')} unsupported claims, ${sum(allAgain, 'missing_important_facts')} missing facts. One checker pass does not make a page clean.`);
out.push(`unchecked: ${pages - F.length} session pages`);
for (const r of runs) out.push(`  run ${r.run}: ${r.first.length} pages (${by(r.first)})${r.again.length ? ` + ${r.again.length} re-checks` : ''}`);
console.log(out.join('\n'));

if (LOGNOTE) {
  const today = (() => { const d = new Date(); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
  const f = path.join(WIKI, 'log.md');
  let t = fs.readFileSync(f, 'utf8');
  const head = `## [${today}] fact-check | ${LOGNOTE}`;
  const body = head + '\n' + out.map(l => '- ' + l.replace(/^ +/, '')).join('\n') + '\n- counts are result rows in the workflow journals under ' + dir.split(path.sep).join('/') + '\n';
  const i = t.indexOf(head);
  t = i >= 0 ? t.slice(0, i) + body + t.slice(t.indexOf('\n## ', i + 5) < 0 ? t.length : t.indexOf('\n## ', i + 5) + 1) : t.replace(/\s*$/, '') + '\n\n' + body;
  fs.writeFileSync(f, t, 'utf8');
  console.log('\nlog entry written (replaces any earlier entry with the same heading)');
}
