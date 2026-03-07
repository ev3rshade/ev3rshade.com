export default class Moss {
    constructor(x, y, ps, el) {
        this.x = x;
        this.y = y;
        this.pixelSize = ps;
        this.element = el;
        this.elementRect = el.getBoundingClientRect();

        this.pixels = [{ x, y, age: 0, density: 1, flickerOffset: 0 }];
        this.flowers = [];

        this.maxSize = 120 + Math.random() * 180;
        this.growthSpeed = 0.3;
        this.growth = 0;
        this.currentSize = 1;

        // Spread radius kept tight for a rounded dome shape
        this.spreadRadius = ps * 2.5;

        this.animPhase  = Math.random() * Math.PI * 2;
        this.animSpeed  = 0.004;
        this.flowerPhase = Math.random() * Math.PI * 2;
        this.flowerSpeed = 0.002;

        // Colour palette: dark core → mid body → light fringe (all natural greens)
        this.colorCore   = '#2a4a1a'; // very dark green, center shadow
        this.colorDark   = '#3a6b22'; // dark green
        this.colorMid    = '#4e8c2f'; // mid green
        this.colorLight  = '#6ab040'; // bright green
        this.colorFringe = '#8dc85a'; // lightest, outer wisps

        // Pink flower colours
        this.flowerColor      = '#e87aa0';
        this.flowerColorLight = '#f5b8cc';
    }

    // ── Growth ──────────────────────────────────────────────────────────────
    update() {
        if (this.currentSize < this.maxSize) {
            this.growth += this.growthSpeed;
            if (this.growth >= 1) {
                this.growth = 0;
                this.spreadMoss();
            }
        }

        this.pixels.forEach(p => {
            p.age++;
            if (p.age > 50 && p.density < 1) p.density = Math.min(1, p.density + 0.01);
        });

        this.flowers.forEach(f => f.age++);

        if (this.pixels.length > 30 && Math.random() < 0.02) this.addFlower();
        this.flowers = this.flowers.filter(f => f.age < 300);

        this.animPhase   += this.animSpeed;
        this.flowerPhase += this.flowerSpeed;
    }

    spreadMoss() {
        const src = this.pixels[Math.floor(Math.random() * this.pixels.length)];
        const isEdge = this.isNearEdge(src.x, src.y);
        const attempts = isEdge ? 2 : 5;

        for (let i = 0; i < attempts; i++) {
            const angle = Math.random() * Math.PI * 2;
            // Bias spread horizontally to form a wider dome (x spreads more than y)
            const dx = Math.cos(angle) * (this.pixelSize + Math.random() * this.spreadRadius) * 1.2;
            const dy = Math.sin(angle) * (this.pixelSize + Math.random() * this.spreadRadius) * 0.85;
            const nx = src.x + dx;
            const ny = src.y + dy;

            if (!this.isWithinElement(nx, ny)) continue;

            // Edge pixels are patchier, centre is dense
            const growChance = isEdge ? 0.45 : 0.88;
            if (Math.random() > growChance) continue;

            const alreadyExists = this.pixels.some(
                p => Math.abs(p.x - nx) < this.pixelSize && Math.abs(p.y - ny) < this.pixelSize
            );
            if (alreadyExists) continue;

            // Density based on distance from moss origin (centre = denser)
            const dist = Math.sqrt((nx - this.x) ** 2 + (ny - this.y) ** 2);
            const maxDist = Math.max(this.elementRect.width, this.elementRect.height) * 0.5;
            const distFactor = Math.max(0, 1 - dist / maxDist);
            const density = 0.25 + distFactor * 0.75;

            this.pixels.push({
                x: nx, y: ny,
                age: 0,
                density,
                flickerOffset: Math.random() * Math.PI * 2
            });
            this.currentSize++;
        }
    }

    isWithinElement(x, y) {
        return (
            x >= this.elementRect.left && x <= this.elementRect.right &&
            y >= this.elementRect.top  && y <= this.elementRect.bottom
        );
    }

    isNearEdge(x, y) {
        const m = this.pixelSize * 3;
        return (
            x < this.elementRect.left  + m || x > this.elementRect.right  - m ||
            y < this.elementRect.top   + m || y > this.elementRect.bottom - m
        );
    }

    // ── Flowers ─────────────────────────────────────────────────────────────
    addFlower() {
        const mature = this.pixels.filter(p => p.age > 50 && p.density > 0.6);
        if (mature.length === 0) return;

        const host = mature[Math.floor(Math.random() * mature.length)];
        const petalCount = 3 + Math.floor(Math.random() * 3); // 3–5 petals
        const f = {
            x: host.x, y: host.y,
            age: 0,
            size: petalCount,
            pixels: [],
            appearPhase: Math.random() * Math.PI * 2
        };

        for (let i = 0; i < petalCount; i++) {
            const a = (i / petalCount) * Math.PI * 2;
            const d = this.pixelSize * (0.6 + Math.random() * 0.5);
            f.pixels.push({
                x: host.x + Math.cos(a) * d,
                y: host.y + Math.sin(a) * d
            });
        }
        this.flowers.push(f);
    }

    // ── Draw ─────────────────────────────────────────────────────────────────
    draw(ctx) {
        const ps = this.pixelSize;

        // Sort pixels so dark/dense ones draw first (centre), light ones on top
        const sorted = [...this.pixels].sort((a, b) => b.density - a.density);

        sorted.forEach(p => {
            const fadeIn = Math.min(1, p.age / 30);

            // Pick colour based on density (centre = dark, edge = light)
            let color;
            if      (p.density > 0.85) color = this.colorCore;
            else if (p.density > 0.68) color = this.colorDark;
            else if (p.density > 0.50) color = this.colorMid;
            else if (p.density > 0.32) color = this.colorLight;
            else                       color = this.colorFringe;

            let alpha = fadeIn * (0.5 + p.density * 0.5);

            // Outer pixels get a gentle sway flicker
            if (p.density < 0.45) {
                const flicker = Math.sin(this.animPhase + p.flickerOffset) * 0.25 + 0.75;
                alpha *= flicker;
                const sx = Math.sin(this.animPhase + p.flickerOffset) * 0.6;
                const sy = Math.cos(this.animPhase * 0.7 + p.flickerOffset) * 0.4;

                ctx.fillStyle  = color;
                ctx.globalAlpha = alpha;
                // Snap to pixel grid for chunky retro look
                const gx = Math.round((p.x + sx) / ps) * ps;
                const gy = Math.round((p.y + sy) / ps) * ps;
                ctx.fillRect(gx, gy, ps, ps);
            } else {
                ctx.fillStyle  = color;
                ctx.globalAlpha = alpha;
                const gx = Math.round(p.x / ps) * ps;
                const gy = Math.round(p.y / ps) * ps;
                ctx.fillRect(gx, gy, ps, ps);

                // Darker sub-pixel detail in the dense centre for texture
                if (p.density > 0.7 && Math.random() < 0.25) {
                    ctx.fillStyle   = this.colorCore;
                    ctx.globalAlpha = alpha * 0.4;
                    ctx.fillRect(gx, gy, ps * 0.5, ps * 0.5);
                }
            }
        });

        // Draw pink flowers
        this.flowers.forEach(f => {
            const lifePct = f.age / 300;
            let fa;
            if      (lifePct < 0.2) fa = lifePct / 0.2;
            else if (lifePct > 0.8) fa = (1 - lifePct) / 0.2;
            else                    fa = Math.sin(this.flowerPhase + f.appearPhase) * 0.15 + 0.85;

            f.pixels.forEach((fp, i) => {
                // Alternate petal shades for depth
                ctx.fillStyle   = i % 2 === 0 ? this.flowerColor : this.flowerColorLight;
                ctx.globalAlpha = fa;
                const gx = Math.round(fp.x / ps) * ps;
                const gy = Math.round(fp.y / ps) * ps;
                ctx.fillRect(gx, gy, ps, ps);
            });

            // White centre dot
            ctx.fillStyle   = '#ffffff';
            ctx.globalAlpha = fa * 0.85;
            const cx = Math.round(f.x / ps) * ps;
            const cy = Math.round(f.y / ps) * ps;
            ctx.fillRect(cx + ps * 0.25, cy + ps * 0.25, ps * 0.5, ps * 0.5);
        });

        ctx.globalAlpha = 1;
    }
}