---
name: eos-constraint-graph
version: "v1.0.0"
kernel_compat: "v20.0.0"
description: "Graph-based constraint and decision memory. Replaces linear tracking of locked variables, assumptions, and decisions with a queryable dependency graph. Nodes are variables, assumptions, decisions, and constraints. Edges are typed relationships (depends-on, validates, contradicts, derived-from). Triggers when goal is locked and first variable is locked, or on explicit request. Enables cascade unlocking (Rule 5), dependency-aware simulation (Rule 2), and impact analysis queries. Do NOT trigger before goal lock — graph requires at least one locked variable to initialize."
---

# EOS Constraint Graph — Dependency Memory

**Trigger:** Goal locked AND first variable locked, OR explicit request ("show graph", "what depends on X", "impact analysis").
**Deactivates:** Never — persists for project lifetime once initialized.
**Kernel rules in play:** Rule 2 (Dependency Tracing, Simulation), Rule 5 (Regression Lock, Cascade Unlocking), Rule 3 (CCI).

---

## G1. Graph Structure

### Node Types

| Type | Created when | Fields |
|---|---|---|
| `variable` | Variable locked (Rule 5) | name, value, locked_date, lock_basis, status (locked/unlocked/cascade-flagged) |
| `assumption` | Assumption declared (Rule 2) | hypothesis, operational_definition, falsification_criterion, source (user/simulation/feasibility-thesis), status (open/validated/invalidated) |
| `decision` | Decision logged (project-mgmt C2) | description, tag (R/I), rationale, failure_modes, rollback |
| `constraint` | Constraint classified (Rule 2) | description, classification (Hard/Structural/Assumed), evidence, promotion_history |
| `goal` | Goal locked (Rule 1) | statement, thesis_summary. Singleton — one per project. Root node. |

### Edge Types

| Type | Direction | Meaning |
|---|---|---|
| `depends-on` | A → B | A's validity requires B to hold. If B unlocks, A is cascade-flagged. |
| `validates` | A → B | A provides evidence that B holds. If A is invalidated, B loses one validation source. |
| `contradicts` | A ↔ B | A and B cannot both hold. Bidirectional. Rule 4 fires. |
| `derived-from` | A → B | A was created as a consequence of B. Informational — no cascade. |
| `blocks` | A → B | A must resolve before B can proceed. Active blocker relationship. |

### Invariants

- Every node except `goal` must have at least one `depends-on` or `derived-from` edge connecting it to the graph. Orphan nodes are flagged.
- `contradicts` edges trigger immediate Rule 4 disclosure.
- `goal` node is the root. All paths ultimately trace back to it.

---

## G2. Graph Operations

### G2.1: Add Node
On any decision-lock event (Rule 6 Tier 1/2/3):
1. Create node with appropriate type and fields.
2. Infer edges — ask: "What does this depend on? What does it validate? Does it contradict anything?"
3. Edge inference is Tier 1 (autonomous) for obvious dependencies. Ambiguous edges are stated inline for user confirmation.
4. Update Notion Spoke `CONSTRAINT GRAPH` section.

### G2.2: Cascade Query
**Trigger:** Variable unlock request (Rule 5) or assumption invalidation.

1. Identify target node.
2. Traverse all `depends-on` edges downstream (nodes that depend on target).
3. Flag each downstream node as `cascade-flagged`.
4. Report: "Unlocking [X] affects [N] downstream nodes: [list with types]."
5. Each flagged node enters re-simulation queue (Rule 2).
6. Re-simulation results either re-lock (with updated basis) or unlock (propagating cascade further).

Cascade is Tier 1 (automatic). Results are disclosed in simulation output.

### G2.3: Impact Analysis
**Trigger:** User asks "what depends on X" / "what breaks if X changes" / "impact analysis".

1. Run cascade query (G2.2) in read-only mode — no actual unlocking.
2. Return structured report: direct dependents, transitive dependents, contradiction risks.
3. Include confidence assessment: how many downstream nodes have alternative validation sources.

### G2.4: Path Query
**Trigger:** User asks "how does X connect to Y" / "why does X matter for the goal".

1. Find shortest path(s) between two nodes.
2. Report each edge traversed with its type and direction.
3. If no path exists, state that — the nodes are structurally independent.

### G2.5: Contradiction Detection
On every node addition (G2.1):
1. Check new node against all existing nodes for potential `contradicts` edges.
2. Obvious contradictions (same variable, opposite values) are auto-flagged.
3. Subtle contradictions (tension but not direct opposition) are stated inline for user assessment.
4. Any `contradicts` edge triggers Rule 4 immediately.

---

## G3. Persistence

### Notion (Tier A)
The graph is serialized as a structured section in the project Spoke:

```
## CONSTRAINT GRAPH

### Nodes
| id | type | name/description | status | fields... |

### Edges
| source | target | type | created | basis |
```

Updated on every graph-modifying operation (G2.1, cascade resolution).

### In-Context (Working Memory)
A compact summary stays in working context:

```
## GRAPH STATE
nodes: [count by type]
edges: [count by type]
cascade_queue: [any flagged nodes]
contradictions: [any active]
last_modified: [exchange]
```

Full graph lives in Notion. Compact summary lives in context. Dereference via Notion query when full graph needed for simulation.

### Memex Integration
If graph grows beyond 20 nodes, compress the full Notion serialization into a Memex index entry (`[project]-constraint-graph-full`). The in-context compact summary remains. Dereference via `MEMEX READ` when full traversal needed.

---

## G4. CCI Integration

The constraint graph contributes to CCI-G:
- **Graph connectivity:** All decisions and locked variables connected to goal → full credit.
- **Orphan nodes:** Any node without path to goal → CCI-G penalty + flag.
- **Open contradictions:** Any unresolved `contradicts` edge → CCI-G capped at current level until resolved.
- **Cascade queue:** Non-empty cascade queue → CCI-G cannot advance until queue clears.

---

## G5. Initialization

On first trigger (goal locked + first variable locked):

1. Create `goal` node from Rule 1 locked goal.
2. Create first `variable` node from the locked variable.
3. Add `depends-on` edge from variable to goal (or appropriate edge type).
4. Initialize compact summary in working context.
5. Write initial graph to Notion Spoke.
6. Declare: `[constraint-graph: initialized | 2 nodes, 1 edge]`

Subsequent variables, assumptions, decisions, and constraints are added incrementally via G2.1.

---

## G6. Runtime Header Extension

When active, extend runtime header:
```
[graph:N nodes|M edges|cascade:clear/N flagged]
```

---

## Failure Modes

| Failure | Detection | Response |
|---|---|---|
| Orphan node created | G2.1 invariant check | Flag, ask user for edge assignment |
| Cascade loop | Node flags itself during cascade traversal | Detect cycle, report, break at longest edge |
| Graph exceeds working memory | >20 nodes in compact summary | Trigger Memex compression (G3) |
| Notion write fails during cascade | Write error during G2.2 | Complete cascade in-context, retry Notion write, flag if persistent |
| Edge inference wrong | User corrects an auto-inferred edge | Remove/replace edge, re-run affected cascade queries |

---

## Cross-References

- **Rule 2 (Dependency Tracing):** Graph is the dependency map. Simulation queries graph before running.
- **Rule 2 (Assumption Handling):** Assumptions are graph nodes. Invalidation triggers cascade.
- **Rule 4 (Contradiction):** `contradicts` edges are Rule 4 triggers.
- **Rule 5 (Regression Lock):** Lock/unlock operates on graph nodes. Cascade unlocking is the graph-native extension.
- **Rule 3 (CCI):** Graph health feeds CCI-G (G4).
- **eos-project-mgmt:** Decisions (C2) create graph nodes. Limiter Analysis (C7) operates on constraint nodes.
- **eos-memex:** Large graphs compress per Memex protocol.
- **eos-memory-mgmt:** Graph state writes to Notion follow M4 writeback policy.
