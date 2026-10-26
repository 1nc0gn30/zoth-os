# Portable ZothOS roots. POSIX sh.
# Source this from shell tools. Overrides: the environment, then /etc/zothos/paths.conf.
# ZOTH_HOME is the OS account home (directory of $ZOTH_USER).
# ZOTH_ACTIVE_HOME is the caller home when HOME is set.
# ZOTH_SRC_ROOT is the NullAI checkout root (default: $ZOTH_ACTIVE_HOME/NullAITech).

if [ -f /etc/zothos/paths.conf ]; then
  set -a
  # shellcheck disable=SC1091
  . /etc/zothos/paths.conf
  set +a
fi

: "${ZOTH_USER:=zoth}"
: "${AZOTH_USER:=azoth}"
: "${ZOTH_HOME:=/home/${ZOTH_USER}}"
: "${AZOTH_HOME:=/home/${AZOTH_USER}}"
if [ -n "${HOME:-}" ]; then
  : "${ZOTH_ACTIVE_HOME:=${HOME}}"
else
  : "${ZOTH_ACTIVE_HOME:=${ZOTH_HOME}}"
fi
: "${ZOTH_SRC_ROOT:=${ZOTH_ACTIVE_HOME}/NullAITech}"

export ZOTH_USER AZOTH_USER ZOTH_HOME AZOTH_HOME ZOTH_ACTIVE_HOME ZOTH_SRC_ROOT
