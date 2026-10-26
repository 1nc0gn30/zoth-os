# Portable user toolchain paths and ZothOS roots (POSIX sh).
if [ -f /etc/zothos/paths.sh ]; then
  # shellcheck disable=SC1091
  . /etc/zothos/paths.sh
fi
if [ -n "${ZOTH_ACTIVE_HOME:-}" ]; then
  case ":${PATH}:" in
    *":${ZOTH_ACTIVE_HOME}/.local/bin:"*) ;;
    *)
      PATH="${PATH}:${ZOTH_ACTIVE_HOME}/go/bin:${ZOTH_ACTIVE_HOME}/.cargo/bin:${ZOTH_ACTIVE_HOME}/.foundry/bin:${ZOTH_ACTIVE_HOME}/.local/bin"
      ;;
  esac
  export PATH
fi
