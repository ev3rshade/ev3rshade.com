import Fern from './Fern.js';

export default class FernCluster {
    constructor(x, y, pixelSize, canvasHeight) {
        this.x = x;
        this.y = y;
        this.pixelSize = pixelSize;
        this.canvasHeight = canvasHeight || window.innerHeight;

        // 1–5 ferns per cluster
        this.count = 1 + Math.floor(Math.random() * 5);

        // Base height determined by vertical position on screen
        const verticalRatio = y / this.canvasHeight;
        const isBottomZone  = verticalRatio > 0.80;
        const baseMaxHeight = isBottomZone
            ? 60 + Math.random() * 60
            : 8 + (1 - verticalRatio) * 22 + Math.random() * 10;

        this.ferns = [];

        for (let i = 0; i < this.count; i++) {
            // Each fern varies in height within ±35% of the cluster base
            const fernMaxHeight = Math.max(6, baseMaxHeight * (0.65 + Math.random() * 0.70));

            // Scatter roots slightly so stems don't perfectly overlap
            const rootSpread = this.count > 1 ? (Math.random() - 0.5) * pixelSize * 1.5 : 0;

            const fern = new Fern(x + rootSpread, y, pixelSize, canvasHeight, fernMaxHeight);

            // Fan growth angles evenly across an arc, wider for larger clusters
            const spreadRange = Math.min(Math.PI * 0.7, 0.25 + this.count * 0.18);
            const fanOffset   = this.count > 1
                ? -spreadRange / 2 + i * (spreadRange / (this.count - 1))
                : 0;

            fern.growthAngle = -Math.PI / 2 + fanOffset + (Math.random() - 0.5) * 0.08;

            this.ferns.push(fern);
        }
    }

    update() {
        this.ferns.forEach(f => f.update());
    }

    draw(ctx) {
        this.ferns.forEach(f => f.draw(ctx));
    }
}