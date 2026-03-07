export default class Moss {
    constructor(x, y, ps, el) {
        this.x = x;
        this.y = y;
        this.pixelSize = ps;
        this.element = el;
        this.elementRect = el.getBoundingClientRect();

        this.pixels = [];
        this.flowers = [];

        // Dome radius grows over time up to a max
        this.currentRadius = ps;
        // Skew toward larger sizes — occasional very large bushes
        const roll = Math.random();
        if (roll < 0.5)       this.maxRadius = 40  + Math.random() * 60;   // 40–100  (common)
        else if (roll < 0.8)  this.maxRadius = 100 + Math.random() * 80;   // 100–180 (medium)
        else                  this.maxRadius = 180 + Math.random() * 120;  // 180–300 (large)

        this.growthSpeed = 0.4;
        this.growth = 0;

        this.flowerPhase = Math.random() * Math.PI * 2;
        this.flowerSpeed = 0.002;

        // Green palette — dark base/shadow to light highlight top
        this.colorShadow  = '#1a3310'; // darkest — bottom shadow
        this.colorDark    = '#2d5a1b'; // dark green
        this.colorMid     = '#4a9130'; // mid green
        this.colorLight   = '#6ab040'; // bright
        this.colorHighlight = '#9dd65a'; // lightest — top highlight

        // Pink flowers
        this.flowerColor      = '#e87aa0';
        this.flowerColorLight = '#f5b8cc';

        // Pre-fill the dome pixel grid from the start so it builds outward
        this._buildDome();
    }

    // ── Build a full dome pixel grid, revealed progressively ──────────────
    _buildDome() {
        const ps = this.pixelSize;
        const r  = this.maxRadius;

        // Generate all pixels that would be in the final dome, store with a
        // "revealRadius" so we can grow them in from centre outward
        this._domePixels = [];

        for (let dx = -r; dx <= r; dx += ps) {
            for (let dy = -r; dy <= 0; dy += ps) { // only upper half = dome
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > r) continue;

                // Squash slightly vertically so it's a wide dome not a semicircle
                const domeDist = Math.sqrt((dx * dx) + (dy * dy) * 1.4);
                if (domeDist > r) continue;

                // Add some organic edge noise — drop ~20% of outer pixels
                const edgeFactor = dist / r;
                if (edgeFactor > 0.75 && Math.random() < (edgeFactor - 0.75) * 2.5) continue;

                const wx = this.x + dx;
                const wy = this.y + dy;

                if (!this.isWithinElement(wx, wy)) continue;

                this._domePixels.push({
                    x: Math.round(wx / ps) * ps,
                    y: Math.round(wy / ps) * ps,
                    dist,
                    // normalised height within dome: 0=bottom edge, 1=top
                    heightFactor: 1 - ((dy + r) / r),
                    flickerOffset: Math.random() * Math.PI * 2,
                    age: 0,
                    revealed: false
                });
            }
        }

        // Sort by distance from centre so growth radiates outward
        this._domePixels.sort((a, b) => a.dist - b.dist);
        this._revealIndex = 0;
    }

    // ── Update ─────────────────────────────────────────────────────────────
    update() {
        // Reveal pixels outward from centre
        if (this._revealIndex < this._domePixels.length) {
            this.growth += this.growthSpeed;
            const toReveal = Math.floor(this.growth);
            this.growth -= toReveal;

            for (let i = 0; i < toReveal && this._revealIndex < this._domePixels.length; i++) {
                this._domePixels[this._revealIndex].revealed = true;
                this._revealIndex++;
            }
        }

        this._domePixels.forEach(p => { if (p.revealed) p.age++; });
        this.flowers.forEach(f => f.age++);

        const revealed = this._domePixels.filter(p => p.revealed);
        if (revealed.length > 20 && Math.random() < 0.015) this.addFlower(revealed);
        this.flowers = this.flowers.filter(f => f.age < 320);

        this.flowerPhase += this.flowerSpeed;
    }

    isWithinElement(x, y) {
        const r = this.elementRect;
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }

    // ── Flowers ────────────────────────────────────────────────────────────
    addFlower(revealed) {
        // Only bloom near the top of the dome
        const topPixels = revealed.filter(p => p.heightFactor > 0.5 && p.age > 40);
        if (topPixels.length === 0) return;

        const host = topPixels[Math.floor(Math.random() * topPixels.length)];
        const petalCount = 3 + Math.floor(Math.random() * 3);
        const f = {
            x: host.x, y: host.y,
            age: 0,
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

    // ── Draw ───────────────────────────────────────────────────────────────
    draw(ctx) {
        const ps = this.pixelSize;

        this._domePixels.forEach(p => {
            if (!p.revealed) return;

            const h = p.heightFactor;
            const edgeFactor = p.dist / this.maxRadius;
            const shadingFactor = h * 0.65 + (1 - edgeFactor) * 0.35;

            let color;
            if      (shadingFactor < 0.15) color = this.colorShadow;
            else if (shadingFactor < 0.35) color = this.colorDark;
            else if (shadingFactor < 0.58) color = this.colorMid;
            else if (shadingFactor < 0.78) color = this.colorLight;
            else                           color = this.colorHighlight;

            ctx.fillStyle   = color;
            ctx.globalAlpha = 0.6 + (1 - edgeFactor) * 0.4;
            ctx.fillRect(p.x, p.y, ps, ps);
        });

        // ── Pink flowers ───────────────────────────────────────────────────
        this.flowers.forEach(f => {
            const lifePct = f.age / 320;
            let fa;
            if      (lifePct < 0.15) fa = lifePct / 0.15;
            else if (lifePct > 0.82) fa = (1 - lifePct) / 0.18;
            else                     fa = Math.sin(this.flowerPhase + f.appearPhase) * 0.1 + 0.9;

            f.pixels.forEach((fp, i) => {
                ctx.fillStyle   = i % 2 === 0 ? this.flowerColor : this.flowerColorLight;
                ctx.globalAlpha = fa;
                ctx.fillRect(
                    Math.round(fp.x / ps) * ps,
                    Math.round(fp.y / ps) * ps,
                    ps, ps
                );
            });

            // White centre
            ctx.fillStyle   = '#ffffff';
            ctx.globalAlpha = fa * 0.9;
            ctx.fillRect(
                Math.round(f.x / ps) * ps + ps * 0.25,
                Math.round(f.y / ps) * ps + ps * 0.25,
                ps * 0.5, ps * 0.5
            );
        });

        ctx.globalAlpha = 1;
    }
}