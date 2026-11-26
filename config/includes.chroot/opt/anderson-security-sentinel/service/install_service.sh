#!/usr/bin/env bash
# Install Anderson Sentinel as a systemd user service

SERVICE_DIR="$HOME/.config/systemd/user"
mkdir -p "$SERVICE_DIR"

cp ~/NullAITech/anderson-security-sentinel/service/anderson-sentinel.service "$SERVICE_DIR/"
systemctl --user daemon-reload

echo "[Anderson Sentinel] Systemd user service installed."
echo "To start now:     systemctl --user start anderson-sentinel"
echo "To enable on boot: systemctl --user enable anderson-sentinel"
echo "To check status:   systemctl --user status anderson-sentinel"
