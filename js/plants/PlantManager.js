import Fern from './Fern.js';
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

    plantRandomFern() {
        const elements = this.getGrowableElements();
        if (elements.length === 0) return;
        const element = elements[Math.floor(Math.random() * elements.length)];
        const borderPixels = this.getElementBorderPixels(element);
        const bottomPixels = borderPixels.filter(p => p.edge === 'bottom');
        if (bottomPixels.length === 0) return;
        const seedPos = bottomPixels[Math.floor(Math.random() * bottomPixels.length)];
        this.plants.push(new Fern(seedPos.x, seedPos.y, this.pixelSize));
        this.updateCount();
    }

    plantRandomMoss() {
        const elements = this.getGrowableElements();
        if (elements.length === 0) return;
        const element = elements[Math.floor(Math.random() * elements.length)];
        const borderPixels = this.getElementBorderPixels(element);
        const seedPos = borderPixels[Math.floor(Math.random() * borderPixels.length)];
        this.plants.push(new Moss(seedPos.x, seedPos.y, this.pixelSize, borderPixels));
        this.updateCount();
    }

    plantRandomVine() {
        const elements = this.getGrowableElements();
        if (elements.length === 0) {
            console.warn('No growable elements found!');
            return;
        }
        
        const element = elements[Math.floor(Math.random() * elements.length)];
        const rect = element.getBoundingClientRect();
        
        // Vines start from TOP edge or SIDE edges (where they would naturally hang from)
        const edgeChoice = Math.random();
        let seedX, seedY;
        
        if (edgeChoice < 0.5) {
            // Top edge - most natural for hanging vines
            seedX = rect.left + Math.random() * (rect.right - rect.left);
            seedY = rect.top;
        } else if (edgeChoice < 0.75) {
            // Left edge
            seedX = rect.left;
            seedY = rect.top + Math.random() * (rect.bottom - rect.top) * 0.3; // Upper portion
        } else {
            // Right edge  
            seedX = rect.right;
            seedY = rect.top + Math.random() * (rect.bottom - rect.top) * 0.3; // Upper portion
        }
        
        // Import the new Vine class
        const vine = new Vine(seedX, seedY, this.pixelSize);
        this.plants.push(vine);
        
        console.log('🌿 Planted hanging vine at', { x: seedX, y: seedY });
    }


    clearAll() {
        this.plants = [];
        this.updateCount();
    }

    updateCount() {
        document.getElementById('plant-count').textContent = this.plants.length;
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