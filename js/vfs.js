// virtual filesystem representing the website
const FS = {
    '/':                  { type: 'dir',  children: ['README.md', '.termrc', 'about-me', 'projects', 'blog'] },
    '/README.md':         { type: 'file', src: 'vfs/README.md' },
    '/.termrc':           { type: 'file', src: 'vfs/termrc' },
    '/about-me':          { type: 'dir',  children: ['README.md'] },
    '/about-me/README.md':{ type: 'file', src: 'vfs/about-me/README.md' },
    '/projects':          { type: 'dir',  children: ['README.md'] },
    '/projects/README.md':{ type: 'file', src: 'vfs/projects/README.md' },
    '/blog':              { type: 'dir',  children: ['README.md', 'posts'] },
    '/blog/README.md':    { type: 'file', src: 'vfs/blog/README.md' },
    '/blog/posts':        { type: 'dir',  children: [] },
};

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

async function fetchFile(src) {
    if (src === 'vfs/termrc') {
        const override = localStorage.getItem('termrc');
        if (override !== null) return override;
    }
    try {
        const r = await fetch(src);
        return r.ok ? await r.text() : null;
    } catch { return null; }
}