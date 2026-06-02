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

const plantTimers = [];
function clear() {
    output.innerHTML = '';
    terminal.scrollTop = 0;
    plantTimers.forEach(clearInterval);
    plantTimers.length = 0;
    terminal.querySelectorAll('.plant-overlay').forEach(el => el.remove());
}
function guiPlease() { guiWindow.classList.remove('hidden'); guiGo('home'); }
function exitCmd()   { window.close(); }

async function put([path] = []) {
    if (!path) return print('usage: put <file>', 'err');
    const p = resolvePath(path);
    const n = node(p);
    if (!n)               return print(`put: ${path}: No such file or directory`, 'err');
    if (n.type === 'dir') return print(`put: ${path}: Is a directory`, 'err');
    const content = await fetchFile(n.src);
    if (content === null) return print(`put: ${path}: Error reading file`, 'err');
    const filename = p.split('/').pop();
    const blob = new Blob([content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    print(`downloading ${filename}`);
}

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
        '  vim <file>              open file read-only  (:q to quit)',
        '  plant                   grow ascii plants',
        '  clear                   clear terminal + plants',
        '  theme <light|dark>      toggle color theme',
        '  gui-please              open GUI window',
        '  put <file>              download file',
        '  exit                    close this tab',
        '  help                    show this message',
    ].join('\n'), 'help-text');
}

// ── ASCII plant generation ────────────────────────────────────────────────────

// Character palette — curves/shapes: 8 ? b d 7 ` . , ° : n
//                     shading:       8 S I i : .
const PC = {
    stem:   ['I','i','I','i',':'],
    tip:    ['`','.','\u00b0'],
    frondL: ['b',',','`','.',','],
    frondR: ['d',',','`','.',','],
    dense:  ['8','S','I'],
    mid:    ['i',':'],
    sparse: ['.',',','\u00b0'],
};

function PR(a)    { return a[Math.floor(Math.random() * a.length)]; }
function PRI(a,b) { return a + Math.floor(Math.random() * (b - a + 1)); }

// Helper: build a short pinna arm (tip-last)
function makePin(len, goUp) {
    const out = [];
    for (let j = 0; j < len; j++) {
        if (j === len - 1) out.push(PR(PC.tip));
        else out.push(goUp ? PR([',','8',',']) : PR(['n',',']));
    }
    return out;
}

// ── Moss: GoL-inspired freeform patch — dense core + scattered satellites ─────
class PlantMoss {
    constructor(W, H) {
        this.W = W;
        this.H = H;
        this.cx = PRI(Math.floor(W * 0.15), Math.floor(W * 0.85));
        this.cy = PRI(Math.floor(H * 0.15), Math.floor(H * 0.85));

        this.cells   = new Map();
        this.flowers = [];

        this.maxSize        = PRI(120, 280);
        this.growProgress   = 0;
        this.growRate       = 8;
        this.animPhase      = Math.random() * Math.PI * 2;
        this.flowerCooldown = PRI(5, 15);
        this.done           = false;

        this._addCell(this.cx, this.cy, 1.0);
    }

    _key(col, row)    { return col * 10000 + row; }
    _has(col, row)    { return this.cells.has(this._key(col, row)); }
    _isEdge(col, row) {
        return !this._has(col-1,row) || !this._has(col+1,row) ||
               !this._has(col,row-1) || !this._has(col,row+1);
    }

    // Count filled 8-neighbours — used to decide satellite survival
    _neighbours(col, row) {
        let n = 0;
        for (let dc = -1; dc <= 1; dc++)
            for (let dr = -1; dr <= 1; dr++)
                if ((dc || dr) && this._has(col + dc, row + dr)) n++;
        return n;
    }

    _addCell(col, row, density) {
        if (col < 0 || col >= this.W || row < 0 || row >= this.H) return;
        const k = this._key(col, row);
        if (this.cells.has(k)) return;
        // Very low thresholds — almost everything renders as a heavy char
        const char = density > 0.35 ? PR(PC.dense) :
                     density > 0.15 ? PR(PC.mid)   : PR(PC.sparse);
        this.cells.set(k, { col, row, char, density, age: 0,
                             fo: Math.random() * Math.PI * 2, isEdge: true });
    }

    update() {
        this.animPhase += 0.04;

        for (const c of this.cells.values()) {
            c.age++;
            c.isEdge = this._isEdge(c.col, c.row);
        }

        if (!this.done) {
            this.growProgress += this.growRate;
            while (this.growProgress >= 1) {
                this.growProgress -= 1;
                this._spread();
                if (this.cells.size >= this.maxSize) { this.done = true; break; }
            }
        }

        // GoL-style prune: isolated satellite cells that have been alone too long die off
        if (this.done) this._prune();

        this.flowerCooldown--;
        if (this.done && this.cells.size > 20 && this.flowerCooldown <= 0) {
            this._bloom();
            this.flowerCooldown = PRI(8, 22);
        }
        for (const f of this.flowers) f.age++;
        this.flowers = this.flowers.filter(f => f.age < f.maxAge);
    }

    _spread() {
        const all  = [...this.cells.values()];
        const edge = all.filter(c => c.isEdge);

        if (Math.random() < 0.78) {
            // ── Adjacent spread from an edge cell (builds the dense core)
            const src = (edge.length > 0 ? edge : all)[Math.floor(Math.random() * (edge.length || all.length))];
            const DIRS = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
            const d    = DIRS[Math.floor(Math.random() * DIRS.length)];
            const nc = src.col + d[0], nr = src.row + d[1];
            const dist    = Math.sqrt((nc - this.cx) ** 2 + (nr - this.cy) ** 2);
            const maxDist = Math.sqrt(this.maxSize / Math.PI) * 2;
            const density = Math.max(0.4, (1 - dist / maxDist) * (0.9 + Math.random() * 0.15));
            this._addCell(nc, nr, density);
        } else {
            // ── Long-range spore jump — creates scattered satellite cells like GoL
            const src   = all[Math.floor(Math.random() * all.length)];
            const angle = Math.random() * Math.PI * 2;
            const dist  = PRI(4, 14);
            const nc = Math.round(src.col + Math.cos(angle) * dist);
            const nr = Math.round(src.row + Math.sin(angle) * dist);
            // Satellites land sparse; if they land near others they inherit some density
            const nearbyDensity = this._neighbours(nc, nr) * 0.12;
            this._addCell(nc, nr, Math.min(0.45, 0.1 + nearbyDensity + Math.random() * 0.15));
        }
    }

    // Kill cells that have stayed completely isolated for a long time (GoL underpopulation)
    _prune() {
        for (const c of this.cells.values()) {
            if (c.age > 60 && this._neighbours(c.col, c.row) === 0 && Math.random() < 0.04)
                this.cells.delete(this._key(c.col, c.row));
        }
    }

    _bloom() {
        const candidates = [...this.cells.values()]
            .filter(c => c.age > 15 && c.density > 0.4);
        if (candidates.length === 0) return;
        const host = candidates[Math.floor(Math.random() * candidates.length)];
        this.flowers.push({
            col: host.col, row: host.row,
            char: PR(['\u00b0', '*', '\u00b0', '+']),
            age: 0, maxAge: PRI(70, 200),
            phase: Math.random() * Math.PI * 2,
        });
    }

    getGrid() {
        const grid     = Array.from({ length: this.H }, () => Array(this.W).fill(null));
        const EDGE_SEQ = ['.', ',', '\u00b0', ':', ',', '.', ' '];

        for (const c of this.cells.values()) {
            if (c.isEdge) {
                const t = Math.sin(this.animPhase + c.fo);
                if (t < -0.5) continue;                             // frayed gap
                const idx = Math.floor((t + 1) / 2 * (EDGE_SEQ.length - 1));
                grid[c.row][c.col] = { char: EDGE_SEQ[idx], type: 'edge' };
            } else {
                grid[c.row][c.col] = { char: c.char, type: 'moss' };
            }
        }

        for (const f of this.flowers) {
            if (f.col < 0 || f.col >= this.W || f.row < 0 || f.row >= this.H) continue;
            const lt    = f.age / f.maxAge;
            const alpha = lt < 0.12 ? lt / 0.12 : lt > 0.82 ? (1 - lt) / 0.18 : 1;
            if (alpha > 0.2) grid[f.row][f.col] = { char: f.char, type: 'flower', alpha };
        }

        return grid;
    }
}

function measureChar() {
    const cs = getComputedStyle(output);
    const span = document.createElement('span');
    Object.assign(span.style, {
        visibility: 'hidden', position: 'absolute', whiteSpace: 'pre',
        fontFamily: cs.fontFamily,
        fontSize:   cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
    });
    span.textContent = 'M'.repeat(20);
    document.body.appendChild(span);
    const r = span.getBoundingClientRect();
    document.body.removeChild(span);
    return { w: r.width / 20, h: r.height };
}

function getTerminalCols() {
    const { w } = measureChar();
    const pad = parseInt(getComputedStyle(terminal).paddingLeft) * 2;
    return Math.max(20, Math.floor((terminal.clientWidth - pad) / w));
}

function getTerminalRows() {
    const { h } = measureChar();
    return Math.max(8, Math.ceil(terminal.clientHeight / h) + 1);
}

function makePlant() {
    const W     = getTerminalCols();
    const H     = getTerminalRows();
    const count = PRI(1, 3);
    const mosses = Array.from({ length: count }, () => new PlantMoss(W, H));
    return { mosses, W, H };
}

function renderPlant({ mosses, W, H }) {
    for (const m of mosses) m.update();

    // Merge all moss grids into one
    const grid = Array.from({ length: H }, () => Array(W).fill(null));
    for (const m of mosses) {
        const mg = m.getGrid();
        for (let r = 0; r < H; r++)
            for (let c = 0; c < W; c++)
                if (mg[r][c] !== null) grid[r][c] = mg[r][c];
    }

    // Convert to HTML.
    // Moss/edge cells get class="mo" (opaque bg) so they visually cover underlying text.
    // Empty cells are plain spaces — transparent, letting terminal content show through.
    const rows = [];
    for (let r = 0; r < H; r++) {
        let html = '';
        for (let c = 0; c < W; c++) {
            const cell = grid[r][c];
            if (!cell) {
                html += ' ';
            } else if (cell.type === 'flower') {
                html += `<span class="mo pf" style="opacity:${cell.alpha.toFixed(2)}">${cell.char}</span>`;
            } else {
                html += `<span class="mo">${cell.char}</span>`;
            }
        }
        rows.push(html);
    }
    return rows.join('\n');
}


function plant() {
    const art = makePlant();
    const el  = document.createElement('pre');
    el.className = 'plant-art plant-overlay';

    // Position the overlay to cover the current terminal viewport.
    // Absolutely positioned inside #terminal (position:relative), so it sits
    // on top of existing output at the current scroll position.
    terminal.appendChild(el);
    terminal.scrollTop = terminal.scrollHeight;
    const padTop = parseInt(getComputedStyle(terminal).paddingTop);
    el.style.top    = Math.max(0, terminal.scrollTop - padTop) + 'px';
    el.style.height = (terminal.clientHeight + padTop) + 'px';

    const id = setInterval(() => { el.innerHTML = renderPlant(art); }, 120);
    plantTimers.push(id);
}