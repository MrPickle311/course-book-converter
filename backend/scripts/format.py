#!/usr/bin/env python3
"""
Code formatting and linting script.
"""
import subprocess
import sys
from pathlib import Path


def run_command(cmd: list[str], description: str) -> bool:
    """Run a command and return success status."""
    print(f"Running {description}...")
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        if e.stdout:
            print(e.stdout)
        if e.stderr:
            print(e.stderr)
        return False


def main():
    """Format and lint the code."""
    backend_dir = Path(__file__).parent.parent

    # Change to backend directory
    import os

    os.chdir(backend_dir)

    print("🧹 Formatting and linting Book to Course Converter Backend...")
    print()

    success = True

    # Format with Black
    success &= run_command(
        ["poetry", "run", "black", "app/", "scripts/"], "Black formatting"
    )

    # Sort imports with isort
    success &= run_command(
        ["poetry", "run", "isort", "app/", "scripts/"], "isort import sorting"
    )

    # Lint with Ruff
    success &= run_command(
        ["poetry", "run", "ruff", "check", "app/", "scripts/", "--fix"], "Ruff linting"
    )

    if success:
        print("\n✅ All formatting and linting completed successfully!")
    else:
        print("\n❌ Some formatting or linting steps failed.")
        sys.exit(1)


if __name__ == "__main__":
    main()
