# mdview

English | [한국어](README.ko.md)

Read Markdown in the terminal with its Mermaid diagrams drawn: as text art in the shell and in [yazi](https://github.com/sxyazi/yazi)'s preview, or as images in a terminal with kitty graphics (Ghostty, kitty).

```
┌─────────┐     ◇────────────◇        ┌──────────┐
│         │     │            │        │          │
│ Request ├────►│ Signed in? │ ├─yes─►│ Checkout │
│         │     │            │        │          │
└─────────┘     ◇──────┬─────◇        └──────────┘
                       │              ┌──────────┐
                       │              │          │
                       └─────no──────►│ Sign in  │
                                      │          │
                                      └──────────┘
```

- Text is rendered by [glow](https://github.com/charmbracelet/glow), diagrams by [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid): flowcharts, sequence, state, class and ER diagrams, and XY charts.
- Korean, Japanese and Chinese labels keep their boxes aligned. beautiful-mermaid counts one column per character, while these take two.
- Diagrams are printed as drawn, not passed through glow, which would wrap a wide one.

## Requirements

- Node.js 18 or newer, glow, and less
- For images: chafa and a terminal with kitty graphics (Ghostty, kitty, or Herdr 0.9.2+ attached from one of them)
- Optional: yazi with its package manager `ya`

Tested on Ubuntu 24.04 with Node 24, glow 3.0, chafa 1.14 and yazi 26.9, in Herdr panes attached from Ghostty.

glow is not in Ubuntu's archive; install its release package:

```sh
curl -fsSLo /tmp/glow.deb https://github.com/charmbracelet/glow/releases/download/v3.0.0/glow_3.0.0_amd64.deb
sudo apt install -y /tmp/glow.deb chafa
```

On macOS: `brew install glow chafa`.

## Install

```sh
git clone --branch v0.1.1 https://github.com/devicki/mdview ~/tools/mdview
~/tools/mdview/install.sh
```

`install.sh` installs the Node dependency in the clone, writes the `mdview` command to `~/.local/bin`, and, when yazi is there, adds its [piper](https://github.com/yazi-rs/plugins/tree/main/piper.yazi) plugin. It writes `~/.config/yazi/yazi.toml` only when there is none; otherwise merge [`examples/yazi.toml`](examples/yazi.toml) into yours (one `[opener]`, `[open]` and `[plugin]` section each).

## Use

```sh
mdview README.md              # read it in a pager: arrows or space to scroll, / to search, q to quit
mdview --images README.md     # each diagram as an image, one at a time: Enter for the next, q to quit
mdview --width=80 README.md   # print it 80 columns wide
```

In yazi, with `examples/yazi.toml`:

| Key | Markdown file |
| --- | --- |
| hover | the preview shows it rendered, diagrams as text art |
| Enter | edit it (`$EDITOR`, vi when unset) |
| `O` | choose: edit, **Read** (full screen), **Diagrams as images** |

Try it on [`examples/sample.md`](examples/sample.md), which has one diagram of each kind with Korean labels.

## Notes

- **Wide diagrams**: when a diagram is wider than the preview, it is redrawn with tighter spacing; if it still does not fit, its right side is cut at the pane's edge. Read it full screen with Enter or `O`.
- **Edge labels**: beautiful-mermaid draws the spaces of an edge label as the line itself (`$100─pay`), and in ER diagrams a relationship label can touch a box border.
- **Links**: glow tags links with OSC 8 escapes, which yazi's preview and less count as text and push lines past the edge, so mdview removes them.
- **Untrusted files**: control characters in a file are removed before anything is drawn, so a document cannot drive your terminal (its title, the clipboard through OSC 52, links) through mdview.
- **Images**: beautiful-mermaid's SVG uses CSS `var()` and `color-mix()`, which librsvg (chafa) does not support, so mdview fills in plain colors in dark-terminal tones before chafa draws it.
- **Headings**: `glow-style.json` is glow's dark style with headings shown by color instead of `##` markers. Delete it to use glow's own dark style.

## Update and uninstall

```sh
git -C ~/tools/mdview fetch --tags && git -C ~/tools/mdview checkout vX.Y.Z && ~/tools/mdview/install.sh
rm -rf ~/tools/mdview ~/.local/bin/mdview   # and the mdview lines in ~/.config/yazi/yazi.toml
```

## Development

```sh
npm ci
./test.sh   # Korean alignment, $ in labels, CRLF files, link escapes, escapes in files, every sample diagram, --images
```

To release, bump `version` in `package.json`, update the `--branch` in both READMEs, commit, then `git tag -a vX.Y.Z -m vX.Y.Z && git push origin vX.Y.Z`.

## License

MIT. beautiful-mermaid (MIT, Craft Docs) and glow (MIT, Charm) are used as they are.
