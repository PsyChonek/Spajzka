# Commands

`commands/` is the single source of truth for all command/skill prompts.
Tool-specific locations (`.claude/commands/`) are auto-generated mirrors — do not edit them directly.

## Available Commands

| Command | Description |
|---------|-------------|
| [build](build.command.md) | Build api + web + mcp (with optional API-client regeneration) |
| [bump](bump.command.md) | Bump the Spajzka version across workspace `package.json` files |
| [dev](dev.command.md) | Start the hot-reload dev environment (Docker or local Node) |
| [push](push.command.md) | Stage, commit, and push all current changes |
| [release](release.command.md) | Cut a release: bump, tag, push, manual SSH deploy |
| [test](test.command.md) | Run the Playwright e2e suite |

## How to add a command

1. Create `commands/[name].command.md` with the command prompt
2. Re-run `/claude-template:update` to generate `.claude/commands/` mirrors
3. The command will be available as `/[name]` in Claude Code

## How to edit a command

Edit `commands/[name].command.md` — never edit the auto-generated copies.
Re-run `/claude-template:update` afterwards.
