#!/bin/bash

cd "$(dirname "$(readlink -f "$0")")/backend" || { echo "hexstrike: backend dir missing" >&2; exit 1; }

if [ ! -d "venv" ]; then
    echo "venv not found. Creating it now..."
    python3 -m venv venv
else
    echo "venv already exists."
fi

source venv/bin/activate
pip install -r requirements.txt
python3 main.py