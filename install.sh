#!/usr/bin/env bash
# Set up mdview for this account: its Node dependency, the `mdview` command in ~/.local/bin, and
# yazi's piper plugin. glow comes from your package manager (see the README).
set -eu
here=$(cd "$(dirname "$0")" && pwd)
node=$(command -v node || ls -d "$HOME"/.nvm/versions/node/*/bin/node 2>/dev/null | tail -n1 || :)
[ -n "$node" ] || { echo "mdview: Node.js 18 or newer is needed" >&2; exit 1; }
command -v glow >/dev/null || echo "mdview: glow is not installed, so text will show unrendered (see the README)" >&2
"$(dirname "$node")/npm" ci --omit=dev --no-audit --no-fund --prefix "$here" >/dev/null

mkdir -p "$HOME/.local/bin"
cat >"$HOME/.local/bin/mdview" <<W
#!/usr/bin/env bash
# mdview from $here. Finds node also where the shell put none on PATH (nvm).
node=\$(command -v node || ls -d "\$HOME"/.nvm/versions/node/*/bin/node 2>/dev/null | tail -n1)
exec "\$node" "$here/mdview.mjs" "\$@"
W
chmod +x "$HOME/.local/bin/mdview"
echo "mdview: installed ~/.local/bin/mdview"

if ! command -v ya >/dev/null; then
  echo "mdview: yazi not found; skipping the yazi setup"
  exit 0
fi
[ -d "$HOME/.config/yazi/plugins/piper.yazi" ] || ya pkg add yazi-rs/plugins:piper
y="$HOME/.config/yazi/yazi.toml"
if [ ! -f "$y" ]; then
  mkdir -p "$(dirname "$y")" && cp "$here/examples/yazi.toml" "$y"
  echo "mdview: wrote $y"
elif grep -q mdview "$y"; then
  echo "mdview: $y already uses mdview"
else
  echo "mdview: merge $here/examples/yazi.toml into $y (it has settings of its own)"
fi
