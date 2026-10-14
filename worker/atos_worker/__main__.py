"""python -m atos_worker assemble-check [output.mp4]
python -m atos_worker poll

poll reads ATOS_BASE_URL, ATOS_TOKEN_FILE, ATOS_WORK_DIR and ATOS_ASSET_ROOT.
It does not open a port.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from atos_worker.bench import technical_check
from atos_worker.client import WorkerClient, load_token


def main() -> None:
    command = sys.argv[1] if len(sys.argv) > 1 else ""
    if command == "assemble-check":
        output = Path(sys.argv[2] if len(sys.argv) > 2 else "/tmp/atos-technical-check.mp4")
        print(json.dumps(technical_check(output), indent=2))
        return
    if command == "poll":
        base = os.environ.get("ATOS_BASE_URL", "").strip()
        token_file = os.environ.get("ATOS_TOKEN_FILE", "").strip()
        if not base.startswith("https://") and not base.startswith("http://127.0.0.1"):
            raise SystemExit("ATOS_BASE_URL must be https, or http://127.0.0.1 for a local development OS.")
        if not token_file:
            raise SystemExit("Set ATOS_TOKEN_FILE to a mode-600 file. Do not pass the token on the command line.")
        work = Path(os.environ.get("ATOS_WORK_DIR", str(Path.home() / "Library" / "Caches" / "atos-media")))
        assets = Path(os.environ.get("ATOS_ASSET_ROOT", str(work / "originals")))
        WorkerClient(base, load_token(Path(token_file)), work, assets).poll_forever()
        return
    raise SystemExit("Use assemble-check or poll.")


if __name__ == "__main__":
    main()
