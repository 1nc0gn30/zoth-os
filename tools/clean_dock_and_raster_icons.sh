#!/usr/bin/env bash
# ==============================================================================
#  ZOTHOS UI HARDENING: NO SVGS, CRISP PNG ICONS & CLEAN BOTTOM DOCK
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_USER="${TARGET_USER:-${SUDO_USER:-$USER}}"
TARGET_HOME="${HOME:-/home/$TARGET_USER}"

echo "[1/4] Ensuring 100% Raster PNG Icons in /usr/share/pixmaps..."
mkdir -p /usr/share/pixmaps /usr/share/icons/hicolor/48x48/apps /usr/share/icons/hicolor/512x512/apps

# Ensure standard PNG pixmaps exist
cp -f "$ROOT_DIR/config/includes.chroot/usr/share/pixmaps/"*.png /usr/share/pixmaps/ 2>/dev/null || true
cp -f /usr/share/icons/hicolor/512x512/apps/*.png /usr/share/pixmaps/ 2>/dev/null || true

# Strip any .svg extensions from all .desktop files across the entire system
echo "[2/4] Sanitizing all .desktop files to use NO SVGs..."
find /usr/share/applications "$TARGET_HOME/Desktop" "$TARGET_HOME/.local/share/applications" /etc/skel/Desktop -name "*.desktop" -type f 2>/dev/null | while read -r df; do
    sed -i -E 's/Icon=(.*)\.svg/Icon=\1\.png/g' "$df"
    sed -i -E 's/Icon=(.*)\.svg;/Icon=\1\.png;/g' "$df"
done

# Ensure specific distinct icons on key launchers
sed -i 's|Icon=.*|Icon=/usr/share/pixmaps/obsidian.png|g' /usr/share/applications/obsidian.desktop "$TARGET_HOME/Desktop/obsidian.desktop" 2>/dev/null || true
sed -i 's|Icon=.*|Icon=/usr/share/pixmaps/hermes-agent.png|g' /usr/share/applications/hermes-agent.desktop "$TARGET_HOME/Desktop/hermes-agent.desktop" 2>/dev/null || true
sed -i 's|Icon=.*|Icon=/usr/share/pixmaps/zoth-studio.png|g' /usr/share/applications/zoth-studio.desktop "$TARGET_HOME/Desktop/zoth-studio.desktop" 2>/dev/null || true
sed -i 's|Icon=.*|Icon=/usr/share/pixmaps/hexstrike-ai.png|g' /usr/share/applications/hexstrike-ai.desktop "$TARGET_HOME/Desktop/hexstrike-ai.desktop" 2>/dev/null || true
sed -i 's|Icon=.*|Icon=/usr/share/pixmaps/nullai-ghostmode.png|g' /usr/share/applications/anonsurf.desktop "$TARGET_HOME/Desktop/anonsurf.desktop" 2>/dev/null || true
sed -i 's|Icon=.*|Icon=/usr/share/pixmaps/preferences-system.png|g' /usr/share/applications/tailscale.desktop "$TARGET_HOME/Desktop/tailscale.desktop" 2>/dev/null || true
sed -i 's|Icon=.*|Icon=/usr/share/pixmaps/security-high.png|g' /usr/share/applications/tor-anonymity.desktop "$TARGET_HOME/Desktop/tor-anonymity.desktop" 2>/dev/null || true
sed -i 's|Icon=.*|Icon=/usr/share/pixmaps/solana.png|g' /usr/share/applications/web3-dev.desktop "$TARGET_HOME/Desktop/web3-dev.desktop" 2>/dev/null || true

echo "[3/4] Reconfiguring Bottom Dock (No Duplicates, Tooltips Above Bar)..."
# Configure clean curated bottom dock in xfconf
export DISPLAY=:0
xfconf-query -c xfce4-panel -p /panels/panel-2/size -s 48 2>/dev/null || true
xfconf-query -c xfce4-panel -p /panels/panel-2/icon-size -s 32 2>/dev/null || true
xfconf-query -c xfce4-panel -p /panels/panel-2/position -s "p=10;x=0;y=12" 2>/dev/null || true

# Clean up desktop surface to 5 clean, essential shortcuts
if [[ -d "$TARGET_HOME/Desktop" ]]; then
    rm -f "$TARGET_HOME/Desktop/"*.desktop
    cp /usr/share/applications/zoth-studio.desktop "$TARGET_HOME/Desktop/" 2>/dev/null || true
    cp /usr/share/applications/hermes-agent.desktop "$TARGET_HOME/Desktop/" 2>/dev/null || true
    cp /usr/share/applications/hexstrike-ai.desktop "$TARGET_HOME/Desktop/" 2>/dev/null || true
    cp /usr/share/applications/obsidian.desktop "$TARGET_HOME/Desktop/" 2>/dev/null || true
    cp /usr/share/applications/anonsurf.desktop "$TARGET_HOME/Desktop/" 2>/dev/null || true
    chmod +x "$TARGET_HOME/Desktop/"*.desktop 2>/dev/null || true
    chown -R "$TARGET_USER:$TARGET_USER" "$TARGET_HOME/Desktop" 2>/dev/null || true
fi

echo "[4/4] Reloading panel and desktop..."
sudo gtk-update-icon-cache -f -t /usr/share/icons/hicolor 2>/dev/null || true
xfdesktop --reload 2>/dev/null || true
xfce4-panel -r 2>/dev/null || true

echo "[✓] UI & Dock Polish Complete."
