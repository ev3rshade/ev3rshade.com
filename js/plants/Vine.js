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

        this.angle        = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
        this.angleVel     = 0;
        this.angleAcc     = 0;
        this.gravityBias  = 0.10; // stronger pull toward vertical
        this.curlStrength = 0.06;
        this.damping      = 0.82;

        this.reachedBottom = false;
        this.groundDirX    = Math.random() < 0.5 ? 1 : -1;

        this.noiseSeed = Math.random() * 1000;
        this.noiseT    = 0;

        this.flowerPhase = Math.random() * Math.PI * 2;
        this.flowerSpeed = 0.003;

        this.stemColors  = ['#147539', '#1a6b35', '#0f5c2a', '#1e7040'];
        this.stemColor   = '#147539';
        this.leafPalette = [
            '#006838',
            '#147539',
            '#28833a',
            '#3c903b',
            '#4f9d3c',
            '#63aa3d',
            '#77b83e',
            '#8bc53f',
            '#a3ce29',
        ];

        this.flowerColors = ['#ff9900', '#ffb833', '#ffcc00', '#ff7700', '#ffdd44'];
    }

    _noise(t) {
        return (
            Math.sin(t * 0.8  + this.noiseSeed) * 0.5 +
            Math.sin(t * 1.7  + this.noiseSeed * 1.3) * 0.3 +
            Math.sin(t * 3.1  + this.noiseSeed * 0.7) * 0.2
        );
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
            this.noiseT += 0.18;

            this.angleAcc = this._noise(this.noiseT) * this.curlStrength;

            const angleDiff = Math.PI / 2 - this.angle;
            this.angleAcc += angleDiff * this.gravityBias;

            this.angleVel = (this.angleVel + this.angleAcc) * this.damping;
            this.angle   += this.angleVel;

            // Clamp to ±40° from vertical — allows curves but not horizontal
            const maxAngle = Math.PI / 2 + Math.PI * 0.22;
            const minAngle = Math.PI / 2 - Math.PI * 0.22;
            this.angle = Math.max(minAngle, Math.min(maxAngle, this.angle));

            nx = tip.x + Math.cos(this.angle) * ps;
            ny = tip.y + Math.sin(this.angle) * ps;

            if (ny >= window.innerHeight - ps * 2) {
                ny = window.innerHeight - ps * 2;
                this.reachedBottom = true;
                if (Math.random() < 0.75) this.maxLength = this.segments.length + 1;
            }
        } else {
            nx = tip.x + this.groundDirX * ps;
            ny = tip.y + (Math.random() - 0.5) * ps * 0.3;
            ny = Math.min(ny, window.innerHeight - ps);
            nx = Math.round(nx / ps) * ps;
            ny = Math.round(ny / ps) * ps;
        }

        this.segments.push({ x: nx, y: ny, age: 0 });

        if (this.segments.length % (6 + Math.floor(Math.random() * 5)) === 0) {
            this.addLeaf(nx, ny, this.segments.length);
        }
    }

    addLeaf(x, y, segIdx) {
        const side  = this.leaves.length % 2 === 0 ? 1 : -1;
        const scale = 1.0 + Math.random() * 1.5;
        this.leaves.push({
            x, y, side, scale,
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

    drawStem(ctx) {
        const thickness = this.pixelSize * 0.55;
        ctx.lineCap  = 'square';
        ctx.lineJoin = 'miter';

        for (let i = 1; i < this.segments.length; i++) {
            const a     = this.segments[i - 1];
            const b     = this.segments[i];
            const alpha = Math.min(1, b.age / 15);
            if (alpha <= 0) continue;

            // Deterministic colour per segment
            const noise = Math.sin(a.x * 0.31 + a.y * 0.47 + i * 0.19);
            const ci    = Math.floor((noise * 0.5 + 0.5) * this.stemColors.length);
            ctx.strokeStyle = this.stemColors[Math.min(ci, this.stemColors.length - 1)];
            ctx.lineWidth   = thickness;
            ctx.globalAlpha = alpha;

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    drawLeaf(ctx, leaf) {
        const alpha = Math.min(1, leaf.age / 20);
        if (alpha <= 0) return;

        const ps = this.pixelSize * 0.5 * leaf.scale;
        const s  = leaf.side;

        ctx.globalAlpha = alpha;

        const grid = [
            [0, -6],
            [-1,-5],[0,-5],[1,-5],
            [-1,-4],[0,-4],[1,-4],[2,-4],
            [-2,-3],[0,-3],[1,-3],[2,-3],
            [-2,-2],[-1,-2],[0,-2],[1,-2],[2,-2],[3,-2],
            [-2,-1],[-1,-1],[0,-1],[1,-1],[2,-1],[3,-1],
            [-2, 0],[-1, 0],[0, 0],[1, 0],[2, 0],[3, 0],
            [-1, 1],[0, 1],[1, 1],[2, 1],[3, 1],
            [-1, 2],[0, 2],[1, 2],[2, 2],
            [0,  3],[1, 3],
            [0,  4],
        ];

        grid.forEach(([col, row]) => {
            const nx    = (col + 3) / 6;
            const ny    = (row + 6) / 12;
            const noise = (Math.sin(col * 7.3 + row * 13.1) * 0.5 + 0.5) * 0.25;
            const shade = nx * 0.4 + ny * 0.35 + noise;
            const pi    = Math.min(
                this.leafPalette.length - 1,
                Math.floor(shade * (this.leafPalette.length - 1))
            );
            ctx.fillStyle = this.leafPalette[pi];
            ctx.fillRect(leaf.x + s * col * ps, leaf.y + row * ps, ps, ps);
        });

        ctx.globalAlpha = 1;
    }

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

        ctx.fillStyle   = '#ffee55';
        ctx.globalAlpha = fa;
        ctx.fillRect(gx, gy, ps, ps);

        ctx.globalAlpha = 1;
    }
}