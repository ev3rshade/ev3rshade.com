import FernCluster from './FernCluster.js';
import Moss from './Moss.js';
import Vine from './Vine.js';

export default class PlantManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.plants = [];
        this.pixelSize = 8; // ADJUST PIXELS HERE
        this.setupCanvas();
        this.animate();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    getGrowableElements() {
        return Array.from(document.querySelectorAll('.title, .navbar, .imagewrapper, .navbar a'));
    }

    getElementBorderPixels(element) {
        const rect = element.getBoundingClientRect();
        const pixels = [];
        const step = this.pixelSize;
        for (let x = rect.left; x < rect.right; x += step) {
            pixels.push({ x: Math.floor(x), y: Math.floor(rect.top), edge: 'top' });
        }
        for (let x = rect.left; x < rect.right; x += step) {
            pixels.push({ x: Math.floor(x), y: Math.floor(rect.bottom), edge: 'bottom' });
        }
        for (let y = rect.top; y < rect.bottom; y += step) {
            pixels.push({ x: Math.floor(rect.left), y: Math.floor(y), edge: 'left' });
        }
        for (let y = rect.top; y < rect.bottom; y += step) {
            pixels.push({ x: Math.floor(rect.right), y: Math.floor(y), edge: 'right' });
        }
        return pixels;
    }

    // ── Fern: 70% ground, 30% element edge ────────────────────────────────
    plantRandomFern() {
        if (Math.random() < 0.7) {
            this.plantGroundFern();
            return;
        }
        const elements = this.getGrowableElements();
        if (elements.length === 0) {
            console.warn('No growable elements found!');
            return;
        }

        const element = elements[Math.floor(Math.random() * elements.length)];
        const rect = element.getBoundingClientRect();

        const edges = ['top', 'bottom', 'left', 'right'];
        const edge = edges[Math.floor(Math.random() * edges.length)];

        let seedX, seedY;
        switch (edge) {
            case 'top':
                seedX = rect.left + Math.random() * (rect.right - rect.left);
                seedY = rect.top;
                break;
            case 'bottom':
                seedX = rect.left + Math.random() * (rect.right - rect.left);
                seedY = rect.bottom;
                break;
            case 'left':
                seedX = rect.left;
                seedY = rect.top + Math.random() * (rect.bottom - rect.top);
                break;
            case 'right':
                seedX = rect.right;
                seedY = rect.top + Math.random() * (rect.bottom - rect.top);
                break;
        }

        this.plants.push(new FernCluster(seedX, seedY, this.pixelSize, this.canvas.height));
        console.log('🌿 Planted fern cluster from', edge, 'edge at', { x: seedX, y: seedY });
    }

    // ── Fern on the ground (bottom of canvas) ─────────────────────────────
    plantGroundFern(x) {
        // x is optional — omit for a random position along the bottom
        const seedX = x !== undefined ? x : Math.random() * this.canvas.width;
        const seedY = this.canvas.height;

        this.plants.push(new FernCluster(seedX, seedY, this.pixelSize, this.canvas.height));
        console.log('🌱 Planted ground fern cluster at', { x: seedX, y: seedY });
    }

    // Convenience: fill the ground with evenly spaced fern clusters
    plantGroundRow(count = 10) {
        const spacing = this.canvas.width / count;
        for (let i = 0; i < count; i++) {
            // Randomise position within each slot so it doesn't look mechanical
            const seedX = spacing * i + Math.random() * spacing;
            this.plantGroundFern(seedX);
        }
        console.log(`🌿 Planted ${count} ground fern clusters along the bottom`);
    }

    // ── Moss ───────────────────────────────────────────────────────────────
    plantRandomMoss() {
        const elements = this.getGrowableElements();
        if (elements.length === 0) {
            console.warn('No growable elements found!');
            return;
        }

        const element = elements[Math.floor(Math.random() * elements.length)];
        const rect = element.getBoundingClientRect();

        const seedX = rect.left + Math.random() * (rect.right - rect.left);
        const seedY = rect.top + Math.random() * (rect.bottom - rect.top);

        this.plants.push(new Moss(seedX, seedY, this.pixelSize, element));
        console.log('🍃 Planted moss patch at', { x: seedX, y: seedY });
    }

    // ── Vine ───────────────────────────────────────────────────────────────
    plantRandomVine() {
        const elements = this.getGrowableElements();
        if (elements.length === 0) {
            console.warn('No growable elements found!');
            return;
        }

        const element = elements[Math.floor(Math.random() * elements.length)];
        const rect = element.getBoundingClientRect();

        const edgeChoice = Math.random();
        let seedX, seedY;

        if (edgeChoice < 0.5) {
            seedX = rect.left + Math.random() * (rect.right - rect.left);
            seedY = rect.top;
        } else if (edgeChoice < 0.75) {
            seedX = rect.left;
            seedY = rect.top + Math.random() * (rect.bottom - rect.top) * 0.3;
        } else {
            seedX = rect.right;
            seedY = rect.top + Math.random() * (rect.bottom - rect.top) * 0.3;
        }

        this.plants.push(new Vine(seedX, seedY, this.pixelSize));
        console.log('🌱 Planted hanging vine at', { x: seedX, y: seedY });
    }

    // ── Utility ────────────────────────────────────────────────────────────
    clearAll() {
        this.plants = [];
        console.log('🧹 Cleared all plants');
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.plants.forEach(plant => {
            plant.update();
            plant.draw(this.ctx);
        });
        requestAnimationFrame(() => this.animate());
    }
}