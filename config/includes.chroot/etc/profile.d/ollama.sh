# Ollama talks to the local daemon only. The API has no authentication, so it is
# not exposed to the LAN (audit P0-3). To serve other machines on purpose, put it
# behind an authenticating proxy instead of changing this to 0.0.0.0.
export OLLAMA_HOST=127.0.0.1:11434
export OLLAMA_MODELS=/usr/share/ollama/.ollama/models
# Browser pages that may call the API: local pages and apps only (was "*").
export OLLAMA_ORIGINS="http://localhost,http://127.0.0.1,http://localhost:*,http://127.0.0.1:*,app://*,file://*"
