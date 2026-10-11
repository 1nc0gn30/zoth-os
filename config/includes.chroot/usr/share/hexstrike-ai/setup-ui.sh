#!/bin/bash

cd "$(dirname "$(readlink -f "$0")")/ui" || { echo "hexstrike: ui dir missing" >&2; exit 1; }

npm install

npm run dev