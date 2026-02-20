export default class Fern {
    constructor(x, y, pixelSize) {
        this.x = x;
        this.y = y;
        this.pixelSize = pixelSize;
        
        this.stem = [{ x, y, age: 0 }];
        this.fronds = [];
        
        this.growth = 0;
        // Scale height to maintain visual size regardless of pixelSize
        this.maxHeight = 50 + Math.random() * 60;
        this.growthSpeed = 0.25;
        this.currentHeight = 0;
        
        this.growthAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
        this.angleVariation = 0.05;
        
        this.swayPhase = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.006;
        // Scale sway amount with pixelSize
        this.swayAmount = 1.5 * (pixelSize / 6);
        
        this.stemColor = ['#0052cc', '#0066ff', '#1a75ff'][Math.floor(Math.random() * 3)];
        this.frondColor = ['#3385ff', '#4d94ff', '#1a75ff'][Math.floor(Math.random() * 3)];
        this.detailColor = ['#6699ff', '#80aaff', '#5c8cff'][Math.floor(Math.random() * 3)];
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
        if (this.stem.length % 4 === 0 && this.stem.length > 5) {
            const side = this.fronds.length % 2 === 0 ? 1 : -1;
            this.addFrond(nx, ny, side, this.stem.length);
        }
    }
    
    addFrond(x, y, side, si) {
        const fl = 10 + Math.random() * 12;
        const ba = side * (Math.PI / 3 + Math.random() * 0.3);
        const f = {
            x, y, side, age: 0,
            stemIndex: si,
            segments: [],
            pinnae: [],
            length: fl,
            baseAngle: ba
        };
        for (let i = 0; i < fl; i++) {
            const a = ba + (Math.random() - 0.5) * 0.1;
            const sx = x + Math.cos(a) * i * this.pixelSize;
            const sy = y + Math.sin(a) * i * this.pixelSize * 0.5;
            f.segments.push({ x: sx, y: sy, age: 0 });
            if (i > 1 && i % 2 === 0 && i < fl - 2) this.addPinna(f, sx, sy, i, fl);
        }
        this.fronds.push(f);
    }
    
    addPinna(f, x, y, pos, tl) {
        const pg = pos / tl;
        const pl = 3 + (1 - pg) * 5;
        const s = (f.pinnae.length % 2 === 0) ? 1 : -1;
        const pa = f.baseAngle + s * Math.PI / 2;
        const p = { x, y, side: s, segments: [], length: pl };
        for (let i = 0; i < pl; i++) {
            const a = pa + (i / pl) * 0.2 * s;
            p.segments.push({
                x: x + Math.cos(a) * i * this.pixelSize * 0.8,
                y: y + Math.sin(a) * i * this.pixelSize * 0.8
            });
        }
        f.pinnae.push(p);
    }
    
    draw(ctx) {
        this.drawStem(ctx);
        this.fronds.forEach((f, i) => this.drawFrond(ctx, f, i));
    }
    
    drawStem(ctx) {
        if (this.stem.length < 2) return;
        ctx.strokeStyle = this.stemColor;
        ctx.lineWidth = this.pixelSize * 0.5;
        ctx.lineCap = 'round';
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
        const a = Math.min(1, f.age / 30);
        const si = f.stemIndex / this.stem.length;
        const fs = Math.sin(this.swayPhase + fi * 0.3) * si * this.swayAmount;
        const fb = Math.cos(this.swayPhase * 0.7 + fi * 0.2) * si * 0.8 * (this.pixelSize / 6);
        ctx.globalAlpha = a;
        ctx.strokeStyle = this.stemColor;
        ctx.lineWidth = this.pixelSize * 0.4;
        ctx.lineCap = 'round';
        if (f.segments.length > 1) {
            ctx.beginPath();
            ctx.moveTo(f.segments[0].x + fs, f.segments[0].y + fb);
            f.segments.forEach((s, i) => {
                const ss = fs * (i / f.segments.length);
                ctx.lineTo(s.x + ss, s.y + fb);
            });
            ctx.stroke();
        }
        f.pinnae.forEach((p, pi) => this.drawPinna(ctx, p, fs, fb, pi));
        ctx.globalAlpha = 1;
    }
    
    drawPinna(ctx, p, bs, bb, i) {
        if (p.segments.length < 2) return;
        const ps = bs + Math.sin(this.swayPhase * 0.9 + i * 0.4) * 0.5 * (this.pixelSize / 6);
        ctx.fillStyle = this.frondColor;
        ctx.strokeStyle = this.detailColor;
        ctx.lineWidth = this.pixelSize * 0.2;
        ctx.beginPath();
        ctx.moveTo(p.x + ps, p.y + bb);
        p.segments.forEach((s, j) => {
            const o = p.side * (j / p.segments.length) * this.pixelSize * 0.5;
            ctx.lineTo(s.x + ps + o, s.y + bb);
        });
        for (let j = p.segments.length - 1; j >= 0; j--) {
            const s = p.segments[j];
            const o = -p.side * (j / p.segments.length) * this.pixelSize * 0.5;
            ctx.lineTo(s.x + ps + o, s.y + bb);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (p.segments.length > 4) {
            ctx.strokeStyle = this.detailColor;
            ctx.lineWidth = this.pixelSize * 0.15;
            ctx.beginPath();
            ctx.moveTo(p.x + ps, p.y + bb);
            p.segments.forEach(s => ctx.lineTo(s.x + ps, s.y + bb));
            ctx.stroke();
        }
    }
}