#!/usr/bin/env node
// build-index.js — catalog, per-project listings, stubs, lint and log for the vault wiki.
// Reads wiki/raw/manifest.json and the pages agents wrote under wiki/sessions/ and wiki/projects/.
//
// Usage: node build-index.js [--lint] [--log "<note>"]
//   (no flags)  rebuild index.md, sessions/_by-project/*.md, stubs
//   --lint      also print the lint report and write wiki/lint-report.md
//   --log       append an entry to log.md

const fs = require('fs');
const path = require('path');

// The vault is EOS_VAULT, or the folder two levels above this script (<vault>/wiki/tools/).
const VAULT = (process.env.EOS_VAULT || path.resolve(__dirname, '..', '..')).split(path.sep).join('/');
const WIKI = path.join(VAULT, 'wiki');
const argv = process.argv.slice(2);
const LINT = argv.includes('--lint');
const LOGNOTE = argv.includes('--log') ? argv[argv.indexOf('--log') + 1] : null;

// Project values and display names come from wiki/project-map.json ("projects").
let MAP = { projects: { other: 'Other' } };
try { MAP = Object.assign(MAP, JSON.parse(fs.readFileSync(path.join(WIKI, 'project-map.json'), 'utf8'))); } catch {}
const PROJECTS = Object.keys(MAP.projects);
const STATUSES = ['completed', 'partial', 'blocked', 'failed', 'abandoned', 'informational'];
const KINDS = MAP.kinds || ['interactive', 'scheduled-task', 'agent-run'];
// Required headings come from the session page template in SCHEMA.md (single source).
const HEADINGS = (() => {
  try {
    const s = fs.readFileSync(path.join(WIKI, 'SCHEMA.md'), 'utf8').split('\r').join('');
    const i = s.indexOf('## Session page template'); const a = s.indexOf('```markdown', i); const z = s.indexOf('\n```', a + 5);
    return s.slice(a, z).split('\n').filter(l => l.startsWith('## '));
  } catch { return ['## Summary']; }
})();
const NAMES = MAP.projects;
const SECRET = /sk-ant-[A-Za-z0-9_\-]{8,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{12,}|whsec_[A-Za-z0-9]{12,}|eyJ[A-Za-z0-9_\-]{16,}|xox[abprs]-[A-Za-z0-9\-]{10,}|AKIA[0-9A-Z]{16}|\bre_[A-Za-z0-9_]{20,}|\bsbp_[a-f0-9]{20,}|\b[0-9a-fA-F]{48,}\b/;

const today = (() => { const d = new Date(); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
const rel = f => path.relative(VAULT, f).replace(/\\/g, '/');
const link = (f, label) => `[[${rel(f).replace(/\.md$/, '')}|${label.replace(/[\[\]|]/g, ' ')}]]`;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
function parse(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
  const fm = {};
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (m) for (const l of m[1].split('\n')) { const k = l.match(/^([a-z_]+):\s*(.*)$/); if (k) fm[k[1]] = k[2].trim().replace(/^"(.*)"$/, '$1'); }
  const section = h => { const i = text.indexOf('\n' + h + '\n'); if (i < 0) return ''; const rest = text.slice(i + h.length + 2); const j = rest.search(/\n## /); return (j < 0 ? rest : rest.slice(0, j)).trim(); };
  return { file, text, fm, hasFm: !!m, section };
}
const oneLine = (s, n) => { s = s.replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };

// ---------- load ----------
const manifest = JSON.parse(fs.readFileSync(path.join(WIKI, 'raw', 'manifest.json'), 'utf8'));
const inWindow = manifest.filter(m => m.status === 'ok' || m.status === 'no-response');

// stubs for sessions where Claude never answered
for (const m of manifest.filter(x => x.status === 'no-response')) {
  const out = path.join(VAULT, m.pageRel);
  if (fs.existsSync(out)) continue;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `---\ntype: session\nsession_id: ${m.id}\ntitle: "${(m.title || 'Session with no reply').replace(/"/g, '')}"\ndate: ${m.date}\nended: ${m.date}\ngroup: ${m.group}\nproject: other\nkind: interactive\nstatus: failed\nbranch: ""\nworktree: "none"\nmodels: ""\nhuman_turns: ${m.humanTurns}\nentities: []\n---\n\n# ${m.title || 'Session with no reply'}\n\n## Summary\nStub written by build-index.js. The transcript holds ${m.humanTurns} human turn(s) and no reply or tool call from Claude, so there is nothing to document.\n\n## What the user asked for\nSee the digest.\n\n## What was done\nNothing. Claude produced no output.\n\n## Decisions and locks\nNone recorded.\n\n## Verification\nNothing to verify.\n\n## Corrections from the user\nNone recorded.\n\n## Open at the end\nNot stated in the digest.\n\n## Files, commits and deploys\nNone.\n\n## Limits of this page\nStub page, made by script, no agent.\n\n## Links\n- Raw digest: [[${m.digestRel.replace(/\.md$/, '')}|digest]]\n- Transcript: \`${m.transcript}\`\n`, 'utf8');
}

const pages = walk(path.join(WIKI, 'sessions')).filter(f => f.endsWith('.md') && !rel(f).includes('/_by-project/')).map(parse);
const byId = new Map(pages.map(p => [String(p.fm.session_id || '').slice(0, 8), p]));
const projectPages = walk(path.join(WIKI, 'projects')).filter(f => f.endsWith('.md')).map(parse);

// ---------- link repair ----------
// Agents sometimes link a session page by date and id but drop the title part of the file name.
// The 8-character id is unique, so a link whose target does not exist is pointed at the manifest path.
let repaired = 0;
function repairLinks(p) {
  const fixed = p.text.replace(/\[\[(wiki\/sessions\/[^\]|#]*?(\d{4}-\d{2}-\d{2})-([0-9a-f]{8})[^\]|#]*)((?:#[^\]|]*)?(?:\|[^\]]*)?)\]\]/g, (all, target, date, id8, rest) => {
    if (fs.existsSync(path.join(VAULT, target + '.md'))) return all;
    const row = manifest.find(m => m.id8 === id8 && m.pageRel);
    if (!row || !fs.existsSync(path.join(VAULT, row.pageRel))) return all;
    repaired++;
    return '[[' + row.pageRel.replace(/\.md$/, '') + rest + ']]';
  });
  if (fixed !== p.text) { fs.writeFileSync(p.file, fixed, 'utf8'); p.text = fixed; }
}
for (const p of [...pages, ...projectPages]) repairLinks(p);
// ---------- lint ----------
const issues = [];
for (const m of inWindow) if (!byId.has(m.id8)) issues.push(`MISSING PAGE  ${m.id8}  ${m.digestRel}`);
for (const p of pages) {
  const id = rel(p.file);
  if (!p.hasFm) { issues.push(`NO FRONTMATTER  ${id}`); continue; }
  for (const k of ['session_id', 'title', 'date', 'group', 'project', 'kind', 'status']) if (!p.fm[k]) issues.push(`MISSING FIELD ${k}  ${id}`);
  if (p.fm.project && !PROJECTS.includes(p.fm.project)) issues.push(`BAD PROJECT "${p.fm.project}"  ${id}`);
  if (p.fm.status && !STATUSES.includes(p.fm.status)) issues.push(`BAD STATUS "${p.fm.status}"  ${id}`);
  if (p.fm.kind && !KINDS.includes(p.fm.kind)) issues.push(`BAD KIND "${p.fm.kind}"  ${id}`);
  const missing = HEADINGS.filter(h => !p.text.includes('\n' + h + '\n'));
  if (missing.length) issues.push(`MISSING HEADINGS (${missing.length}: ${missing.map(h => h.slice(3)).join(', ')})  ${id}`);
  if (/^\s*\[lens:/m.test(p.text)) issues.push(`RUNTIME HEADER IN PAGE  ${id}`);
  if (p.section('## Summary').length < 60) issues.push(`THIN SUMMARY  ${id}`);
  const expected = manifest.find(m => m.id8 === String(p.fm.session_id).slice(0, 8));
  if (!expected) issues.push(`PAGE WITH NO MANIFEST ROW  ${id}`);
  else if (rel(p.file) !== expected.pageRel) issues.push(`WRONG PATH (expected ${expected.pageRel})  ${id}`);
}
for (const p of [...pages, ...projectPages]) {
  const s = p.text.match(SECRET); if (s) issues.push(`SECRET PATTERN "${s[0].slice(0, 12)}…"  ${rel(p.file)}`);
  const prose = p.text.split('```').filter((_, i) => i % 2 === 0).join('').split('`').filter((_, i) => i % 2 === 0).join('');
  for (const l of prose.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)) {
    const target = path.join(VAULT, l[1] + '.md');
    if (!fs.existsSync(target)) issues.push(`BROKEN LINK [[${l[1]}]]  ${rel(p.file)}`);
  }
}

// ---------- per-project listings ----------
const good = pages.filter(p => p.hasFm && PROJECTS.includes(p.fm.project));
const groups = {}; for (const p of good) (groups[p.fm.project] = groups[p.fm.project] || []).push(p);
for (const k of Object.keys(groups)) groups[k].sort((a, b) => String(a.fm.date).localeCompare(String(b.fm.date)) || rel(a.file).localeCompare(rel(b.file)));
const listDir = path.join(WIKI, 'sessions', '_by-project');
fs.rmSync(listDir, { recursive: true, force: true }); fs.mkdirSync(listDir, { recursive: true });
for (const [proj, list] of Object.entries(groups)) {
  const out = [`# Sessions for ${NAMES[proj]} — listing for the project-page agent`, '', `Built by build-index.js on ${today}. ${list.length} sessions, oldest first. Each entry: the page's own Summary, Decisions and Open sections.`, ''];
  for (const p of list) {
    out.push(`## ${p.fm.date} — ${p.fm.title}`, `- page: ${link(p.file, 'page')} · status: ${p.fm.status} · kind: ${p.fm.kind} · entities: ${p.fm.entities || '[]'}`, '', `**Summary.** ${oneLine(p.section('## Summary'), 900)}`, '');
    const dec = p.section('## Decisions and locks'); if (dec && !/^None recorded\.?$/i.test(dec)) out.push(`**Decisions.** ${oneLine(dec, 700)}`, '');
    const cor = p.section('## Corrections from the user'); if (cor && !/^None recorded\.?$/i.test(cor)) out.push(`**Corrections.** ${oneLine(cor, 500)}`, '');
    const open = p.section('## Open at the end'); if (open && !/^(None|Nothing|Not stated)/i.test(open)) out.push(`**Open.** ${oneLine(open, 700)}`, '');
  }
  fs.writeFileSync(path.join(listDir, `${proj}.md`), out.join('\n') + '\n', 'utf8');
}

// ---------- index.md ----------
const idx = ['# Wiki index', '', `Built by \`wiki/tools/build-index.js\` on ${today}. Rules: [[wiki/SCHEMA|SCHEMA]]. History: [[wiki/log|log]].`, '',
  `**${good.length} session pages** from ${manifest.filter(m => m.status === 'ok').length} digests in the window. ${manifest.filter(m => m.status === 'out-of-window').length} older transcripts were left out.`, '', '## Projects', ''];
for (const proj of PROJECTS) {
  const list = groups[proj] || []; if (!list.length) continue;
  const pp = projectPages.find(p => p.fm.project === proj);
  const open = list.filter(p => ['partial', 'blocked', 'failed'].includes(p.fm.status)).length;
  idx.push(`- ${pp ? link(pp.file, NAMES[proj]) : NAMES[proj] + ' (no project page yet)'} — ${list.length} sessions, ${list[0].fm.date} to ${list[list.length - 1].fm.date}, ${open} ended partial, blocked or failed`);
}
for (const proj of PROJECTS) {
  const list = groups[proj] || []; if (!list.length) continue;
  idx.push('', `## Sessions — ${NAMES[proj]}`, '');
  const human = list.filter(p => !/agent-run$/.test(p.fm.kind)), runs = list.filter(p => /agent-run$/.test(p.fm.kind));
  for (const [label, l] of [['', human], ['Automated agent runs', runs]]) {
    if (!l.length) continue;
    if (label) idx.push('', `### ${label}`, '');
    idx.push('| Date | Session | Status | Summary |', '|---|---|---|---|');
    for (const p of [...l].reverse()) idx.push(`| ${p.fm.date} | ${link(p.file, p.fm.title || path.basename(p.file, '.md'))} | ${p.fm.status} | ${oneLine(p.section('## Summary'), 170).replace(/\|/g, '/')} |`);
  }
}
fs.writeFileSync(path.join(WIKI, 'index.md'), idx.join('\n') + '\n', 'utf8');

// ---------- lint report + log ----------
const counts = {}; for (const i of issues) { const k = i.split('  ')[0].replace(/ ".*$/, '').replace(/ \(.*$/, ''); counts[k] = (counts[k] || 0) + 1; }
if (LINT) fs.writeFileSync(path.join(WIKI, 'lint-report.md'), `# Lint report\n\nRun ${today}. ${issues.length} issue(s).\n\n` + (issues.length ? issues.map(i => `- ${i}`).join('\n') : 'Clean.') + '\n', 'utf8');
if (LOGNOTE) {
  const logFile = path.join(WIKI, 'log.md');
  if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, '# Wiki log\n\nAppend-only. One entry per ingest or lint pass. Newest at the bottom.\n', 'utf8');
  fs.appendFileSync(logFile, `\n## [${today}] ${LOGNOTE}\n- transcripts found: ${manifest.length}; in window: ${inWindow.length}; older than the window, left out: ${manifest.filter(m => m.status === 'out-of-window').length}\n- session pages on disk: ${pages.length}; digests with no page: ${issues.filter(i => i.startsWith('MISSING PAGE')).length}\n- project pages: ${projectPages.length}\n- lint issues: ${issues.length}${issues.length ? ' (' + Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ') + ')' : ''}\n`, 'utf8');
}
console.log(JSON.stringify({ linksRepaired: repaired, pages: pages.length, inWindow: inWindow.length, projectPages: projectPages.length, byProject: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])), issues: issues.length, issueCounts: counts }, null, 2));
if (LINT && issues.length) console.log(issues.slice(0, 60).join('\n'));
