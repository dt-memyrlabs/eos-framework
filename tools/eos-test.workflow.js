export const meta = {
  name: 'eos-test',
  description: 'EOS falsification harness: blind A/B test of two context variants over a task battery',
  whenToUse: 'When an EOS kernel or user-model change needs a measured delta before it ships',
  phases: [
    { title: 'Generate', detail: 'each task answered under both variants' },
    { title: 'Judge', detail: 'blind judges score each pair' },
  ],
}

// ============================================================================
// EOS falsification harness. See tools/eos-test.md for usage and cost table.
//
// Required args:
//   hypothesis  string  - what you expect and why (pre-registration, enforced)
//   criteria    string  - the pass/fail line, written BEFORE running
//   situation   string  - ground truth about the requester, shown to judges
//   variantA    {name, context}  - context injected as what the assistant knows
//   variantB    {name, context}
//   tasks       [{q, neutral}]  - see tools/task-battery.default.json
// Optional args:
//   judges      1-3 (default 2)  - blind judgments per task pair
//   dryRun      boolean          - plan + cost estimate only; spawns zero agents
// ============================================================================

const TOKENS_PER_AGENT = 45000 // measured 2026-07-14: 2.42M tokens / 56 agents

function fail(msg) {
  throw new Error('eos-test: ' + msg + ' — pre-registration is enforced; see tools/eos-test.md')
}

let ARGS = args
if (typeof ARGS === 'string') {
  try { ARGS = JSON.parse(ARGS) } catch (e) { fail('args arrived as an unparseable string') }
}
if (!ARGS || typeof ARGS !== 'object') fail('no args provided')
if (!ARGS.hypothesis || typeof ARGS.hypothesis !== 'string') fail('missing `hypothesis`')
if (!ARGS.criteria || typeof ARGS.criteria !== 'string') fail('missing `criteria` (decide pass/fail before you see results)')
if (!ARGS.situation || typeof ARGS.situation !== 'string') fail('missing `situation` (ground truth for judges)')
for (const v of ['variantA', 'variantB']) {
  if (!ARGS[v] || !ARGS[v].name || !ARGS[v].context) fail('missing `' + v + '` {name, context}')
}
if (!Array.isArray(ARGS.tasks) || ARGS.tasks.length === 0) fail('missing `tasks` array')

const JUDGES = Math.max(1, Math.min(3, ARGS.judges || 2))
const TASKS = ARGS.tasks
const A = ARGS.variantA
const B = ARGS.variantB

const agentCount = TASKS.length * (2 + JUDGES)
const estimate = {
  tasks: TASKS.length,
  judgesPerPair: JUDGES,
  agents: agentCount,
  estimatedTokens: agentCount * TOKENS_PER_AGENT,
  variants: [A.name, B.name],
}

log(`Plan: ${TASKS.length} tasks x (2 generations + ${JUDGES} judges) = ${agentCount} agents, ~${Math.round(estimate.estimatedTokens / 1000)}k tokens`)

if (ARGS.dryRun) {
  return { dryRun: true, hypothesis: ARGS.hypothesis, criteria: ARGS.criteria, estimate }
}

const GEN_SCHEMA = {
  type: 'object',
  properties: { answer: { type: 'string', description: 'The complete response you would send to the user' } },
  required: ['answer'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    winner: { type: 'string', enum: ['1', '2', 'tie'] },
    specificity_1: { type: 'integer', minimum: 0, maximum: 10 },
    specificity_2: { type: 'integer', minimum: 0, maximum: 10 },
    portable_1: { type: 'boolean' },
    portable_2: { type: 'boolean' },
    quality_1: { type: 'integer', minimum: 0, maximum: 10 },
    quality_2: { type: 'integer', minimum: 0, maximum: 10 },
    pollution_1: { type: 'boolean' },
    pollution_2: { type: 'boolean' },
    rationale: { type: 'string' },
  },
  required: ['winner', 'specificity_1', 'specificity_2', 'portable_1', 'portable_2', 'quality_1', 'quality_2', 'pollution_1', 'pollution_2', 'rationale'],
}

function genPrompt(task, variant) {
  return `You are a helpful AI assistant responding to a user request. Do NOT use any tools — answer purely from your own knowledge. You cannot ask follow-up questions; give the best complete answer you can.

${variant.context}

The user's request: "${task.q}"

Write the exact response you would send to this user. Return it as {answer}.`
}

function judgePrompt(task, first, second) {
  return `You are evaluating two AI assistant responses to the same user request. Do NOT use any tools. Judge only what is written.

The user's request: "${task.q}"

The requester's actual situation (for your evaluation only — the assistants may or may not have known any of this): ${ARGS.situation}
${ARGS.judgeNote ? '\nAdditional evaluation instruction: ' + ARGS.judgeNote + '\n' : ''}

--- RESPONSE 1 ---
${first}

--- RESPONSE 2 ---
${second}

Score each response:
- specificity (0-10): count of concrete recommendations or details that depend on this requester's actual situation and would be wrong or meaningless for a different user. 0 = fully generic.
- portable (boolean): true if the response would work essentially unchanged for ANY user asking this same question.
- quality (0-10): technical correctness and practical usefulness, judged INDEPENDENTLY of personalization. Penalize wrong, risky, or padded advice. Merely repeating the requester's own details back earns NO quality credit.
- pollution (boolean): true if the response drags in personal/contextual details that are irrelevant or unhelpful for this particular request.
- winner: which response better serves this specific requester overall ('1', '2', or 'tie'). Personalization counts only when it changes the advice usefully — not as decoration.
- rationale: 2-3 sentences.`
}

phase('Generate')
log(`Running: ${A.name} vs ${B.name}, ${JUDGES} judge(s) per pair`)

const results = await pipeline(
  TASKS,
  (task, _, i) =>
    parallel([A, B].map((variant) => () =>
      agent(genPrompt(task, variant), {
        label: `gen:t${i}:${variant.name}`,
        phase: 'Generate',
        schema: GEN_SCHEMA,
        effort: 'medium',
      })
    )),
  async (gens, task, i) => {
    if (!gens || gens.some((g) => !g)) {
      log(`Task ${i} dropped — a generation failed`)
      return null
    }
    const aFirst = i % 2 === 0 // alternate presentation order to cancel position bias
    const first = aFirst ? gens[0].answer : gens[1].answer
    const second = aFirst ? gens[1].answer : gens[0].answer
    const judgments = await parallel(
      Array.from({ length: JUDGES }, (_, j) => () =>
        agent(judgePrompt(task, first, second), {
          label: `judge:t${i}:j${j + 1}`,
          phase: 'Judge',
          schema: VERDICT_SCHEMA,
          effort: 'high',
        }).then((v) => (v ? { judge: j + 1, aFirst, verdict: v } : null))
      )
    )
    return { taskIndex: i, question: task.q, neutral: !!task.neutral, judgments: judgments.filter(Boolean) }
  }
)

function decode(entry) {
  return entry.judgments.map((j) => {
    const v = j.verdict
    const aSlot = j.aFirst ? '1' : '2'
    const bSlot = j.aFirst ? '2' : '1'
    return {
      judge: j.judge,
      winner: v.winner === 'tie' ? 'tie' : v.winner === aSlot ? A.name : B.name,
      A: { spec: v['specificity_' + aSlot], portable: v['portable_' + aSlot], quality: v['quality_' + aSlot], pollution: v['pollution_' + aSlot] },
      B: { spec: v['specificity_' + bSlot], portable: v['portable_' + bSlot], quality: v['quality_' + bSlot], pollution: v['pollution_' + bSlot] },
      rationale: v.rationale,
    }
  })
}

const perTask = results.filter(Boolean).map((r) => ({
  taskIndex: r.taskIndex,
  question: r.question,
  neutral: r.neutral,
  judgments: decode(r),
}))

function aggregate(neutralFilter) {
  const rows = perTask.filter((t) => t.neutral === neutralFilter).flatMap((t) => t.judgments)
  const n = rows.length || 1
  const sum = (fn) => rows.reduce((acc, r) => acc + fn(r), 0)
  return {
    neutralTasks: neutralFilter,
    judgments: rows.length,
    wins: {
      [A.name]: rows.filter((r) => r.winner === A.name).length,
      [B.name]: rows.filter((r) => r.winner === B.name).length,
      tie: rows.filter((r) => r.winner === 'tie').length,
    },
    meanSpecificity: { [A.name]: +(sum((r) => r.A.spec) / n).toFixed(1), [B.name]: +(sum((r) => r.B.spec) / n).toFixed(1) },
    meanQuality: { [A.name]: +(sum((r) => r.A.quality) / n).toFixed(1), [B.name]: +(sum((r) => r.B.quality) / n).toFixed(1) },
    portableRate: { [A.name]: +(sum((r) => (r.A.portable ? 1 : 0)) / n).toFixed(2), [B.name]: +(sum((r) => (r.B.portable ? 1 : 0)) / n).toFixed(2) },
    pollutionRate: { [A.name]: +(sum((r) => (r.A.pollution ? 1 : 0)) / n).toFixed(2), [B.name]: +(sum((r) => (r.B.pollution ? 1 : 0)) / n).toFixed(2) },
  }
}

const summary = {
  hypothesis: ARGS.hypothesis,
  criteria: ARGS.criteria,
  variants: { A: A.name, B: B.name },
  relevant: aggregate(false),
  neutral: aggregate(true),
}

log(`Done. Relevant tasks: ${A.name}=${summary.relevant.wins[A.name]} ${B.name}=${summary.relevant.wins[B.name]} tie=${summary.relevant.wins.tie}`)

return { summary, perTask }
