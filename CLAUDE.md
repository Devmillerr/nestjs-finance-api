## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Session Continuity & Project Tracking

This project tracks progress in `STATUS.md` at the repository root.

### Session Startup

Before analyzing or modifying the project:

- Read `STATUS.md` first.
- Continue from the recorded project state.
- Do not repeat previous audits unless explicitly requested.
- Use `graphify query/path/explain` before broad source browsing when applicable.

### Progress Tracking

Update `STATUS.md` only when real project changes were made.

Keep it synchronized with:

- Current stage.
- Completed work.
- Work in progress.
- Remaining tasks.
- Important technical decisions.
- Validation results (only if actually executed).

### Daily Progress

At the end of any coding session that modifies code, provide:

- Date.
- Implemented.
- Fixed.
- Files/modules changed.
- Validation executed.
- Pending work.

### Validation Rules

Never claim that build, lint, type-check, or tests passed unless they were actually executed.

### Git Rules

Before running `git add` or `git commit`:

- Show the proposed commits.
- List included files.
- List excluded files.
- Wait for explicit user approval.

### Session Close

Before ending a coding session:

- Update `STATUS.md`.
- Provide the Daily Progress summary.
- Clearly state the next task for the following session.
