// vim — read-only viewer

const vim = { active: false, lines: [], top: 0, mode: 'normal', cmd: '', file: '', cursor: { line: 0, col: 0 }, pendingG: false };

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
    Object.assign(vim, { active: true, lines: content.split('\n'), top: 0, mode: 'normal', cmd: '', file: filename, cursor: { line: 0, col: 0 }, pendingG: false });
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

function vimScrollToCursor() {
    const visible = Math.max(Math.floor((vimContent.clientHeight || window.innerHeight - 60) / 20), 1);
    if (vim.cursor.line < vim.top) vim.top = vim.cursor.line;
    if (vim.cursor.line >= vim.top + visible) vim.top = vim.cursor.line - visible + 1;
}

function renderVim() {
    const visible = Math.max(Math.floor((vimContent.clientHeight || window.innerHeight - 60) / 20), 1);
    let html = '';
    for (let i = 0; i < visible; i++) {
        const li = vim.top + i;
        if (li < vim.lines.length) {
            const text = vim.lines[li] ?? '';
            const body = li === vim.cursor.line
                ? esc(text.slice(0, vim.cursor.col)) + `<span class="vim-cursor">${esc(text[vim.cursor.col] ?? ' ')}</span>` + esc(text.slice(vim.cursor.col + 1))
                : esc(text);
            html += `<div class="vim-line"><span class="vim-lnum">${li + 1}</span><span>${body}</span></div>`;
        } else {
            html += `<div class="vim-line"><span class="vim-lnum vim-tilde">~</span></div>`;
        }
    }
    vimContent.innerHTML = html;
    vimStatus.innerHTML = `<span>"${esc(vim.file)}" [readonly]</span>`;
    vimCmdline.textContent = vim.mode === 'command' ? ':' + vim.cmd : '';
}

function vimHandleKey(e) {
    const { key } = e;
    const { cursor, lines } = vim;

    if (vim.mode === 'command') {
        if      (key === 'Escape')    { vim.mode = 'normal'; vim.cmd = ''; renderVim(); }
        else if (key === 'Backspace') { vim.cmd = vim.cmd.slice(0, -1); renderVim(); }
        else if (key === 'Enter')     { if (['q', 'q!', 'quit'].includes(vim.cmd.trim())) closeVim(); else { vim.mode = 'normal'; vim.cmd = ''; renderVim(); } }
        else if (key.length === 1)    { vim.cmd += key; renderVim(); }
        e.stopPropagation(); e.preventDefault(); return;
    }

    // normal mode
    const clampCol = () => { cursor.col = Math.min(cursor.col, Math.max(0, lines[cursor.line].length - 1)); };
    if      (key === 'ArrowDown' || key === 'j') { if (cursor.line < lines.length - 1) { cursor.line++; clampCol(); vimScrollToCursor(); renderVim(); } }
    else if (key === 'ArrowUp'   || key === 'k') { if (cursor.line > 0) { cursor.line--; clampCol(); vimScrollToCursor(); renderVim(); } }
    else if (key === 'ArrowLeft' || key === 'h') { if (cursor.col > 0) { cursor.col--; renderVim(); } }
    else if (key === 'ArrowRight'|| key === 'l') { if (cursor.col < Math.max(0, lines[cursor.line].length - 1)) { cursor.col++; renderVim(); } }
    else if (key === '0') { cursor.col = 0; renderVim(); }
    else if (key === '$') { cursor.col = Math.max(0, lines[cursor.line].length - 1); renderVim(); }
    else if (key === 'G') { cursor.line = lines.length - 1; cursor.col = 0; vimScrollToCursor(); renderVim(); }
    else if (key === 'g' && vim.pendingG) { cursor.line = 0; cursor.col = 0; vim.top = 0; renderVim(); }
    else if (key === 'g') { vim.pendingG = true; e.stopPropagation(); return; }
    else if (key === ':') { vim.mode = 'command'; vim.cmd = ''; renderVim(); e.preventDefault(); }

    vim.pendingG = false;
    e.stopPropagation();
}
