// ev3rshade terminal

function applyTheme(isDark) {
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function applyTermrcContent(content) {
    for (const [, key, val] of content.matchAll(/^export\s+(\w+)="([^"]*)"/gm)) {
        if (key === 'PROMPT') termPrompt = val;
        if (key === 'THEME' && !localStorage.getItem('theme')) {
            const dark = val === 'dark' || (val === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.body.classList.toggle('dark', dark);
        }
    }
    updatePrompt();
}

async function parseTermrc() {
    const content = await fetchFile('vfs/termrc');
    if (content) applyTermrcContent(content);
}

async function initFS() {
    try {
        const posts = await (await fetch('vfs/blog/posts.json')).json();
        FS['/blog/posts'].children = posts.map(p => p.slug + '.md');
        for (const p of posts)
            FS[`/blog/posts/${p.slug}.md`] = { type: 'file', src: `vfs/blog/posts/${p.slug}.md` };
    } catch {}
}

let cwd        = '/';
let history    = [];
let histIdx    = -1;
let termPrompt = 'user@ev3rshade';


// ── DOM refs ──────────────────────────────────────────────────────────────────

const terminal   = document.getElementById('terminal');
const output     = document.getElementById('output');
const inputLine  = document.getElementById('input-line');
const cmdInput   = document.getElementById('cmd-input');
const promptEl   = document.getElementById('prompt');
const vimOverlay = document.getElementById('vim-overlay');
const vimContent = document.getElementById('vim-content');
const vimStatus  = document.getElementById('vim-statusbar');
const vimCmdline = document.getElementById('vim-cmdline');
const guiWindow  = document.getElementById('gui-window');

// ── Helpers ───────────────────────────────────────────────────────────────────

function promptStr() {
    const loc = cwd === '/' ? '~' : '~' + cwd;
    return `${termPrompt}:${loc}$ `;
}

function updatePrompt() { promptEl.textContent = promptStr(); }

function esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function ansi256Color(n) {
    if (n < 16) return ['#000','#800000','#008000','#808000','#000080','#800080','#008080','#c0c0c0',
                        '#808080','#f00','#0f0','#ff0','#00f','#f0f','#0ff','#fff'][n];
    if (n < 232) {
        const i = n - 16, b = (i % 6) * 51, g = (Math.floor(i / 6) % 6) * 51, r = Math.floor(i / 36) * 51;
        return `rgb(${r},${g},${b})`;
    }
    const v = 8 + (n - 232) * 10;
    return `rgb(${v},${v},${v})`;
}

function ansiToHtml(text) {
    const FG = {
        30:'#2e3436', 31:'#cc0000', 32:'#4e9a06', 33:'#c4a000',
        34:'#3465a4', 35:'#75507b', 36:'#06989a', 37:'#d3d7cf',
        90:'#555753', 91:'#ef2929', 92:'#8ae234', 93:'#fce94f',
        94:'#729fcf', 95:'#ad7fa8', 96:'#34e2e2', 97:'#eeeeec',
    };
    const BG = {
        40:'#2e3436', 41:'#cc0000', 42:'#4e9a06', 43:'#c4a000',
        44:'#3465a4', 45:'#75507b', 46:'#06989a', 47:'#d3d7cf',
        100:'#555753', 101:'#ef2929', 102:'#8ae234', 103:'#fce94f',
        104:'#729fcf', 105:'#ad7fa8', 106:'#34e2e2', 107:'#eeeeec',
    };
    const parts = text.split(/(\x1b\[[0-9;]*m)/);
    let html = '', fg = null, bg = null, bold = false, dim = false;
    function styleStr() {
        const s = [];
        if (fg)   s.push(`color:${fg}`);
        if (bg)   s.push(`background-color:${bg}`);
        if (bold) s.push('font-weight:bold');
        if (dim)  s.push('opacity:0.55');
        return s.join(';');
    }
    for (const part of parts) {
        const m = part.match(/^\x1b\[([0-9;]*)m$/);
        if (m) {
            const codes = m[1] === '' ? [0] : m[1].split(';').map(Number);
            let j = 0;
            while (j < codes.length) {
                const c = codes[j];
                if      (c === 0)  { fg = null; bg = null; bold = false; dim = false; }
                else if (c === 1)  bold = true;
                else if (c === 2)  dim  = true;
                else if (c === 22) { bold = false; dim = false; }
                else if (c === 39) fg = null;
                else if (c === 49) bg = null;
                else if (FG[c])    fg = FG[c];
                else if (BG[c])    bg = BG[c];
                else if (c === 38 && codes[j+1] === 5 && codes[j+2] != null) { fg = ansi256Color(codes[j+2]); j += 2; }
                else if (c === 38 && codes[j+1] === 2 && codes[j+4] != null) { fg = `rgb(${codes[j+2]},${codes[j+3]},${codes[j+4]})`; j += 4; }
                else if (c === 48 && codes[j+1] === 5 && codes[j+2] != null) { bg = ansi256Color(codes[j+2]); j += 2; }
                else if (c === 48 && codes[j+1] === 2 && codes[j+4] != null) { bg = `rgb(${codes[j+2]},${codes[j+3]},${codes[j+4]})`; j += 4; }
                j++;
            }
        } else if (part) {
            const s = styleStr();
            html += s ? `<span style="${s}">${esc(part)}</span>` : esc(part);
        }
    }
    return html;
}

function print(text, cls) {
    const d = document.createElement('div');
    if (cls) d.className = cls;
    if (/\x1b\[/.test(text)) {
        d.innerHTML = ansiToHtml(text);
    } else {
        d.textContent = text;
    }
    output.appendChild(d);
    terminal.scrollTop = terminal.scrollHeight;
}

// ── Command dispatch ──────────────────────────────────────────────────────────

const COMMANDS = { ls, cd, cat, grep, wc, find, vim: openVimCmd, plant, clear, theme, help, 'gui-please': guiPlease, put, exit: exitCmd };


// ── Keyboard handlers ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([initFS(), parseTermrc()]);
    updatePrompt();
    // Print home README on load
    fetchFile('vfs/README.md').then(content => {
        if (content) print(content, 'file-content');
        print('');
    });

    cmdInput.addEventListener('keydown', async e => {
        if (vim.active) return;
        if (e.key === 'Tab') {
            e.preventDefault();
            const input = cmdInput.value;
            const parts = input.split(/\s+/);

            if (parts.length === 1) {
                // complete command name
                const partial = parts[0];
                const matches = Object.keys(COMMANDS).filter(c => c.startsWith(partial));
                if (matches.length === 1) {
                    cmdInput.value = matches[0] + ' ';
                } else if (matches.length > 1) {
                    print(matches.join('  '), 'dim');
                }
            } else {
                // complete file/dir path
                const partial = parts[parts.length - 1];
                const lastSlash = partial.lastIndexOf('/');
                const dirPart  = lastSlash >= 0 ? partial.slice(0, lastSlash + 1) : '';
                const namePart = lastSlash >= 0 ? partial.slice(lastSlash + 1) : partial;
                const searchDir = dirPart ? resolvePath(dirPart) : cwd;
                const dirNode = node(searchDir);
                if (!dirNode || dirNode.type !== 'dir') return;

                const matches = dirNode.children.filter(c => c.startsWith(namePart));
                if (matches.length === 1) {
                    const childPath = searchDir === '/' ? `/${matches[0]}` : `${searchDir}/${matches[0]}`;
                    const isDir = node(childPath)?.type === 'dir';
                    parts[parts.length - 1] = dirPart + matches[0] + (isDir ? '/' : '');
                    cmdInput.value = parts.join(' ');
                } else if (matches.length > 1) {
                    print(matches.join('  '), 'dim');
                }
            }
            return;
        }
        if (e.key === 'Enter') {
            const val = cmdInput.value;
            if (val.trim()) { history.unshift(val); histIdx = -1; }
            cmdInput.value = '';
            await run(val);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (histIdx < history.length - 1) cmdInput.value = history[++histIdx];
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (histIdx > 0)   cmdInput.value = history[--histIdx];
            else { histIdx = -1; cmdInput.value = ''; }
        }
    });

    document.addEventListener('keydown', e => {
        if (!vim.active) return;
        vimHandleKey(e);
    });

    // Clicking anywhere refocuses the input, unless the user just selected text
    document.addEventListener('click', () => { if (!vim.active && !window.getSelection().toString()) cmdInput.focus(); });
});