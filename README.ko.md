# mdview

[English](README.md) | 한국어

터미널에서 마크다운을 읽을 때 Mermaid 다이어그램까지 그려서 보여 줘요. 셸과 [yazi](https://github.com/sxyazi/yazi) 미리보기에서는 글자 그림으로, Kitty 그래픽을 지원하는 터미널(Ghostty, kitty)에서는 그림으로 보여 줘요.

```
┌─────────────┐     ◇────────────────◇            ┌─────────────┐
│             │     │                │            │             │
│ 사용자 요청 ├────►│ 로그인 했나요? │   ├──예───►│  주문 처리  │
│             │     │                │            │             │
└─────────────┘     ◇────────┬───────◇            └─────────────┘
                             │                    ┌─────────────┐
                             │                    │             │
                             └──────아니요───────►│ 로그인 화면 │
                                                  │             │
                                                  └─────────────┘
```

- 본문은 [glow](https://github.com/charmbracelet/glow)가 렌더링하고, 다이어그램은 [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid)가 그려요. 흐름도, 시퀀스, 상태, 클래스, ER 다이어그램, XY 차트를 지원해요.
- 한글·일본어·중국어 라벨도 상자 정렬이 맞아요. beautiful-mermaid는 글자 하나를 한 칸으로 세는데, 이 글자들은 화면에서 두 칸을 차지하기 때문에 그 차이를 맞춰 줘요.
- 다이어그램은 glow를 거치지 않고 그린 그대로 출력해요. glow를 거치면 넓은 다이어그램이 줄바꿈돼서 깨지기 때문이에요.

## 필요한 것

- Node.js 18 이상, glow, less
- 그림으로 보려면: chafa와 Kitty 그래픽을 지원하는 터미널(Ghostty, kitty, 또는 그런 터미널에서 접속한 Herdr 0.9.2 이상)
- 선택: yazi와 패키지 관리자 `ya`

Ubuntu 24.04, Node 24, glow 3.0, chafa 1.14, yazi 26.9에서 Ghostty로 접속한 Herdr 페인 안에서 확인했어요.

glow는 우분투 기본 저장소에 없어서 공식 배포 파일로 설치해요.

```sh
curl -fsSLo /tmp/glow.deb https://github.com/charmbracelet/glow/releases/download/v3.0.0/glow_3.0.0_amd64.deb
sudo apt install -y /tmp/glow.deb chafa
```

macOS에서는 `brew install glow chafa`로 설치해요.

## 설치

```sh
git clone --branch v0.1.1 https://github.com/devicki/mdview ~/tools/mdview
~/tools/mdview/install.sh
```

`install.sh`가 하는 일이에요.
- 받은 폴더에 Node 의존성을 설치해요.
- `~/.local/bin`에 `mdview` 명령을 만들어요.
- yazi가 있으면 [piper](https://github.com/yazi-rs/plugins/tree/main/piper.yazi) 플러그인을 설치해요.
- `~/.config/yazi/yazi.toml`은 파일이 없을 때만 새로 만들어요. 이미 있으면 [`examples/yazi.toml`](examples/yazi.toml) 내용을 직접 합쳐 주세요. `[opener]`, `[open]`, `[plugin]` 섹션은 각각 하나씩만 있어야 해요.

## 사용법

```sh
mdview README.md              # 화면 넘기며 읽기: 방향키나 Space로 스크롤, /로 검색, q로 닫기
mdview --images README.md     # 다이어그램을 그림으로 하나씩: Enter로 다음, q로 닫기
mdview --width=80 README.md   # 80칸 폭으로 출력만
```

yazi에서는 `examples/yazi.toml` 설정을 쓰면 이렇게 동작해요.

| 키 | 마크다운 파일 |
| --- | --- |
| 커서 올리기 | 미리보기 창에 렌더링해서 보여 줘요. 다이어그램은 글자 그림이에요 |
| Enter | 편집해요(`$EDITOR`, 없으면 vi) |
| `O` | 편집 / **읽기**(전체 화면) / **다이어그램 그림** 중에서 골라요 |

[`examples/sample.md`](examples/sample.md)로 시험해 보세요. 한글 라벨로 된 다이어그램이 종류별로 하나씩 들어 있어요.

## 참고

- **넓은 다이어그램**: 미리보기 창보다 넓으면 간격을 좁혀 다시 그려요. 그래도 넓으면 창 오른쪽에서 잘려요. 그럴 때는 Enter나 `O`로 전체 화면에서 보세요.
- **화살표 라벨**: beautiful-mermaid는 화살표 라벨의 띄어쓰기를 선으로 그려요(`$100─결제`). ER 다이어그램의 관계 이름이 상자 테두리와 붙어 보일 때도 있어요.
- **링크**: glow는 링크에 OSC 8 제어 코드를 붙여요. yazi 미리보기와 less가 이를 글자로 세서 줄이 창 밖으로 밀려나기 때문에, mdview가 지워요.
- **믿을 수 없는 파일**: 파일 속 제어 문자는 그리기 전에 모두 지워요. 그래서 문서가 mdview를 통해 터미널(제목, OSC 52 클립보드, 링크)을 조작할 수 없어요.
- **그림**: beautiful-mermaid의 SVG는 CSS `var()`와 `color-mix()`를 쓰는데, chafa가 쓰는 librsvg는 이를 모르기 때문에, mdview가 어두운 터미널에 맞는 실제 색으로 바꿔서 넘겨요.
- **제목**: `glow-style.json`은 glow dark 테마에서 제목 앞 `##` 표시를 없애고 색으로 구분하게 바꾼 테마예요. 지우면 glow 기본 dark 테마로 돌아가요.

## 업데이트와 삭제

```sh
git -C ~/tools/mdview fetch --tags && git -C ~/tools/mdview checkout vX.Y.Z && ~/tools/mdview/install.sh
rm -rf ~/tools/mdview ~/.local/bin/mdview   # 그리고 ~/.config/yazi/yazi.toml의 mdview 줄
```

## 개발

```sh
npm ci
./test.sh   # 한글 정렬, 라벨 속 $, CRLF 파일, 링크 제어 코드, 파일 속 제어 문자, 샘플 다이어그램 전체, --images
```

릴리스할 때는 `package.json`의 `version`을 올리고, 두 README의 `--branch`를 바꿔 커밋한 뒤 `git tag -a vX.Y.Z -m vX.Y.Z && git push origin vX.Y.Z`를 실행하세요.

## 라이선스

MIT. beautiful-mermaid(MIT, Craft Docs)와 glow(MIT, Charm)를 그대로 사용해요.
