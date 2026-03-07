export default class Vine {
    constructor(x, y, pixelSize) {
        this.x = x;
        this.y = y;
        this.pixelSize = pixelSize;

        this.segments = [{ x, y, age: 0 }];
        this.leaves   = [];
        this.flowers  = [];

        this.maxLength   = 100 + Math.random() * 150;
        this.growthSpeed = 0.25;
        this.growth      = 0;

        this.dirX = (Math.random() - 0.5) * 0.3;
        this.dirY = 1;

        this.reachedBottom = false;
        this.groundDirX    = Math.random() < 0.5 ? 1 : -1;

        this.flowerPhase = Math.random() * Math.PI * 2;
        this.flowerSpeed = 0.003;

        // ── Palette from the provided colour swatch ────────────────────────
        // Dark forest greens → mid greens → yellow-greens
        this.stemColor   = '#147539'; // deep forest green for stem
        this.leafPalette = [
            '#006838', // darkest
            '#147539',
            '#28833a',
            '#3c903b',
            '#4f9d3c',
            '#63aa3d',
            '#77b83e',
            '#8bc53f', // lightest leaf green
            '#a3ce29', // yellow-green highlight
        ];

        // Orange-yellow flower palette
        this.flowerColors = ['#ff9900', '#ffb833', '#ffcc00', '#ff7700', '#ffdd44'];
    }

    update() {
        if (this.segments.length < this.maxLength) {
            this.growth += this.growthSpeed;
            if (this.growth >= 1) {
                this.growth = 0;
                this.growSegment();
            }
        }

        this.segments.forEach(s => s.age++);
        this.leaves.forEach(l => l.age++);
        this.flowers.forEach(f => f.age++);

        const matureLeaves = this.leaves.filter(l => l.age > 60);
        if (matureLeaves.length > 0 && Math.random() < 0.012) {
            this.addFlower(matureLeaves[Math.floor(Math.random() * matureLeaves.length)]);
        }

        this.flowers = this.flowers.filter(f => f.age < 350);
        this.flowerPhase += this.flowerSpeed;
    }

    growSegment() {
        const tip = this.segments[this.segments.length - 1];
        const ps  = this.pixelSize;
        let nx, ny;

        if (!this.reachedBottom) {
            this.dirX += (Math.random() - 0.5) * 0.25;
            this.dirX *= 0.85;
            const mag = Math.sqrt(this.dirX ** 2 + this.dirY ** 2);
            nx = tip.x + (this.dirX / mag) * ps;
            ny = tip.y + (this.dirY / mag) * ps;

            if (ny >= window.innerHeight - ps * 2) {
                ny = window.innerHeight - ps * 2;
                this.reachedBottom = true;
                // 75% chance the vine just stops at the ground
                if (Math.random() < 0.75) this.maxLength = this.segments.length + 1;
            }
        } else {
            nx = tip.x + this.groundDirX * ps;
            ny = tip.y + (Math.random() - 0.5) * ps * 0.3;
            ny = Math.min(ny, window.innerHeight - ps);
        }

        // Snap to pixel grid
        nx = Math.round(nx / ps) * ps;
        ny = Math.round(ny / ps) * ps;

        this.segments.push({ x: nx, y: ny, age: 0 });

        if (this.segments.length % (6 + Math.floor(Math.random() * 5)) === 0) {
            this.addLeaf(nx, ny, this.segments.length);
        }
    }

    addLeaf(x, y, segIdx) {
        const side = this.leaves.length % 2 === 0 ? 1 : -1;
        this.leaves.push({
            x, y, side,
            age: 0,
            segmentIndex: segIdx,
            swayOffset: Math.random() * Math.PI * 2
        });
    }

    addFlower(leaf) {
        this.flowers.push({
            x: leaf.x,
            y: leaf.y - this.pixelSize * 2,
            age: 0,
            color: this.flowerColors[Math.floor(Math.random() * this.flowerColors.length)],
            appearPhase: Math.random() * Math.PI * 2
        });
    }

    draw(ctx) {
        this.drawStem(ctx);
        this.leaves.forEach(l  => this.drawLeaf(ctx, l));
        this.flowers.forEach(f => this.drawFlower(ctx, f));
        ctx.globalAlpha = 1;
    }

    // ── Stem: drawn as snapped pixel squares, not a smooth line ─────────────
    drawStem(ctx) {
        const ps = this.pixelSize * 0.5;
        this.segments.forEach(s => {
            const alpha = Math.min(1, s.age / 15);
            if (alpha <= 0) return;
            ctx.fillStyle   = this.stemColor;
            ctx.globalAlpha = alpha;
            ctx.fillRect(s.x, s.y, ps, ps);
        });
        ctx.globalAlpha = 1;
    }

    // ── Leaf: oval grid of small tightly-packed pixels, colour variation ────
    drawLeaf(ctx, leaf) {
        const alpha = Math.min(1, leaf.age / 20);
        if (alpha <= 0) return;

        const ps = this.pixelSize * 0.5; // small pixel, no gap
        const s  = leaf.side;

        ctx.globalAlpha = alpha;

        const grid = [
            // tip
            [0, -6],
            // upper narrow
            [-1,-5],[0,-5],[1,-5],
            // widening
            [-1,-4],[0,-4],[1,-4],[2,-4],
            [-2,-3],[0,-3],[1,-3],[2,-3],
            // widest middle
            [-2,-2],[-1,-2],[0,-2],[1,-2],[2,-2],[3,-2],
            [-2,-1],[-1,-1],[0,-1],[1,-1],[2,-1],[3,-1],
            [-2, 0],[-1, 0],[0, 0],[1, 0],[2, 0],[3, 0],
            // narrowing lower
            [-1, 1],[0, 1],[1, 1],[2, 1],[3, 1],
            [-1, 2],[0, 2],[1, 2],[2, 2],
            [0,  3],[1, 3],
            // stem nub
            [0,  4],
        ];

        grid.forEach(([col, row]) => {
            // Shade: lighter top-left, darker bottom-right
            const nx = (col + 3) / 6;
            const ny = (row + 6) / 12;
            // Add a little per-pixel noise so adjacent cells aren't identical
            const noise = (Math.sin(col * 7.3 + row * 13.1) * 0.5 + 0.5) * 0.25;
            const shade = nx * 0.4 + ny * 0.35 + noise;
            const pi = Math.min(
                this.leafPalette.length - 1,
                Math.floor(shade * (this.leafPalette.length - 1))
            );
            ctx.fillStyle = this.leafPalette[pi];
            ctx.fillRect(leaf.x + s * col * ps, leaf.y + row * ps, ps, ps);
        });

        ctx.globalAlpha = 1;
    }

    // ── Flower: 4-petal cross with bright yellow centre ─────────────────────
    drawFlower(ctx, f) {
        const ps      = this.pixelSize * 0.5;
        const lifePct = f.age / 350;
        let   fa;
        if      (lifePct < 0.12) fa = lifePct / 0.12;
        else if (lifePct > 0.80) fa = (1 - lifePct) / 0.20;
        else                     fa = Math.sin(this.flowerPhase + f.appearPhase) * 0.1 + 0.9;

        ctx.globalAlpha = fa;

        const gx = Math.round(f.x / ps) * ps;
        const gy = Math.round(f.y / ps) * ps;

        ctx.fillStyle = f.color;
        [ [0,-1],[0,1],[-1,0],[1,0] ].forEach(([dx,dy]) => {
            ctx.fillRect(gx + dx * ps, gy + dy * ps, ps, ps);
        });

        // Yellow centre
        ctx.fillStyle   = '#ffee55';
        ctx.globalAlpha = fa;
        ctx.fillRect(gx, gy, ps, ps);

        ctx.globalAlpha = 1;
    }
}