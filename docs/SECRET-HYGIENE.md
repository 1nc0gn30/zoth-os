# Secret and PII hygiene

Tracked files stay free of operator phone numbers, machine homes, host disk serials, and secrets. [`.gitleaks.toml`](../.gitleaks.toml) extends the stock gitleaks rules with those checks. [`.github/workflows/gitleaks.yml`](../.github/workflows/gitleaks.yml) runs the scan on every pull request and on every push, and fails the job when there is a finding. [`.pre-commit-config.yaml`](../.pre-commit-config.yaml) runs the same config on staged changes.

## Placeholders

Put real values in the environment or in an untracked file on the machine. [`config/includes.chroot/etc/zothos/paths.conf`](../config/includes.chroot/etc/zothos/paths.conf) documents the names and ships only placeholders.

| Variable | What it holds |
|---|---|
| `ZOTH_HOME` | Account home directory |
| `ZOTH_SRC_ROOT` | NullAI checkout root |
| `ZOTH_SIGNAL_NUMBER` | Operator Signal number, E.164 |
| `ZOTH_PARROT_DISK` | `/dev/disk/by-id/...` path of the Parrot disk |

`ZOTH_SIGNAL_NUMBER` and the `+E164` placeholder are names, not numbers. `your-parrot-disk` is the documented disk placeholder. A concrete by-id path belongs in the environment.

## What fails the scan

The custom rules fail the build on:

- A real phone digit string: a leading `+` and 8–15 digits, or a separated number such as a NANP grouping. <!-- hygiene-example -->
- The literal directory `/home/zoth`. <!-- hygiene-example -->
- The literal mount `/media/neo/`. <!-- hygiene-example -->
- A `LITEON` disk token, or any concrete `/dev/disk/by-id/` id other than `your-parrot-disk`. <!-- hygiene-example -->
- The variable name `SOLANA_PRIVATE_KEY`. <!-- hygiene-example -->

Stock gitleaks rules still apply (API keys, private keys, and similar). Lines in this file that have to spell a banned literal are marked `hygiene-example` and are the only lines here those custom rules skip.

`build/pack-iso.sh` deletes a nested directory under the live-build chroot that belongs to the account `neo`. That cleanup is allowlisted in `.gitleaks.toml` for that script only. The same home path in any other file fails the scan. Do not copy a host home into a new script.

The DePay link in [`ZOTHOS_TOOLS_CATALOG.md`](../ZOTHOS_TOOLS_CATALOG.md) publishes the receive address `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`. That exact public address is allowlisted. A private key is not.

## Run a scan locally

Install gitleaks **8.30.1** (the version CI pins) and check the checksum:

```bash
version=8.30.1
archive="gitleaks_${version}_linux_x64.tar.gz"
curl -fsSL -o "$archive" "https://github.com/gitleaks/gitleaks/releases/download/v${version}/${archive}"
echo "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb  $archive" | sha256sum -c -
tar -xzf "$archive" gitleaks
sudo install -m 0755 gitleaks /usr/local/bin/gitleaks
```

Scan the tree at this checkout (this is what CI runs):

```bash
bash tools/scan-secrets.sh
```

Drop `--redact` when you need the matched text:

```bash
gitleaks dir . --config .gitleaks.toml --verbose --no-banner
```

Install the staged-diff hook once:

```bash
pipx install pre-commit   # or pip install pre-commit
pre-commit install
```

`pre-commit run gitleaks` scans what is staged. CI does not trust that hook; it scans the whole tree of the commit.

`gitleaks git .` also walks history. Already-scrubbed commits can still show findings there. The merge gate is the tree at the commit (`gitleaks dir`), which is what lands on the branch. Rewriting history is a separate decision and is not required to keep the tip clean.
