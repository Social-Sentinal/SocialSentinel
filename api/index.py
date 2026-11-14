import os
import sys
from pathlib import Path

# Ensure the project root is in sys.path so 'backend' can be resolved
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend import create_app

# Vercel's Python runtime discovers and serves the WSGI 'app' callable
app = create_app()

if __name__ == "__main__":
    app.run(debug=True)

