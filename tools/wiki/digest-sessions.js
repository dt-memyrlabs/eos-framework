#!/usr/bin/env node
// digest-sessions.js — raw layer builder for the vault wiki.
// Reads Claude Code transcripts (~/.claude/projects/<dir>/<session>.jsonl) and writes one
// redacted, size-capped digest per session to wiki/raw/sessions/<group>/, plus
// wiki/raw/manifest.json. Digests are regenerated, never hand-edited.
//
// Usage: node digest-sessions.js [--days 31] [--only <sessionId-prefix>]

const fs = require('fs');
const path = require('path');
const os = require('os');

// The vault is EOS_VAULT, or the folder two levels above this script (<vault>/wiki/tools/).
const VAULT = (process.env.EOS_VAULT || path.resolve(__dirname, '..', '..')).split(path.sep).join('/');
const WIKI = path.join(VAULT, 'wiki');
const RAW = path.join(WIKI, 'raw', 'sessions');
const PROJECTS = path.join(os.homedir(), '.claude', 'projects');

const argv = process.argv.slice(2);
const argOf = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const DAYS = Number(argOf('--days', 31));
const ONLY = argOf('--only', null);
const CUTOFF = Date.now() - DAYS * 86400000;

const BUDGET = 120000;   // max characters per digest body
const WRAP = 1200;       // max characters per line (the Read tool truncates long lines)

// ---------- redaction ----------
const REDACTIONS = [
  [/sk-ant-[A-Za-z0-9_\-]{20,}/g, '[REDACTED:anthropic-key]'],
  [/\bsk-(?:proj-)?[A-Za-z0-9_\-]{20,}/g, '[REDACTED:sk-key]'],
  [/\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{16,}/g, '[REDACTED:stripe-key]'],
  [/\bwhsec_[A-Za-z0-9]{16,}/g, '[REDACTED:webhook-secret]'],
  [/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/g, '[REDACTED:github-token]'],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}/g, '[REDACTED:github-token]'],
  [/\bxox[abprs]-[A-Za-z0-9\-]{10,}/g, '[REDACTED:slack-token]'],
  [/\bAKIA[0-9A-Z]{16}\b/g, '[REDACTED:aws-key]'],
  [/\bAIza[0-9A-Za-z_\-]{30,}/g, '[REDACTED:google-key]'],
  [/\bre_[A-Za-z0-9_]{20,}/g, '[REDACTED:resend-key]'],
  [/\bsbp_[A-Za-z0-9]{20,}/g, '[REDACTED:supabase-token]'],
  [/\bsb_(?:secret|publishable)_[A-Za-z0-9_\-]{16,}/g, '[REDACTED:supabase-key]'],
  [/\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{5,}/g, '[REDACTED:jwt]'],
  [/(\b[a-z][a-z0-9+.\-]*:\/\/[^\s:\/@]+:)[^\s@\/]+(@)/gi, '$1[REDACTED:password]$2'],
  [/((?:api[_-]?key|apikey|secret|token|password|passwd|pwd|bearer|authorization|client[_-]?secret|access[_-]?key)["']?\s*[:=]\s*["']?(?:Bearer\s+)?)([A-Za-z0-9_\-\.=\/+]{16,})/gi, '$1[REDACTED:value]'],
  [/\beyJ[A-Za-z0-9_\-]{16,}/g, '[REDACTED:jwt-part]'],
  [/\b[0-9a-fA-F]{48,}\b/g, '[REDACTED:hex]'],
];
// Long unbroken strings are redacted as blobs unless they read like a file path or slug
// (three or more lowercase words of 4+ letters joined by / - _).
const BLOB = /[A-Za-z0-9+\/=_\-]{80,}/g;
function looksLikePath(m) { return (m.match(/(?:^|[\/\-_])[a-z]{4,}(?=$|[\/\-_.])/g) || []).length >= 3; }
function redact(s) {
  for (const [re, rep] of REDACTIONS) s = s.replace(re, rep);
  return s.replace(BLOB, m => looksLikePath(m) ? m : '[REDACTED:blob]');
}

// ---------- helpers ----------
// Storage group for a transcript folder, from wiki/project-map.json ("groups": first match wins).
let MAP = { groups: [], default_group: 'misc' };
try { MAP = Object.assign(MAP, JSON.parse(fs.readFileSync(path.join(WIKI, 'project-map.json'), 'utf8'))); } catch {}
function groupOf(dir) {
  const d = dir.toLowerCase();
  for (const g of MAP.groups || []) {
    if (g.equals && d === String(g.equals).toLowerCase()) return g.group;
    if (g.all && g.all.every(s => d.includes(String(s).toLowerCase()))) return g.group;
  }
  return MAP.default_group || 'misc';
}
function worktreeOf(dir) { const m = dir.match(/--claude-worktrees-(.+)$/); return m ? m[1] : null; }
function localDate(ts) {
  const d = new Date(ts);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function localStamp(ts) {
  const d = new Date(ts);
  const p = n => String(n).padStart(2, '0');
  return `${localDate(ts)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function slugify(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/, '');
}
function cleanUserText(s) {
  return s
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
    .replace(/<local-command-stdout>[\s\S]*?<\/local-command-stdout>/g, '')
    .replace(/<local-command-caveat>[\s\S]*?<\/local-command-caveat>/g, '')
    .replace(/<command-message>[\s\S]*?<\/command-message>/g, '')
    .replace(/<command-name>([\s\S]*?)<\/command-name>/g, '(slash command: $1)')
    .replace(/<command-args>([\s\S]*?)<\/command-args>/g, ' args: $1')
    .replace(/<ide_[a-z_]+>[\s\S]*?<\/ide_[a-z_]+>/g, '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
function cap(s, n) {
  if (s.length <= n) return s;
  const head = Math.floor(n * 0.7), tail = n - head;
  return s.slice(0, head) + `\n[... ${s.length - n} characters cut ...]\n` + s.slice(-tail);
}
function wrapLines(s) {
  return s.split('\n').map(l => {
    if (l.length <= WRAP) return l;
    const out = []; for (let i = 0; i < l.length; i += WRAP) out.push(l.slice(i, i + WRAP)); return out.join('\n');
  }).join('\n');
}
function oneLine(s, n) { return cap(String(s || '').replace(/\s+/g, ' ').trim(), n).replace(/\n/g, ' '); }

function toolLine(name, input, capN) {
  input = input || {};
  switch (name) {
    case 'Write': case 'Edit': case 'MultiEdit': case 'NotebookEdit':
      return `${name} ${input.file_path || input.notebook_path || ''}`;
    case 'Bash': case 'PowerShell':
      return `${name}: ${oneLine(input.description || '', 120)} :: ${oneLine(input.command, capN)}`;
    case 'Agent': case 'Task':
      return `${name} (${input.subagent_type || 'default'}): ${oneLine(input.description || input.prompt, capN)}`;
    case 'Skill': return `Skill ${input.skill || ''} ${oneLine(input.args || '', 80)}`;
    case 'WebFetch': return `WebFetch ${input.url || ''}`;
    case 'WebSearch': return `WebSearch ${oneLine(input.query, 120)}`;
    case 'Workflow': return `Workflow ${input.name || '(inline script)'}`;
    case 'TodoWrite': return null;
    case 'Read': case 'Grep': case 'Glob': case 'ToolSearch': return null; // counted only
    default: return `${name} ${oneLine(JSON.stringify(input), Math.min(capN, 160))}`;
  }
}

// ---------- one session ----------
function digest(file, dirName) {
  const stat = fs.statSync(file);
  const id = path.basename(file, '.jsonl');
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const events = [];            // {kind:'human'|'assistant'|'tool'|'error'|'summary', ts, text}
  const toolCounts = {}; const filesTouched = {}; const commits = []; const ships = [];
  let title = null, cwd = null, branch = null, entry = null, firstTs = null, lastTs = null;
  const models = new Set();
  let humanTurns = 0, assistantChars = 0;

  for (const line of lines) {
    if (!line) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o.type === 'custom-title' && o.customTitle) title = o.customTitle;
    if (o.type === 'summary' && o.summary && !title) title = o.summary;
    if (o.isSidechain) continue;
    if (o.timestamp && (o.type === 'user' || o.type === 'assistant')) {
      if (!firstTs) firstTs = o.timestamp; lastTs = o.timestamp;
    }
    if (o.cwd && !cwd) cwd = o.cwd;
    if (o.gitBranch) branch = o.gitBranch;
    if (o.entrypoint && !entry) entry = o.entrypoint;

    if (o.type === 'user' && o.message) {
      const c = o.message.content;
      const parts = typeof c === 'string' ? [{ type: 'text', text: c }] : (Array.isArray(c) ? c : []);
      for (const p of parts) {
        if (p.type === 'text' && p.text) {
          const t = cleanUserText(p.text);
          if (!t) continue;
          if (o.isCompactSummary) { events.push({ kind: 'summary', ts: o.timestamp, text: t }); continue; }
          if (o.isMeta) continue;
          humanTurns++;
          events.push({ kind: 'human', ts: o.timestamp, text: t });
        } else if (p.type === 'tool_result' && p.is_error) {
          const txt = typeof p.content === 'string' ? p.content : (Array.isArray(p.content) ? p.content.filter(x => x.type === 'text').map(x => x.text).join(' ') : '');
          if (txt) events.push({ kind: 'error', ts: o.timestamp, text: oneLine(txt, 300) });
        } else if (p.type === 'image') {
          events.push({ kind: 'human', ts: o.timestamp, text: '[image attached]' });
        }
      }
    } else if (o.type === 'assistant' && o.message && Array.isArray(o.message.content)) {
      if (o.message.model && o.message.model !== '<synthetic>') models.add(o.message.model);
      for (const p of o.message.content) {
        if (p.type === 'text' && p.text && p.text.trim()) {
          assistantChars += p.text.length;
          events.push({ kind: 'assistant', ts: o.timestamp, text: p.text.replace(/\r/g, '').trim() });
        } else if (p.type === 'tool_use') {
          toolCounts[p.name] = (toolCounts[p.name] || 0) + 1;
          const inp = p.input || {};
          const fp = inp.file_path || inp.notebook_path;
          if (fp && /^(Write|Edit|MultiEdit|NotebookEdit)$/.test(p.name)) filesTouched[fp] = (filesTouched[fp] || 0) + 1;
          const cmd = String(inp.command || '');
          if (/\bgit\b[^\n|;&]*\bcommit\b/.test(cmd)) {
            const m = cmd.match(/-m\s+(?:"([^"]+)"|'([^']+)'|@'\s*\n([^\n]+))/) || cmd.match(/<<\s*'?EOF'?\s*\n([^\n]+)/);
            commits.push(oneLine(m ? (m[1] || m[2] || m[3]) : '(message not parsed)', 160));
          }
          if (/\bgit\s+push\b|\bgh\s+pr\s+(create|merge)\b|\bvercel\b[^\n]*(--prod|deploy)|\bsupabase\s+(db\s+push|migration)/.test(cmd)) ships.push(oneLine(cmd, 160));
          events.push({ kind: 'tool', ts: o.timestamp, name: p.name, input: inp });
        }
      }
    }
  }

  const render = (hCap, aCap, tCap, keepTools) => {
    const out = [];
    let lastTool = false;
    for (const e of events) {
      if (e.kind === 'human') { out.push(`\n### HUMAN [${localStamp(e.ts)}]\n${cap(e.text, hCap)}`); lastTool = false; }
      else if (e.kind === 'assistant') { out.push(`\n### CLAUDE\n${cap(e.text, aCap)}`); lastTool = false; }
      else if (e.kind === 'summary') { out.push(`\n### COMPACTION SUMMARY (context was compacted here)\n${cap(e.text, hCap * 2)}`); lastTool = false; }
      else if (e.kind === 'error') { if (keepTools) out.push(`  ! tool error: ${e.text}`); }
      else if (e.kind === 'tool' && keepTools) {
        const tl = toolLine(e.name, e.input, tCap);
        if (tl) { if (!lastTool) out.push(''); out.push(`  > ${tl}`); lastTool = true; }
      }
    }
    return redact(out.join('\n'));
  };

  let body = render(3000, 2000, 220, true), level = 'full';
  if (body.length > BUDGET) { body = render(1500, 900, 120, true); level = 'tight'; }
  if (body.length > BUDGET) { body = render(1000, 500, 0, false); level = 'conversation-only'; }
  if (body.length > BUDGET) {
    const keep = Math.floor(BUDGET * 0.48);
    body = body.slice(0, keep) + `\n\n[... MIDDLE OF SESSION CUT: ${body.length - 2 * keep} characters dropped to fit the digest budget ...]\n\n` + body.slice(-keep);
    level = 'conversation-only, middle cut';
  }

  const ts0 = firstTs || stat.mtime.toISOString();
  const date = localDate(ts0);
  const id8 = id.slice(0, 8);
  const group = groupOf(dirName);
  const slug = slugify(title);
  const base = `${date}-${id8}${slug ? '-' + slug : ''}`;
  const pageRel = `wiki/sessions/${group}/${base}.md`;
  const digestRel = `wiki/raw/sessions/${group}/${date}-${id8}.md`;
  const toolTotal = Object.values(toolCounts).reduce((a, b) => a + b, 0);
  const lastMs = lastTs ? Date.parse(lastTs) : stat.mtimeMs;
  const status = lastMs < CUTOFF ? 'out-of-window'
    : (humanTurns === 0 && assistantChars === 0) ? 'empty'
    : (assistantChars === 0 && toolTotal === 0) ? 'no-response' : 'ok';

  const files = Object.entries(filesTouched).sort((a, b) => b[1] - a[1]);
  const header = [
    `# RAW DIGEST — session ${id}`,
    '',
    'Machine-made from the transcript. Immutable. Secrets redacted. Do not edit; regenerate with wiki/tools/digest-sessions.js.',
    '',
    `- session_id: ${id}`,
    `- title: ${title || '(none)'}`,
    `- group: ${group}`,
    `- worktree: ${worktreeOf(dirName) || '(none)'}`,
    `- cwd: ${cwd || '(unknown)'}`,
    `- git_branch: ${branch || '(unknown)'}`,
    `- entrypoint: ${entry || '(unknown)'}`,
    `- models: ${[...models].join(', ') || '(unknown)'}`,
    `- started: ${firstTs ? localStamp(firstTs) : '(unknown)'}`,
    `- ended: ${lastTs ? localStamp(lastTs) : '(unknown)'}`,
    `- human_turns: ${humanTurns}`,
    `- transcript: ${file.replace(/\\/g, '/')}`,
    `- transcript_mb: ${(stat.size / 1048576).toFixed(1)}`,
    `- digest_level: ${level}`,
    `- wiki_page: ${pageRel}`,
    '',
    '## Tool counts',
    Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}×${v}`).join(', ') || '(none)',
    '',
    `## Files written or edited (${files.length})`,
    ...(files.length ? files.slice(0, 80).map(([f, n]) => `- ${f.replace(/\\/g, '/')} (${n})`) : ['(none)']),
    ...(files.length > 80 ? [`- ... and ${files.length - 80} more`] : []),
    '',
    `## Git commits made (${commits.length})`,
    ...(commits.length ? commits.slice(0, 60).map(c => `- ${c}`) : ['(none)']),
    '',
    `## Push / PR / deploy / migration commands (${ships.length})`,
    ...(ships.length ? ships.slice(0, 40).map(c => `- ${c}`) : ['(none)']),
    '',
    '## Conversation',
  ].join('\n');

  const text = wrapLines(redact(header) + '\n' + body + '\n');
  const lineCount = text.split('\n').length;
  return { id, id8, group, date, title: title || null, status, humanTurns, digestRel, pageRel, text, lines: lineCount, chars: text.length, transcript: file.replace(/\\/g, '/'), transcriptMb: +(stat.size / 1048576).toFixed(1), level, started: firstTs, ended: lastTs };
}

// ---------- main ----------
if (!ONLY) fs.rmSync(RAW, { recursive: true, force: true });
const manifest = [];
for (const dirName of fs.readdirSync(PROJECTS)) {
  const dir = path.join(PROJECTS, dirName);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.jsonl')) continue;
    if (ONLY && !f.startsWith(ONLY)) continue;
    const file = path.join(dir, f);
    if (fs.statSync(file).mtimeMs < CUTOFF) continue;
    let d;
    try { d = digest(file, dirName); }
    catch (e) { manifest.push({ id: path.basename(f, '.jsonl'), status: 'digest-failed', error: String(e.message || e), transcript: file.replace(/\\/g, '/') }); continue; }
    if (d.status === 'ok' || d.status === 'no-response') {
      const out = path.join(VAULT, d.digestRel);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, d.text, 'utf8');
    }
    const { text, ...row } = d;
    manifest.push(row);
  }
}
manifest.sort((a, b) => String(a.started || '').localeCompare(String(b.started || '')));
if (!ONLY) {
  fs.mkdirSync(path.join(WIKI, 'raw'), { recursive: true });
  fs.writeFileSync(path.join(WIKI, 'raw', 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}
const ok = manifest.filter(m => m.status === 'ok');
const chars = ok.reduce((s, m) => s + m.chars, 0);
console.log(JSON.stringify({
  sessions: manifest.length, ok: ok.length,
  empty: manifest.filter(m => m.status === 'empty').length,
  noResponse: manifest.filter(m => m.status === 'no-response').length,
  outOfWindow: manifest.filter(m => m.status === 'out-of-window').length,
  failed: manifest.filter(m => m.status === 'digest-failed').length,
  totalChars: chars, estTokens: Math.round(chars / 3.6),
  maxChars: Math.max(0, ...ok.map(m => m.chars)),
  byLevel: ok.reduce((a, m) => (a[m.level] = (a[m.level] || 0) + 1, a), {}),
  byGroup: ok.reduce((a, m) => (a[m.group] = (a[m.group] || 0) + 1, a), {}),
}, null, 2));
