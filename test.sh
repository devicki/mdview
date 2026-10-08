#!/usr/bin/env bash
# Checks the parts that are easy to break: Korean labels keep box borders aligned, `$` survives,
# CRLF files work, glow's link escapes are gone, every sample diagram renders, and --images draws
# one picture per diagram. Needs node and the npm dependency; glow and chafa are used if present.
set -u
here=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
fail=0
ok() { echo "ok   $1"; }
bad() { echo "FAIL $1" >&2; fail=1; }
mdview() { node "$here/mdview.mjs" "$@"; }
plain() { sed -e 's/\x1b\[[0-9;]*m//g'; }

printf '# t\n\n```mermaid\ngraph LR\n  A[사용자 요청] -->|$100 결제| B[응답]\n```\n' >"$work/k.md"
out=$(mdview --width=100 "$work/k.md" | plain)
# Each row of the box around "사용자 요청" must end in the same display column.
aligned() {
  node -e '
    const wide = (c) => /[\u1100-\u115F\u3000-\u9FFF\uAC00-\uD7A3]/.test(c);
    const rows = process.argv[1].split("\n").filter((l) => /^\s*[┌│└]/.test(l)).slice(0, 5);
    const ends = rows.map((r) => {
      let col = 0, seen = 0;
      for (const c of r) { col += wide(c) ? 2 : 1; if (/[┌┐│└┘├┤]/.test(c) && ++seen === 2) return col; }
    });
    process.exit(rows.length === 5 && new Set(ends).size === 1 ? 0 : 1);
  ' "$1"
}
aligned "$out" && ok "Korean labels keep box borders aligned" || bad "Korean labels misalign box borders"
grep -q '\$100' <<<"$out" && ok "a \$ in a label survives" || bad "a \$ in a label was mangled"

sed 's/$/\r/' "$here/examples/sample.md" >"$work/crlf.md"
n=$(grep -c '^```mermaid' "$here/examples/sample.md")
drawn=$(mdview --width=100 "$work/crlf.md" | plain | grep -c -E '^  [┌╭●◇╔]')
[ "$drawn" -ge "$n" ] && ok "CRLF file: $n diagrams drawn" || bad "CRLF file: only $drawn of $n diagrams drawn"

full=$(mdview --width=100 "$here/examples/sample.md")
grep -q 'mermaid not drawn' <<<"$full" && bad "a sample diagram failed to render" || ok "every sample diagram renders"
grep -q $'\x1b\]' <<<"$full" && bad "OSC escapes left in the output" || ok "no OSC escapes in the output"

if command -v chafa >/dev/null; then
  imgs=$(mdview --images "$here/examples/sample.md" </dev/null | grep -a -o $'\x1b_G[^;]*;' | grep -c 'a=T\|a=t' || :)
  [ "$imgs" -ge "$n" ] && ok "--images draws one picture per diagram" || bad "--images drew $imgs pictures for $n diagrams"
fi
[ "$fail" -eq 0 ] && echo PASS
exit "$fail"
