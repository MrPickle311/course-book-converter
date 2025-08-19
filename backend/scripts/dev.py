#!/usr/bin/env python3
"""
Development server startup script (no Poetry required).
"""
import subprocess
import sys
from pathlib import Path


def main():
    """Start the development server using the current Python interpreter."""
    backend_dir = Path(__file__).parent.parent

    # Change to backend directory
    import os

    os.chdir(backend_dir)

    # Start the server using python -m uvicorn
    cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
        "--reload",
    ]

    print("Starting Book to Course Converter Backend...")
    print("Server will be available at: http://127.0.0.1:8000")
    print("API documentation: http://127.0.0.1:8000/docs")
    print("Health check: http://127.0.0.1:8000/health")
    print()

    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\nShutting down server...")
    except subprocess.CalledProcessError as e:
        print(f"Error starting server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
