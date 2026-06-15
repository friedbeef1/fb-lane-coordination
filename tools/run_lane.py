#!/usr/bin/env python3
"""
Direct Lane Runner for Antigravity 2.0.

This script launches a direct interactive loop with a specialized lane agent
(Tech, Design, Business, or Product) after ensuring the task is claimed,
the branch is checked out, and file locks are applied via fb-lane.js.
"""

import argparse
import asyncio
import os
import re
import subprocess
import sys
from typing import List, Dict, Optional

from google.antigravity import Agent, LocalAgentConfig
from google.antigravity.types import CapabilitiesConfig, BuiltinTools, CustomSystemInstructions


def find_board_path(start_dir: str = ".") -> Optional[str]:
    """
    Search upwards from start_dir to find PROJECT_BOARD.md.

    This ensures that regardless of where the user runs the script within the
    workspace, the correct board path is discovered.
    """
    current_dir = os.path.abspath(start_dir)
    while True:
        board_path = os.path.join(current_dir, "PROJECT_BOARD.md")
        if os.path.exists(board_path):
            return board_path
        parent_dir = os.path.dirname(current_dir)
        if parent_dir == current_dir:
            break
        current_dir = parent_dir
    return None


def parse_board(board_path: str) -> List[Dict[str, str]]:
    """
    Parse PROJECT_BOARD.md tasks and details.

    Reads the table rows from the board and returns a list of task records
    matching the format of the javascript parser.
    """
    tasks: List[Dict[str, str]] = []
    with open(board_path, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.splitlines()
    for line in lines:
        match = re.match(
            r"^\|\s*(TASK-\w+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|",
            line,
        )
        if match:
            task_id = match.group(1).strip()
            if task_id != "ID" and not task_id.startswith("---"):
                tasks.append(
                    {
                        "id": task_id,
                        "status": match.group(2).strip(),
                        "owner": match.group(3).strip(),
                        "area": match.group(4).strip(),
                        "scope": match.group(5).strip(),
                        "locks": match.group(6).strip(),
                        "links": match.group(7).strip(),
                    }
                )
    return tasks


def get_current_branch() -> str:
    """
    Execute git command to retrieve the active local branch name.

    Returns the branch name, or raises an error if git command fails.
    """
    result = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


def run_claim(task_id: str, lane: str, locked_files: Optional[str]) -> None:
    """
    Call the local tools/fb-lane.js claim command.

    This ensures the branch is checked out, the board is updated,
    and locks are applied, maintaining compatibility with the core workflow.
    """
    cmd = ["node", "tools/fb-lane.js", "claim", task_id, lane]
    if locked_files:
        cmd.append(locked_files)

    print(f"🔄 Executing claim hook: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)


async def main() -> None:
    """
    Main entry point for parsing arguments and starting the agent loop.
    """
    parser = argparse.ArgumentParser(
        description="Run direct lane interactive agent sessions in Antigravity 2.0."
    )
    parser.add_argument(
        "lane",
        choices=["Tech", "Design", "Business", "Product", "tech", "design", "business", "product"],
        help="Target lane for the agent session",
    )
    parser.add_argument("task_id", help="The Task ID to execute (e.g. TASK-001)")
    parser.add_argument(
        "locked_files",
        nargs="?",
        default=None,
        help="Optional comma-separated list of files to lock",
    )

    args = parser.parse_args()

    # Normalize inputs
    lane = args.lane.capitalize()
    task_id = args.task_id.upper()
    locked_files = args.locked_files

    # Find the PROJECT_BOARD.md path
    board_path = find_board_path()
    if not board_path:
        print("❌ Error: PROJECT_BOARD.md not found in workspace hierarchy.", file=sys.stderr)
        sys.exit(1)

    workspace_dir = os.path.dirname(board_path)

    # Invoke claim hook to switch branch and lock resources
    try:
        run_claim(task_id, lane, locked_files)
    except subprocess.CalledProcessError as e:
        print(f"❌ Error claiming task: claim command exited with error", file=sys.stderr)
        sys.exit(1)

    # Parse board to extract details
    tasks = parse_board(board_path)
    task = next((t for t in tasks if t["id"] == task_id), None)
    if not task:
        print(f"❌ Error: Task {task_id} not found in PROJECT_BOARD.md after claiming.", file=sys.stderr)
        sys.exit(1)

    branch_name = get_current_branch()

    # Load lane-specific role instructions
    role_name = f"FB-{lane}"
    if lane == "Tech":
        role_instructions = (
            "- Only modify backend code, API endpoints, serverless functions, database schemas, and migration files. "
            "Do not touch stylesheets, UI layouts, or page style classes.\n"
            "- File Lock Boundary: You are strictly restricted to modifying files that are explicitly listed under the 'Locked Files' section. Writing to files outside this list is a boundary violation.\n"
            "- Compile and test your changes locally. Ensure functional tests pass before pushing."
        )
    elif lane == "Design":
        role_instructions = (
            "- Only modify styling files (CSS), layout geometry, design tokens, and static UI assets. "
            "Do not modify backend logic, API routes, or databases.\n"
            "- File Lock Boundary: You are strictly restricted to modifying files that are explicitly listed under the 'Locked Files' section. Writing to files outside this list is a boundary violation.\n"
            "- Run visual verification across mobile/desktop viewports (check for clipping and spacing integrity)."
        )
    elif lane == "Business":
        role_instructions = (
            "- Read-only code access. You can write recommendations in markdown files but cannot modify application code files.\n"
            "- Draft copy recommendations and let Design or Tech integrate them."
        )
    else:  # Product
        role_instructions = (
            "- Central orchestrator. Oversee file locks, coordinate task triages, review PRs, and run staging gate checks."
        )

    # Build the startup instructions / system instructions
    system_prompt = f"""You are an AI assistant adopting the **{role_name}** lane for this chat thread.
We are working on branch: **{branch_name}**

### Task Details:
* **Task ID**: {task_id}
* **Area**: {task['area']}
* **Scope**: {task['scope']}
* **Locked Files**: {task['locks']}

### Rules & Boundaries for {role_name}:
{role_instructions}

Let's begin! Please read the codebase files, verify git branch/status, and implement the task."""

    # Set up sandbox capabilities based on lane constraints
    enabled_tools = [
        BuiltinTools.LIST_DIR,
        BuiltinTools.SEARCH_DIR,
        BuiltinTools.FIND_FILE,
        BuiltinTools.VIEW_FILE,
        BuiltinTools.ASK_QUESTION,
        BuiltinTools.FINISH,
    ]

    if lane in ("Tech", "Design", "Product"):
        enabled_tools.extend([
            BuiltinTools.CREATE_FILE,
            BuiltinTools.EDIT_FILE,
            BuiltinTools.RUN_COMMAND,
        ])

    if lane in ("Design", "Product"):
        enabled_tools.append(BuiltinTools.GENERATE_IMAGE)

    enable_subagents = (lane == "Product")

    capabilities = CapabilitiesConfig(
        enable_subagents=enable_subagents,
        enabled_tools=enabled_tools,
    )

    # Configure the local agent
    config = LocalAgentConfig(
        system_instructions=CustomSystemInstructions(text=system_prompt),
        capabilities=capabilities,
        workspaces=[workspace_dir],
    )

    print(f"\n🚀 Initializing Antigravity Agent for {role_name}...")
    print(f"   - Branch: {branch_name}")
    print(f"   - Locks: {task['locks']}")
    print(f"   - Workspace: {workspace_dir}")
    print("Type 'exit' or 'quit' to end the interactive session.\n")

    async with Agent(config=config) as agent:
        await agent.run_interactive_loop()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Session ended by user.")
        sys.exit(0)
