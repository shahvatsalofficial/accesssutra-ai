#!/usr/bin/env sh
set -eu
if [ "$#" -lt 2 ]; then echo "Usage: scripts/install.sh <target-project> <claude|cursor|codex|gemini|copilot|windsurf|cline|roo|continue>"; exit 1; fi
node packages/cli/accesssutra.mjs install-ide --target "$1" --host "$2"
