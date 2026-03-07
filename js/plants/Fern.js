export default class Fern {
    constructor(x, y, pixelSize, canvasHeight, overrideMaxHeight) {
        this.x = x;
        this.y = y;
        this.pixelSize = pixelSize;
        this.canvasHeight = canvasHeight || window.innerHeight;

        this.stem = [{ x, y, age: 0 }];
        this.fronds = [];

        this.growth = 0;

        // Height based on vertical position (or override from cluster)
        if (overrideMaxHeight !== undefined) {
            this.maxHeight = overrideMaxHeight;
        } else {
            const verticalRatio = y / this.canvasHeight;
            const isBottomZone = verticalRatio > 0.80;
            if (isBottomZone) {
                this.maxHeight = 60 + Math.random() * 60;
            } else {
                const shortScale = 1 - verticalRatio;
                this.maxHeight = 8 + shortScale * 22 + Math.random() * 10;
            }
        }

        this.growthSpeed = 0.3;
        this.currentHeight = 0;

        this.growthAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
        this.angleVariation = 0.05;

        this.swayPhase = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.006;
        this.swayAmount = 1.8 * (pixelSize / 6);

        const greenPalettes = [
            { stem: '#2d5a1b', frond: '#3d7a24', detail: '#5aaa35', leafLight: '#5aaa35', leafMid: '#4a9130', leafDark: '#2d5a1b' },
            { stem: '#1e4d10', frond: '#2e6b18', detail: '#4a9130', leafLight: '#4a9130', leafMid: '#3d7a24', leafDark: '#1e4d10' },
            { stem: '#3a6b22', frond: '#4e8c2f', detail: '#6ab040', leafLight: '#6ab040', leafMid: '#5aaa35', leafDark: '#3a6b22' },
        ];
        const palette = greenPalettes[Math.floor(Math.random() * greenPalettes.length)];
        this.stemColor   = palette.stem;
        this.frondColor  = palette.frond;
        this.detailColor = palette.detail;
        this.leafLight   = palette.leafLight;
        this.leafMid     = palette.leafMid;
        this.leafDark    = palette.leafDark;
    }

    update() {
        if (this.currentHeight < this.maxHeight) {
            this.growth += this.growthSpeed;
            if (this.growth >= 1) {
                this.growth = 0;
                this.growStem();
            }
        }
        this.stem.forEach(s => s.age++);
        this.fronds.forEach(f => {
            f.age++;
            f.segments.forEach(s => s.age++);
        });
        this.swayPhase += this.swaySpeed;
    }

    growStem() {
        const t = this.stem[this.stem.length - 1];
        this.growthAngle += (Math.random() - 0.5) * this.angleVariation;
        const nx = t.x + Math.cos(this.growthAngle) * this.pixelSize;
        const ny = t.y + Math.sin(this.growthAngle) * this.pixelSize;
        this.stem.push({ x: nx, y: ny, age: 0 });
        this.currentHeight++;

        const frondInterval = this.maxHeight > 30 ? 3 : 2;
        if (this.stem.length % frondInterval === 0 && this.stem.length > 3) {
            const side = this.fronds.length % 2 === 0 ? 1 : -1;
            this.addFrond(nx, ny, side, this.stem.length);
        }
    }

    addFrond(x, y, side, si) {
        const heightRatio = this.maxHeight / 120;
        const fl = Math.max(6, Math.floor((18 + Math.random() * 14) * heightRatio));

        const stemProgress = si / Math.max(1, this.maxHeight);
        const spreadAngle = Math.PI / 2.2 - stemProgress * 0.4;
        const ba = side * (spreadAngle + (Math.random() - 0.5) * 0.2);

        const droopStrength = 0.35 + Math.random() * 0.2;

        const f = {
            x, y, side, age: 0,
            stemIndex: si,
            segments: [],
            pinnae: [],
            length: fl,
            baseAngle: ba,
            droop: droopStrength,
            stemProgress
        };

        for (let i = 0; i < fl; i++) {
            const progress = i / (fl - 1);
            const archAngle = ba + (progress * progress) * droopStrength * Math.PI * side * 0.4;
            const stepX = Math.cos(archAngle) * this.pixelSize * 1.1;
            const stepY = Math.sin(archAngle) * this.pixelSize * 0.7 + progress * progress * this.pixelSize * 2.2;

            const sx = i === 0 ? x : f.segments[i - 1].x + stepX;
            const sy = i === 0 ? y : f.segments[i - 1].y + stepY;
            f.segments.push({ x: sx, y: sy, angle: archAngle, age: 0 });

            if (i > 1 && i < fl - 1) {
                this.addPinna(f, sx, sy, archAngle, progress, fl);
            }
        }

        this.fronds.push(f);
    }

    addPinna(f, x, y, frondAngle, progress, totalLen) {
        const lengthScale = (1 - progress * 0.75);
        const pinnaLen = Math.max(2, Math.floor((5 + Math.random() * 5) * lengthScale));

        [-1, 1].forEach(side => {
            const perpAngle = frondAngle + side * (Math.PI / 2) - side * progress * 0.3;
            const pixels = [];

            for (let i = 0; i < pinnaLen; i++) {
                const t = i / Math.max(1, pinnaLen - 1);
                const curvedAngle = perpAngle + side * t * 0.25;
                const px = x + Math.cos(curvedAngle) * i * this.pixelSize * 0.95;
                const py = y + Math.sin(curvedAngle) * i * this.pixelSize * 0.75;
                pixels.push({ px, py });
            }

            f.pinnae.push({ x, y, side, pixels, progress, len: pinnaLen });
        });
    }

    draw(ctx) {
        this.drawStem(ctx);
        this.fronds.forEach((f, i) => { if (i % 2 === 1) this.drawFrond(ctx, f, i); });
        this.fronds.forEach((f, i) => { if (i % 2 === 0) this.drawFrond(ctx, f, i); });
    }

    drawStem(ctx) {
        if (this.stem.length < 2) return;
        ctx.strokeStyle = this.stemColor;
        ctx.lineWidth = Math.max(1, this.pixelSize * 0.5);
        ctx.lineCap = 'square';
        ctx.beginPath();
        ctx.moveTo(this.stem[0].x, this.stem[0].y);
        for (let i = 1; i < this.stem.length; i++) {
            const s = this.stem[i];
            ctx.globalAlpha = Math.min(1, s.age / 20);
            const sw = Math.sin(this.swayPhase + i * 0.02) * (i / this.stem.length) * 0.5 * (this.pixelSize / 6);
            ctx.lineTo(s.x + sw, s.y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    drawFrond(ctx, f, fi) {
        const alpha = Math.min(1, f.age / 30);
        const si = f.stemIndex / Math.max(1, this.stem.length);
        const swayX = Math.sin(this.swayPhase + fi * 0.35) * si * this.swayAmount;
        const swayY = Math.cos(this.swayPhase * 0.7 + fi * 0.2) * si * 0.6 * (this.pixelSize / 6);

        ctx.globalAlpha = alpha;

        ctx.strokeStyle = this.stemColor;
        ctx.lineWidth = Math.max(1, this.pixelSize * 0.3);
        ctx.lineCap = 'square';
        if (f.segments.length > 1) {
            ctx.beginPath();
            ctx.moveTo(f.segments[0].x + swayX * 0.1, f.segments[0].y + swayY * 0.1);
            f.segments.forEach((s, i) => {
                const t = i / f.segments.length;
                ctx.lineTo(s.x + swayX * t, s.y + swayY * t);
            });
            ctx.stroke();
        }

        f.pinnae.forEach((p, pi) => this.drawPinna(ctx, p, swayX, swayY, pi));
        ctx.globalAlpha = 1;
    }

    drawPinna(ctx, p, swayX, swayY, pi) {
        if (p.pixels.length < 2) return;

        const t = p.progress;
        const sx = swayX * t;
        const sy = swayY * t;
        const pixSize = Math.max(2, Math.round(this.pixelSize * 0.9));

        p.pixels.forEach((pt, i) => {
            const leafT = i / (p.pixels.length - 1);

            if (leafT < 0.3)      ctx.fillStyle = this.leafDark;
            else if (leafT < 0.7) ctx.fillStyle = this.leafMid;
            else                  ctx.fillStyle = this.leafLight;

            const gx = Math.round((pt.px + sx) / pixSize) * pixSize;
            const gy = Math.round((pt.py + sy) / pixSize) * pixSize;
            ctx.fillRect(gx - pixSize / 2, gy - pixSize / 2, pixSize, pixSize);

            if (i === 0 || i === 1) {
                ctx.fillStyle = this.leafDark;
                ctx.fillRect(gx - pixSize / 2, gy - pixSize / 2 + pixSize, pixSize, pixSize);
            }
        });

        const tip = p.pixels[p.pixels.length - 1];
        if (tip) {
            ctx.fillStyle = this.leafLight;
            const gx = Math.round((tip.px + sx) / pixSize) * pixSize;
            const gy = Math.round((tip.py + sy) / pixSize) * pixSize;
            ctx.fillRect(gx - pixSize / 2, gy - pixSize / 2, pixSize, pixSize);
        }
    }
}