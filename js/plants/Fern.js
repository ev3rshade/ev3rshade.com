export default class Fern {
    constructor(x, y, pixelSize) {
        this.x = x;
        this.y = y;
        this.pixelSize = pixelSize;
        this.pixels = [{ x, y, age: 0 }];
        this.growth = 0;
        this.maxHeight = 60 + Math.random() * 40;
        this.growthSpeed = 0.3;
        this.breathPhase = Math.random() * Math.PI * 2;
        this.color = this.randomBlueShade();
    }

    randomBlueShade() {
        const blues = ['#0066ff', '#3385ff', '#0052cc', '#1a75ff'];
        return blues[Math.floor(Math.random() * blues.length)];
    }

    update() {
        if (this.growth < this.maxHeight) {
            this.growth += this.growthSpeed;
            if (Math.floor(this.growth) > this.pixels.length) {
                const newY = this.y - this.pixels.length * this.pixelSize;
                this.pixels.push({ x: this.x, y: newY, age: 0, type: 'stem' });
                if (this.pixels.length % 6 === 0) {
                    this.addFronds(this.x, newY);
                }
            }
        }
        this.pixels.forEach(p => p.age++);
        this.breathPhase += 0.02;
    }

    addFronds(x, y) {
        const frondLength = 8 + Math.random() * 8;
        for (let i = 1; i < frondLength; i++) {
            this.pixels.push({
                x: x - i * this.pixelSize,
                y: y - i * this.pixelSize * 0.5,
                age: 0, type: 'frond'
            });
        }
        for (let i = 1; i < frondLength; i++) {
            this.pixels.push({
                x: x + i * this.pixelSize,
                y: y - i * this.pixelSize * 0.5,
                age: 0, type: 'frond'
            });
        }
    }

    draw(ctx) {
        const breathScale = 1 + Math.sin(this.breathPhase) * 0.03;
        this.pixels.forEach(pixel => {
            ctx.fillStyle = this.color;
            const offsetX = (pixel.x - this.x) * (breathScale - 1);
            const offsetY = (pixel.y - this.y) * (breathScale - 1);
            ctx.fillRect(pixel.x + offsetX, pixel.y + offsetY, this.pixelSize, this.pixelSize);
        });
    }
}
