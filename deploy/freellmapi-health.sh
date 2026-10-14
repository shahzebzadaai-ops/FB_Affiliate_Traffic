#!/bin/bash
# Local health check for the FreeLLMAPI router. It does not open a port.
set -euo pipefail
curl -fsS --max-time 5 http://127.0.0.1:3001/api/ping >/dev/null
