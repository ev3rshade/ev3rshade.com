// logic to execute commands

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

function clear()     { output.innerHTML = ''; window.plantManager?.clearAll(); }
function guiPlease() { guiWindow.classList.remove('hidden'); guiGo('home'); }

function theme([mode] = []) {
    const dark = mode === 'dark' || (mode === undefined && !document.body.classList.contains('dark'));
    applyTheme(dark);
    print(`theme: ${dark ? 'dark' : 'light'}`);
}

function help() {
    print([
        'commands:',
        '  ls [path]               list directory contents',
        '  cd <dir>                change directory  (auto-prints README.md)',
        '  cat <file>              print file contents',
        '  grep <pattern> <file>   search for pattern in file',
        '  wc <file>               word, line, and char count',
        '  find [path] [-name <pattern>] [-type f|d]',
        '  vim <file>              open file (editable: .termrc)',
        '                            i/a/A/o/O → insert   ESC → normal',
        '                            v/V → visual/visual-line   d → delete',
        '                            u → undo   :w → save   :q/:wq → quit',
        '  plant <fern|moss|vine>  grow a plant',
        '  clear                   clear terminal + plants',
        '  theme <light|dark>      toggle color theme',
        '  gui-please              open GUI window',
        '  help                    show this message',
    ].join('\n'), 'help-text');
}

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