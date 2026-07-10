# Install astro-dev for Codex

## Preferred

```bash
npx skills add gigio1023/astro-dev-skill@astro-dev --agent codex
```

## Manual install

1. Clone the repo:

```bash
mkdir -p ~/.local/share
git clone https://github.com/gigio1023/astro-dev-skill.git ~/.local/share/astro-dev-skill
```

2. Copy the skill into Codex skills:

```bash
mkdir -p ~/.agents/skills
cp -R ~/.local/share/astro-dev-skill/skills/astro-dev ~/.agents/skills/
```

3. Restart Codex.
