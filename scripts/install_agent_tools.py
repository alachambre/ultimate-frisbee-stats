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


@dataclass(frozen=True)
class InstallAction:
    kind: str
    source: Path
    destination: Path
    message: str


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

    if selected is not None:
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

    if selected is not None:
        selected_set = {f"{name}.toml" for name in selected}
        agents = [path for path in agents if path.name in selected_set]
        missing = sorted(name.removesuffix(".toml") for name in selected_set - {path.name for path in agents})
        if missing:
            raise SystemExit(f"Unknown agent(s): {', '.join(missing)}")

    return agents


def build_install_plan(
    scope: str,
    selected_skills: list[str] | None = None,
    selected_agents: list[str] | None = None,
) -> tuple[InstallTargets, list[InstallAction]]:
    targets = resolve_targets(scope)
    skills = discover_skills(selected_skills)
    agents = discover_agents(selected_agents)
    actions = [
        InstallAction(
            kind="skill",
            source=skill,
            destination=targets.skills_dir / skill.name,
            message=f"skill  {skill.relative_to(REPO_ROOT)} -> {targets.skills_dir / skill.name}",
        )
        for skill in skills
    ]
    actions.extend(
        InstallAction(
            kind="agent",
            source=agent,
            destination=targets.agents_dir / agent.name,
            message=f"agent  {agent.relative_to(REPO_ROOT)} -> {targets.agents_dir / agent.name}",
        )
        for agent in agents
    )
    return targets, actions


def run_install(
    scope: str,
    selected_skills: list[str] | None = None,
    selected_agents: list[str] | None = None,
    dry_run: bool = False,
) -> list[InstallAction]:
    targets, actions = build_install_plan(scope, selected_skills, selected_agents)

    if not dry_run:
        targets.skills_dir.mkdir(parents=True, exist_ok=True)
        targets.agents_dir.mkdir(parents=True, exist_ok=True)

    for action in actions:
        if dry_run:
            continue
        if action.kind == "skill":
            shutil.copytree(action.source, action.destination, dirs_exist_ok=True)
        elif action.kind == "agent":
            action.destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(action.source, action.destination)
        else:
            raise SystemExit(f"Unknown install action kind: {action.kind}")

    return actions


def install() -> None:
    args = parse_args()
    actions = run_install(args.scope, args.skills, args.agents, dry_run=args.dry_run)

    print(f"Installing agent tools with scope={args.scope}")
    for action in actions:
        print(action.message)
    skill_count = sum(1 for action in actions if action.kind == "skill")
    agent_count = sum(1 for action in actions if action.kind == "agent")
    verb = "Planned" if args.dry_run else "Installed"
    print(f"Done. {verb} {skill_count} skill(s) and {agent_count} agent definition(s).")


if __name__ == "__main__":
    install()
