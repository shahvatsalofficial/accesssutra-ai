# IDE / Agent Host Compatibility

Canonical portable sources: `AGENTS.md`, `skills/*/SKILL.md`, `agents/*.md`, `workflows/*.md`, `rules/*.md`, JSON schemas and CLI. Host-specific instructions under `adapters/ide/` are **templates**. The `install-ide` CLI copies a project-local instruction bundle and does not prove that an IDE has loaded or executed it.

| Host | Pack path | State |
| --- | --- | --- |
| Claude Code | `adapters/ide/claude/` and `.claude/agents/` | Instructions packaged; native runtime untested |
| Cursor | `adapters/ide/cursor/` | Rule template packaged; untested |
| OpenAI Codex | `adapters/ide/codex/` | AGENTS.md template; untested |
| Gemini CLI | `adapters/ide/gemini/` | GEMINI.md template; untested |
| GitHub Copilot | `adapters/ide/copilot/` | copilot-instructions template; untested |
| Windsurf | `adapters/ide/windsurf/` | Rule template; untested |
| Cline | `adapters/ide/cline/` | Rule template; untested |
| Roo Code | `adapters/ide/roo/` | Rule template; untested |
| Continue | `adapters/ide/continue/` | Rule template; untested |

Host conventions evolve; verify against current official docs before publishing compatibility claims. Unsupported hosts can run the same CLI and consume JSON/Markdown reports. Global installs and plugin permissions require explicit user approval.
