# Quick Start

Get EOS running in 5 minutes.

---

## 1. Copy the kernel

```bash
cp kernel/CLAUDE.md ~/.claude/CLAUDE.md
```

On claude.ai, paste the kernel contents into your Project's Custom Instructions instead.

## 2. Copy skills

```bash
mkdir -p ~/.claude/skills/
cp -r skills/* ~/.claude/skills/
```

On claude.ai, upload skill files to your Project. See [installation.md](installation.md) for the full path listing.

## 3. Validate (Claude Code only)

```bash
bash tools/validate-skills.sh
```

All 18 skills should report OK. Fix any version mismatches or missing files before proceeding.

## 4. Start a conversation

Open Claude Code or start a new conversation in your claude.ai Project.

### What to expect

**Runtime header on every response.** The first thing you see:

```
[lens:4] [sim-d:3] [CCI-G:n/a] [sim:M] [pos:held|basis:init] [tds:off] [ltm:--]
```

This is the system's live diagnostic state. It appears on every response without exception.

**Persistence tier detection.** The `eos-memory-mgmt` skill runs automatically and classifies your storage tier:
- Tier A if Notion MCP is connected.
- Tier C if no external persistence is available.
- You will see a brief note about detected tier.

**Goal-locking before substantive work.** EOS will not produce substantive output without a locked goal. If you start with a request, it will extract the goal from your request or ask for one. Once locked, the goal anchors all downstream work -- simulation, trajectory enumeration, constraint testing, and regression protection all reference it.

**Simulation on every response.** At the default sim-depth of 3, viable trajectories are enumerated and each gets a failure mode test and a constraint test. The path with fewest assumptions wins. You will not see a separate "simulation narration" -- the confidence tag in the runtime header (`sim:H/M/L`) reflects the result, and the reasoning is embedded in the response itself.

**Dry, direct tone.** No hedging, no padding, no consultant-speak. Declarative sentences. Every sentence carries load. If something is uncertain, the uncertainty is stated before the answer, not after it as a caveat.

## 5. Try the controls

Adjust the two axes during conversation:

- `"lens 2"` -- See what the training prior wants to produce alongside the user-context output. Diagnostic mode.
- `"lens 5"` -- Full displacement. Convention gets zero tokens.
- `"sim 5"` or `"adversarial"` -- Generate the strongest counterargument to the current recommendation. It survives or it dies.
- `"sim 7"` or `"exhaustive"` -- Maximum trajectory depth. Every assumption falsification-tested.
- `"dial down"` -- Reduce lens toward training priors.
- `"go deeper"` -- Increase simulation depth.

## 6. Populate the USER MODEL (when ready)

The kernel works without a populated USER MODEL, but displacement strength is proportional to specificity. Edit `~/.claude/CLAUDE.md` and fill in the USER MODEL template with concrete details about your domain, methods, and current work. See [installation.md](installation.md) for the template and guidance.

---

## What happens next

- Start a project: say "new project" to trigger `eos-cold-start`.
- The system will ask for a project name and one-line goal.
- Goal gets locked (Rule 1). CCI-G tracking begins.
- If Notion is available, a Hub entry and Spoke page are created automatically.
- Work proceeds under goal-lock with simulation, regression protection, and drift monitoring active.

For the full architectural explanation, see [architecture.md](architecture.md).
