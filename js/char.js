const scene = document.getElementById('charenv');
const char  = document.getElementById('char');
const img   = document.getElementById('charImg');

const CHAR_W = 64, CHAR_H = 64;
const WALK_SPEED = 50, GRAVITY = 900;
const STAND_MIN = 1.2, STAND_RAND = 1.5;
const WALK_FRAME_INTERVAL = 0.3;
const WALK_FRAMES = ['public/assets/walk1.png', 'public/assets/walk2.png'];
const FRAMES = { standing: 'public/assets/stand.png', grabbed: 'public/assets/hanging.png', falling: 'public/assets/falling.png', recovering: 'public/assets/getting-up.png' };

let state = 'standing', x = 350, y =240;
let targetX = x, targetY = y;
let vy = 0, fallLimit = 0;
let facingRight = true, stateTimer = 0;
let grabbed = false, grabDx = 0, grabDy = 0;
let lastTime = null;
let walkFrameTimer = 0, walkFrameIndex = 0;
let standPause = 0;

const W = () => scene.clientWidth;
const H = () => scene.clientHeight;
const clampX = v => Math.max(0, Math.min(W() - CHAR_W, v));
const clampY = v => Math.max(0, Math.min(H() - CHAR_H, v));
const rndPause = () => STAND_MIN + Math.random() * STAND_RAND;
const pickTarget = () => ({
    x: 20 + Math.random() * (W() - CHAR_W - 40),
    y: 20 + Math.random() * (H() - CHAR_H - 40),
});

function setState(s) {
    state = s; stateTimer = 0;
    if (s === 'standing') { standPause = rndPause(); img.src = FRAMES.standing; }
    else if (s === 'walking') { walkFrameTimer = 0; walkFrameIndex = 0; img.src = WALK_FRAMES[0]; }
    else img.src = FRAMES[s] || FRAMES.standing;
}

function loop(ts) {
    if (!lastTime) lastTime = ts;
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    if (!grabbed) {
    stateTimer += dt;

    if (state === 'standing' && stateTimer > standPause) {
        const t = pickTarget();
        targetX = t.x; targetY = t.y;
        facingRight = targetX > x;
        setState('walking');

    } else if (state === 'walking') {
        walkFrameTimer += dt;
        if (walkFrameTimer >= WALK_FRAME_INTERVAL) {
        walkFrameTimer = 0;
        walkFrameIndex = (walkFrameIndex + 1) % WALK_FRAMES.length;
        img.src = WALK_FRAMES[walkFrameIndex];
        }
        const dx = targetX - x, dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        facingRight = dx > 0;
        if (dist < 3) { x = targetX; y = targetY; setState('standing'); }
        else { x += (dx / dist) * WALK_SPEED * dt; y += (dy / dist) * WALK_SPEED * dt; }

    } else if (state === 'falling') {
        vy += GRAVITY * dt;
        y  += vy * dt;
        if (y >= fallLimit) { y = fallLimit; vy = 0; setState('recovering'); }

    } else if (state === 'recovering' && stateTimer > 0.9) {
        setState('standing');
    }

    x = clampX(x); y = clampY(y);
    }

    char.style.left      = x + 'px';
    char.style.top       = y + 'px';
    char.style.transform = facingRight ? 'scaleX(-1)' : 'scaleX(1)';
    requestAnimationFrame(loop);
}

function startGrab(cx, cy) {
    grabbed = true;
    char.classList.add('is-grabbed');
    setState('grabbed');
    vy = 0;
}

function moveGrab(cx, cy) {
    if (!grabbed) return;
    const sr = scene.getBoundingClientRect();
    x = cx - sr.left - CHAR_W / 2;
    y = cy - sr.top;
    char.style.left = x + 'px';
    char.style.top  = y + 'px';
}

function endGrab() {
    if (!grabbed) return;
    grabbed = false;
    char.classList.remove('is-grabbed');
    vy = 0;
    fallLimit = Math.min(y + 100, H() - CHAR_H);
    setState('falling');
}

standPause = rndPause();

char.addEventListener('mousedown', e => { e.preventDefault(); startGrab(e.clientX, e.clientY); });
window.addEventListener('mousemove', e => { if (grabbed) moveGrab(e.clientX, e.clientY); });
window.addEventListener('mouseup', () => { if (grabbed) endGrab(); });

char.addEventListener('touchstart', e => { e.preventDefault(); startGrab(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
window.addEventListener('touchmove', e => { if (!grabbed) return; e.preventDefault(); moveGrab(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
window.addEventListener('touchend', () => { if (grabbed) endGrab(); });

setState('standing');
requestAnimationFrame(loop);