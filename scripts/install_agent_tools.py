#!/usr/bin/env python3
"""Install project skills and Codex subagent definitions.

The source of truth stays versioned in:
- skills/<skill-name>/
- agents/<agent-name>.toml

Project scope installs into ignored local folders:
- .agents/skills/
- .codex/agents/

User scope installs into:
- ~/.agents/skills/
- ~/.codex/agents/
"""

from __future__ import annotations

import argparse
import shutil
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
SOURCE_SKILLS_DIR = REPO_ROOT / "skills"
SOURCE_AGENTS_DIR = REPO_ROOT / "agents"


@dataclass(frozen=True)
class InstallTargets:
    skills_dir: Path
    agents_dir: Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Install Monkey Statistics skills and Codex subagents."
    )
    parser.add_argument(
        "--scope",
        choices=("project", "user"),
        default="project",
        help="Install into this repo's ignored local folders or into the current user's Codex folders.",
    )
    parser.add_argument(
        "--skill",
        action="append",
        dest="skills",
        help="Install only this skill. Can be passed multiple times.",
    )
    parser.add_argument(
        "--agent",
        action="append",
        dest="agents",
        help="Install only this agent TOML name, without .toml. Can be passed multiple times.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be installed without copying files.",
    )
    return parser.parse_args()


def resolve_targets(scope: str) -> InstallTargets:
    if scope == "project":
        return InstallTargets(
            skills_dir=REPO_ROOT / ".agents" / "skills",
            agents_dir=REPO_ROOT / ".codex" / "agents",
        )

    home = Path.home()
    return InstallTargets(
        skills_dir=home / ".agents" / "skills",
        agents_dir=home / ".codex" / "agents",
    )


def discover_skills(selected: list[str] | None) -> list[Path]:
    if not SOURCE_SKILLS_DIR.exists():
        raise SystemExit(f"Missing source skills directory: {SOURCE_SKILLS_DIR}")

    skills = sorted(
        path
        for path in SOURCE_SKILLS_DIR.iterdir()
        if path.is_dir() and (path / "SKILL.md").is_file()
    )

    if selected:
        selected_set = set(selected)
        skills = [path for path in skills if path.name in selected_set]
        missing = sorted(selected_set - {path.name for path in skills})
        if missing:
            raise SystemExit(f"Unknown skill(s): {', '.join(missing)}")

    return skills


def discover_agents(selected: list[str] | None) -> list[Path]:
    if not SOURCE_AGENTS_DIR.exists():
        raise SystemExit(f"Missing source agents directory: {SOURCE_AGENTS_DIR}")

    agents = sorted(SOURCE_AGENTS_DIR.glob("*.toml"))

    if selected:
        selected_set = {f"{name}.toml" for name in selected}
        agents = [path for path in agents if path.name in selected_set]
        missing = sorted(name.removesuffix(".toml") for name in selected_set - {path.name for path in agents})
        if missing:
            raise SystemExit(f"Unknown agent(s): {', '.join(missing)}")

    return agents


def copy_skill(source: Path, destination_root: Path, dry_run: bool) -> None:
    destination = destination_root / source.name
    print(f"skill  {source.relative_to(REPO_ROOT)} -> {destination}")
    if dry_run:
        return
    shutil.copytree(source, destination, dirs_exist_ok=True)


def copy_agent(source: Path, destination_root: Path, dry_run: bool) -> None:
    destination = destination_root / source.name
    print(f"agent  {source.relative_to(REPO_ROOT)} -> {destination}")
    if dry_run:
        return
    destination_root.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def install() -> None:
    args = parse_args()
    targets = resolve_targets(args.scope)
    skills = discover_skills(args.skills)
    agents = discover_agents(args.agents)

    print(f"Installing agent tools with scope={args.scope}")
    if not args.dry_run:
        targets.skills_dir.mkdir(parents=True, exist_ok=True)
        targets.agents_dir.mkdir(parents=True, exist_ok=True)

    for skill in skills:
        copy_skill(skill, targets.skills_dir, args.dry_run)

    for agent in agents:
        copy_agent(agent, targets.agents_dir, args.dry_run)

    print(f"Done. Installed {len(skills)} skill(s) and {len(agents)} agent definition(s).")


if __name__ == "__main__":
    install()
