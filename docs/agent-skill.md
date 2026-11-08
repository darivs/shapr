# Install shapr-for-agents

`skills/shapr-for-agents/` holds the design rules an agent follows when it changes any Herdr
surface. Install it as you install any skill: Claude Code loads skills from `~/.claude/skills/`,
Codex and other agents that read the shared folder from `~/.agents/skills/`. Run the commands from
your clone of this repo. A link follows the clone, so `git pull` brings the next agent the new
rules; a copy stays as it is until you copy again.

```sh
# Claude Code, link
mkdir -p ~/.claude/skills
ln -sfn "$PWD/skills/shapr-for-agents" ~/.claude/skills/shapr-for-agents
```

```sh
# Claude Code, copy
mkdir -p ~/.claude/skills
cp -R skills/shapr-for-agents ~/.claude/skills/
```

```sh
# Codex and other agents, link
mkdir -p ~/.agents/skills
ln -sfn "$PWD/skills/shapr-for-agents" ~/.agents/skills/shapr-for-agents
```

```sh
# Codex and other agents, copy
mkdir -p ~/.agents/skills
cp -R skills/shapr-for-agents ~/.agents/skills/
```

To remove it, delete the link or the copy; the skill writes nothing anywhere else, and a removed
link leaves your clone as it was:

```sh
# Remove
rm -rf ~/.claude/skills/shapr-for-agents ~/.agents/skills/shapr-for-agents
```

`test/skill-install.test.js` runs every block here in a scratch home, and checks that the
README's blocks match these.
