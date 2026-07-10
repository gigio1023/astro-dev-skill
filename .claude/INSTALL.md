# Install astro-dev for Claude Code

## Preferred

```bash
npx skills add gigio1023/astro-dev-skill@astro-dev --agent claude-code
```

## Manual install

```bash
git clone https://github.com/gigio1023/astro-dev-skill.git ~/.claude/astro-dev-skill
mkdir -p ~/.claude/skills
cp -R ~/.claude/astro-dev-skill/skills/astro-dev ~/.claude/skills/
```

Claude Code normally detects `SKILL.md` changes live. Restart only if the new
top-level skills directory was created after the session started or the skill
does not appear.
