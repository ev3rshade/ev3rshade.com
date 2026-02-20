export default class Moss {
    constructor(x, y, pixelSize, borderPixels) {
        this.x = x;
        this.y = y;
        this.pixelSize = pixelSize;
        this.borderPixels = borderPixels;
        this.pixels = [{ x, y, age: 0 }];
        this.maxSize = 30 + Math.random() * 50;
        this.growthSpeed = 0.5;
        this.growth = 0;
        this.breathPhase = Math.random() * Math.PI * 2;
        this.color = this.randomBlueShade();
    }

    randomBlueShade() {
        const blues = ['#0066ff', '#4d94ff', '#1a75ff', '#0052cc'];
        return blues[Math.floor(Math.random() * blues.length)];
    }

    update() {
        if (this.pixels.length < this.maxSize) {
            this.growth += this.growthSpeed;
            if (this.growth >= 1) {
                this.growth = 0;
                this.spreadMoss();
            }
        }
        this.pixels.forEach(p => p.age++);
        this.breathPhase += 0.015;
    }

    spreadMoss() {
        const source = this.pixels[Math.floor(Math.random() * this.pixels.length)];
        const nearby = this.borderPixels.filter(bp => {
            const dx = bp.x - source.x;
            const dy = bp.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < this.pixelSize * 3 && dist > 0;
        });
        if (nearby.length > 0) {
            const target = nearby[Math.floor(Math.random() * nearby.length)];
            const exists = this.pixels.some(p => p.x === target.x && p.y === target.y);
            if (!exists) {
                this.pixels.push({ x: target.x, y: target.y, age: 0 });
            }
        }
    }

    draw(ctx) {
        const breathScale = 1 + Math.sin(this.breathPhase) * 0.02;
        this.pixels.forEach(pixel => {
            const alpha = Math.min(1, pixel.age / 20);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha;
            const offsetX = (pixel.x - this.x) * (breathScale - 1);
            const offsetY = (pixel.y - this.y) * (breathScale - 1);
            ctx.fillRect(pixel.x + offsetX, pixel.y + offsetY, this.pixelSize, this.pixelSize);
        });
        ctx.globalAlpha = 1;
    }
}