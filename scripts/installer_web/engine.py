"""Installer web UI engine for project skills and Codex agents."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Any

try:
    import tomllib
except ModuleNotFoundError:  # pragma: no cover - Python < 3.11 fallback
    import tomli as tomllib  # type: ignore[no-redef]


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from install_agent_tools import (  # noqa: E402
    REPO_ROOT,
    build_install_plan,
    discover_agents,
    discover_skills,
    resolve_targets,
    run_install,
)


FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---", re.DOTALL)
FIELD_RE = re.compile(r"^(\w+):\s*(.+)$", re.MULTILINE)
SKILL_HINT_RE = re.compile(r"Use the `([^`]+)` skill\.", re.IGNORECASE)


def _relative(path: Path) -> str:
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def _parse_skill_frontmatter(skill_path: Path) -> dict[str, str]:
    skill_md = skill_path / "SKILL.md"
    result = {"name": skill_path.name, "description": ""}
    if not skill_md.exists():
        return result

    content = skill_md.read_text(encoding="utf-8")
    match = FRONTMATTER_RE.match(content)
    if not match:
        return result

    for field_match in FIELD_RE.finditer(match.group(1)):
        key = field_match.group(1).strip()
        value = field_match.group(2).strip()
        if key in result:
            result[key] = value
    return result


def get_skills() -> list[dict[str, Any]]:
    skills = []
    for skill_path in discover_skills(None):
        metadata = _parse_skill_frontmatter(skill_path)
        manifest = skill_path / "skill.manifest.json"
        links = skill_path / "references" / "links.md"
        skills.append(
            {
                "name": metadata["name"],
                "description": metadata["description"],
                "path": _relative(skill_path),
                "hasManifest": manifest.exists(),
                "hasLinks": links.exists(),
            }
        )
    return skills


def get_agents() -> list[dict[str, Any]]:
    agents = []
    for agent_path in discover_agents(None):
        data = tomllib.loads(agent_path.read_text(encoding="utf-8"))
        instructions = data.get("developer_instructions", "")
        skill_match = SKILL_HINT_RE.search(instructions)
        agents.append(
            {
                "name": data.get("name", agent_path.stem),
                "description": data.get("description", ""),
                "path": _relative(agent_path),
                "model": data.get("model", ""),
                "reasoningEffort": data.get("model_reasoning_effort", ""),
                "sandboxMode": data.get("sandbox_mode", ""),
                "skill": skill_match.group(1) if skill_match else "",
            }
        )
    return agents


def get_layout(scope: str) -> dict[str, str]:
    targets = resolve_targets(scope)
    return {
        "scope": scope,
        "skillsDir": str(targets.skills_dir),
        "agentsDir": str(targets.agents_dir),
    }


def get_catalog(scope: str = "project") -> dict[str, Any]:
    return {
        "repoRoot": str(REPO_ROOT),
        "layout": get_layout(scope),
        "skills": get_skills(),
        "agents": get_agents(),
    }


def preview_install(
    scope: str,
    selected_skills: list[str],
    selected_agents: list[str],
) -> dict[str, Any]:
    targets, actions = build_install_plan(scope, selected_skills, selected_agents)
    return {
        "layout": {
            "scope": scope,
            "skillsDir": str(targets.skills_dir),
            "agentsDir": str(targets.agents_dir),
        },
        "actions": [
            {
                "kind": action.kind,
                "source": _relative(action.source),
                "destination": str(action.destination),
                "status": "would-copy",
                "message": action.message,
            }
            for action in actions
        ],
        "counts": _counts(actions),
    }


def execute_install(
    scope: str,
    selected_skills: list[str],
    selected_agents: list[str],
) -> dict[str, Any]:
    actions = run_install(scope, selected_skills, selected_agents, dry_run=False)
    return {
        "actions": [
            {
                "kind": action.kind,
                "source": _relative(action.source),
                "destination": str(action.destination),
                "status": "copied",
                "message": action.message,
            }
            for action in actions
        ],
        "counts": _counts(actions),
    }


def _counts(actions: list[Any]) -> dict[str, int]:
    return {
        "skills": sum(1 for action in actions if action.kind == "skill"),
        "agents": sum(1 for action in actions if action.kind == "agent"),
        "total": len(actions),
    }
