// ev3rshade terminal

const FS = {
    '/':                  { type: 'dir',  children: ['README.md', 'about-me', 'projects', 'blog'] },
    '/README.md':         { type: 'file', src: 'content/README.md' },
    '/about-me':          { type: 'dir',  children: ['README.md'] },
    '/about-me/README.md':{ type: 'file', src: 'content/about-me/README.md' },
    '/projects':          { type: 'dir',  children: ['README.md'] },
    '/projects/README.md':{ type: 'file', src: 'content/projects/README.md' },
    '/blog':              { type: 'dir',  children: ['README.md'] },
    '/blog/README.md':    { type: 'file', src: 'content/blog/README.md' },
};

let cwd     = '/';
let history = [];
let histIdx = -1;

const vim = { active: false, lines: [], top: 0, mode: 'normal', cmd: '', file: '' };

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

function resolvePath(p) {
    if (!p || p === '~') return '/';
    const base = p.startsWith('/') ? '' : cwd;
    const segs = (base + '/' + p).split('/').filter(Boolean);
    const out  = [];
    for (const s of segs) {
        if (s === '..') out.pop();
        else if (s !== '.') out.push(s);
    }
    return '/' + out.join('/');
}

function node(path) { return FS[path] || null; }

function promptStr() {
    const loc = cwd === '/' ? '~' : '~' + cwd;
    return `user@ev3rshade:${loc}$ `;
}

function updatePrompt() { promptEl.textContent = promptStr(); }

function esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function print(text, cls) {
    const d = document.createElement('div');
    if (cls) d.className = cls;
    d.textContent = text;
    output.appendChild(d);
    terminal.scrollTop = terminal.scrollHeight;
}

async function fetchFile(src) {
    try {
        const r = await fetch(src);
        return r.ok ? await r.text() : null;
    } catch { return null; }
}

// ── Command dispatch ──────────────────────────────────────────────────────────

const COMMANDS = { ls, cd, cat, grep, wc, find, vim: openVimCmd, plant, clear, help, 'gui-please': guiPlease };

async function run(input) {
    const trimmed = input.trim();
    // echo prompt + command
    const d = document.createElement('div');
    d.innerHTML = `<span class="prompt-text">${esc(promptStr())}</span>${esc(trimmed)}`;
    output.appendChild(d);
    terminal.scrollTop = terminal.scrollHeight;

    if (!trimmed) return;
    const [cmd, ...args] = trimmed.split(/\s+/);
    const fn = COMMANDS[cmd];
    if (fn) await fn(args);
    else print(`bash: ${cmd}: command not recognized`, 'err');
}

// ── ls ────────────────────────────────────────────────────────────────────────

async function ls([path] = []) {
    const p = path ? resolvePath(path) : cwd;
    const n = node(p);
    if (!n)                 return print(`ls: ${path}: No such file or directory`, 'err');
    if (n.type === 'file')  return print(p.split('/').pop());

    const row = document.createElement('div');
    row.className = 'ls-row';
    for (const name of n.children) {
        const childPath = p === '/' ? `/${name}` : `${p}/${name}`;
        const child = node(childPath);
        const span = document.createElement('span');
        span.className = child?.type === 'dir' ? 'ls-dir' : 'ls-file';
        span.textContent = name + (child?.type === 'dir' ? '/' : '');
        row.appendChild(span);
    }
    output.appendChild(row);
    terminal.scrollTop = terminal.scrollHeight;
}

// ── cd ────────────────────────────────────────────────────────────────────────

async function cd([arg] = []) {
    const p = resolvePath(arg || '/');
    const n = node(p);
    if (!n)                return print(`cd: ${arg}: No such file or directory`, 'err');
    if (n.type === 'file') return print(`cd: ${arg}: Not a directory`, 'err');
    cwd = p;
    updatePrompt();
    const readmePath = cwd === '/' ? '/README.md' : `${cwd}/README.md`;
    const rn = node(readmePath);
    if (rn) {
        const content = await fetchFile(rn.src);
        if (content) print(content, 'file-content');
    }
}

// ── cat ───────────────────────────────────────────────────────────────────────

async function cat([path] = []) {
    if (!path) return print('cat: missing operand', 'err');
    const p = resolvePath(path);
    const n = node(p);
    if (!n)                return print(`cat: ${path}: No such file or directory`, 'err');
    if (n.type === 'dir')  return print(`cat: ${path}: Is a directory`, 'err');
    const content = await fetchFile(n.src);
    if (content === null)  return print(`cat: ${path}: Error reading file`, 'err');
    print(content, 'file-content');
}

// ── grep ──────────────────────────────────────────────────────────────────────

async function grep([pattern, path] = []) {
    if (!pattern || !path) return print('usage: grep <pattern> <file>', 'err');
    const p = resolvePath(path);
    const n = node(p);
    if (!n || n.type === 'dir') return print(`grep: ${path}: No such file or directory`, 'err');
    const content = await fetchFile(n.src);
    if (!content)               return print(`grep: ${path}: Error reading file`, 'err');
    let found = false;
    content.split('\n').forEach((line, i) => {
        if (line.toLowerCase().includes(pattern.toLowerCase())) {
            print(`${i + 1}:  ${line}`, 'grep-match');
            found = true;
        }
    });
    if (!found) print('(no matches found)', 'dim');
}

// ── wc ────────────────────────────────────────────────────────────────────────

async function wc([path] = []) {
    if (!path) return print('usage: wc <file>', 'err');
    const p = resolvePath(path);
    const n = node(p);
    if (!n || n.type === 'dir') return print(`wc: ${path}: No such file or directory`, 'err');
    const content = await fetchFile(n.src);
    if (!content) return;
    const lines = content.split('\n').length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;
    print(`  ${lines}  ${words}  ${chars} ${path}`);
}

// ── find ──────────────────────────────────────────────────────────────────────

async function find(args) {
    let base = cwd;
    let namePat = null;
    let typeFilter = null;
    let i = 0;

    if (args[0] && !args[0].startsWith('-')) {
        base = args[0] === '.' ? cwd : resolvePath(args[0]);
        i = 1;
    }
    while (i < args.length) {
        if (args[i] === '-name' && args[i + 1]) { namePat = args[++i]; }
        else if (args[i] === '-type' && args[i + 1]) { typeFilter = args[++i]; }
        i++;
    }

    function nameRe(pat) {
        const escaped = pat.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');
        return new RegExp('^' + escaped + '$');
    }

    function walk(path) {
        const n = node(path);
        if (!n) return;
        const name  = path.split('/').pop() || '';
        const rel   = path === base ? '.' : '.' + (base === '/' ? path : path.slice(base.length));

        let show = true;
        if (typeFilter === 'f' && n.type !== 'file') show = false;
        if (typeFilter === 'd' && n.type !== 'dir')  show = false;
        if (namePat && !nameRe(namePat).test(name))  show = false;
        if (show) print(rel);

        if (n.type === 'dir') {
            for (const child of n.children) {
                walk(path === '/' ? `/${child}` : `${path}/${child}`);
            }
        }
    }
    walk(base);
}

// ── vim ───────────────────────────────────────────────────────────────────────

async function openVimCmd([path] = []) {
    if (!path) return print('usage: vim <file>', 'err');
    const p = resolvePath(path);
    const n = node(p);
    if (!n || n.type === 'dir') return print(`vim: ${path}: No such file or directory`, 'err');
    const content = await fetchFile(n.src);
    if (content === null) return print(`vim: ${path}: Error reading file`, 'err');
    openVim(path, content);
}

function openVim(filename, content) {
    Object.assign(vim, { active: true, lines: content.split('\n'), top: 0, mode: 'normal', cmd: '', file: filename });
    vimOverlay.classList.remove('hidden');
    inputLine.classList.add('hidden');
    renderVim();
}

function closeVim() {
    vim.active = false;
    vimOverlay.classList.add('hidden');
    inputLine.classList.remove('hidden');
    cmdInput.focus();
}

function renderVim() {
    const lineH   = 20;
    const avail   = vimContent.clientHeight || (window.innerHeight - 60);
    const visible = Math.max(Math.floor(avail / lineH), 1);

    let html = '';
    for (let i = 0; i < visible; i++) {
        const li = vim.top + i;
        if (li < vim.lines.length) {
            html += `<div class="vim-line"><span class="vim-lnum">${li + 1}</span><span>${esc(vim.lines[li])}</span></div>`;
        } else {
            html += `<div class="vim-line"><span class="vim-lnum vim-tilde">~</span></div>`;
        }
    }
    vimContent.innerHTML = html;

    const modeLabel = vim.mode === 'command' ? '' : `-- ${vim.mode.toUpperCase()} --`;
    vimStatus.innerHTML = `<span>"${esc(vim.file)}" [readonly]</span><span>${modeLabel}</span>`;
    vimCmdline.textContent = vim.mode === 'command' ? ':' + vim.cmd : '';
}

// ── plant ─────────────────────────────────────────────────────────────────────

function plant([type] = []) {
    const pm = window.plantManager;
    if (!pm) return print('plant: not ready yet', 'err');
    switch (type?.toLowerCase()) {
        case 'fern': pm.plantRandomFern(); print('planted a fern.'); break;
        case 'moss': pm.plantRandomMoss(); print('planted some moss.'); break;
        case 'vine': pm.plantRandomVine(); print('planted a vine.'); break;
        default: print('usage: plant <fern|moss|vine>', 'err');
    }
}

// ── clear / help / gui-please ─────────────────────────────────────────────────

function clear()     { output.innerHTML = ''; window.plantManager?.clearAll(); }
function guiPlease() { guiWindow.classList.remove('hidden'); }

function help() {
    print([
        'commands:',
        '  ls [path]               list directory contents',
        '  cd <dir>                change directory  (auto-prints README.md)',
        '  cat <file>              print file contents',
        '  grep <pattern> <file>   search for pattern in file',
        '  wc <file>               word, line, and char count',
        '  find [path] [-name <pattern>] [-type f|d]',
        '  vim <file>              open file read-only',
        '                            ESC → normal mode   :q → quit',
        '  plant <fern|moss|vine>  grow a plant',
        '  clear                   clear terminal',
        '  gui-please              open GUI window',
        '  help                    show this message',
    ].join('\n'), 'help-text');
}

// ── GUI window drag ───────────────────────────────────────────────────────────

let drag = { on: false, x: 0, y: 0 };

document.getElementById('gui-titlebar').addEventListener('mousedown', e => {
    drag.on = true;
    drag.x = e.clientX - guiWindow.offsetLeft;
    drag.y = e.clientY - guiWindow.offsetTop;
    e.preventDefault();
});
document.addEventListener('mousemove', e => {
    if (!drag.on) return;
    guiWindow.style.left = (e.clientX - drag.x) + 'px';
    guiWindow.style.top  = (e.clientY - drag.y) + 'px';
});
document.addEventListener('mouseup', () => { drag.on = false; });
document.getElementById('gui-close').addEventListener('click', () => {
    guiWindow.classList.add('hidden');
});

// ── Keyboard handlers ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    updatePrompt();
    // Print home README on load
    fetchFile('content/README.md').then(content => {
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
        if (vim.mode === 'normal') {
            if      (e.key === 'ArrowDown' || e.key === 'j') { vim.top = Math.min(vim.top + 1, vim.lines.length - 1); renderVim(); }
            else if (e.key === 'ArrowUp'   || e.key === 'k') { vim.top = Math.max(vim.top - 1, 0); renderVim(); }
            else if (e.key === ':') { vim.mode = 'command'; vim.cmd = ''; renderVim(); e.preventDefault(); }
        } else if (vim.mode === 'command') {
            if      (e.key === 'Escape')    { vim.mode = 'normal'; vim.cmd = ''; renderVim(); }
            else if (e.key === 'Enter')     { if (['q', 'q!', 'quit'].includes(vim.cmd)) closeVim(); else { vim.mode = 'normal'; vim.cmd = ''; renderVim(); } }
            else if (e.key === 'Backspace') { vim.cmd = vim.cmd.slice(0, -1); renderVim(); }
            else if (e.key.length === 1)    { vim.cmd += e.key; renderVim(); }
        }
        e.stopPropagation();
    });

    // Clicking anywhere refocuses the input
    document.addEventListener('click', () => { if (!vim.active) cmdInput.focus(); });
});
