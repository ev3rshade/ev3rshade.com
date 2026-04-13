# ev3rshade.com

vanilla js terminal website — blue and white pixel aesthetic with plants

## file structure

```
ev3rshade.com/
├── index.html                  # single-page app, all overlays live here
│
├── css/
│   └── style.css               # all styles (terminal, vim overlay, GUI window, mobile)
│
├── js/
│   ├── vfs.js                  # virtual filesystem (FS map, resolvePath, fetchFile)
│   ├── execute.js              # command implementations (ls, cd, cat, grep, wc, find,
│   │                           # plant, clear, theme, help, gui-please, chiikawa)
│   ├── terminal.js             # input loop, tab-complete, history, prompt, DOMContentLoaded init
│   ├── vim.js                  # read-only vim viewer overlay (:q to quit, hjkl/gg/G//)
│   ├── gui.js                  # floating GUI window (drag, resize, markdown pages)
│   └── char.js                 # chiikawa sprite — walks, falls, can be grabbed/dragged
│
├── fonts/
│   ├── DotGothic16/            # pixel font (fallback)
│   └── Fira_Code/              # monospace font (primary)
│
├── public/assets/              # chiikawa sprite frames (stand, walk1/2, hanging, falling, getting-up)
│
├── vfs/                        # content served as the virtual filesystem
│   ├── README.md               # home page (shown on load and on `cd ~`)
│   ├── termrc                  # startup config (PROMPT, THEME)
│   ├── about-me/README.md
│   ├── projects/README.md
│   └── blog/
│       ├── README.md
│       ├── posts.json          # post index (slug, title, date, description)
│       └── posts/*.md          # individual blog posts
│
├── sync-posts.js               # node script — regenerates vfs/blog/posts.json from posts/
├── wrangler.jsonc              # Cloudflare Workers / Pages config
└── README.md
```

## how the terminal works

The site is a fake shell running entirely in the browser. There is no server-side execution.

### virtual filesystem

[js/vfs.js](js/vfs.js) defines `FS`, a plain JS object that maps absolute paths to nodes:

```js
{ type: 'dir',  children: ['README.md', 'about-me', ...] }
{ type: 'file', src: 'vfs/about-me/README.md' }   // real fetch path
```

`resolvePath(p)` resolves `.` / `..` / relative paths against `cwd`.  
`fetchFile(src)` fetches the file over HTTP. `vfs/termrc` is also checked in `localStorage` first (allows per-user overrides).

Blog post entries are dynamic — on init, `posts.json` is fetched and the `/blog/posts` directory is populated at runtime.

### startup sequence

1. `DOMContentLoaded` fires in [js/terminal.js](js/terminal.js)
2. `initFS()` fetches `posts.json` and populates `/blog/posts`
3. `parseTermrc()` fetches `vfs/termrc`, applies `PROMPT` and `THEME`
4. `vfs/README.md` is fetched and printed as the welcome screen

### commands

| command | description |
|---|---|
| `ls [path]` | list directory contents |
| `cd <dir>` | change directory; auto-prints `README.md` if present |
| `cat <file>` | print file contents |
| `grep <pattern> <file>` | case-insensitive line search |
| `wc <file>` | line / word / char count |
| `find [path] [-name <pat>] [-type f\|d]` | walk the virtual fs |
| `vim <file>` | read-only viewer (`:q` quit, `hjkl` move, `gg`/`G` top/bottom, `/` search) |
| `plant` | grow an animated ASCII plant garden |
| `clear` | clear output + stop plant animations |
| `theme [light\|dark]` | toggle or set color theme |
| `gui-please` | open the floating GUI window |
| `chiikawa <show\|hide>` | show or hide the chiikawa sprite |
| `help` | print command list |

**Tab completion** works for both command names and file/directory paths.  
**History** is navigable with ↑ / ↓.

### GUI window

`gui-please` opens a draggable, resizable floating window ([js/gui.js](js/gui.js)) that renders the same `vfs/` markdown content visually. On mobile it opens full-screen.

### theming

Colors are CSS custom properties (`--bg`, `--fg`, `--dim`, etc.) defined in [css/style.css](css/style.css) and toggled via `body.dark`. The default theme is read from `vfs/termrc` (`export THEME="dark"`). The user's preference is persisted in `localStorage`.

### adding blog posts

1. Write a markdown file in `vfs/blog/posts/`
2. Run `node sync-posts.js` to regenerate `vfs/blog/posts.json`
3. The post will appear in `ls /blog/posts`, `cat`, vim, and the GUI blog list
