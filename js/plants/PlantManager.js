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
        if (elements.length === 0) {
            console.warn('No growable elements found!');
            return;
        }
        
        const element = elements[Math.floor(Math.random() * elements.length)];
        const rect = element.getBoundingClientRect();
        
        // Ferns can grow from ANY edge
        const edges = ['top', 'bottom', 'left', 'right'];
        const edge = edges[Math.floor(Math.random() * edges.length)];
        
        let seedX, seedY;
        
        switch(edge) {
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
        
        this.plants.push(new Fern(seedX, seedY, this.pixelSize));
        console.log('🌿 Planted fern from', edge, 'edge at', { x: seedX, y: seedY });
    }

    plantRandomMoss() {
        const elements = this.getGrowableElements();
        if (elements.length === 0) {
            console.warn('No growable elements found!');
            return;
        }
        
        const element = elements[Math.floor(Math.random() * elements.length)];
        const rect = element.getBoundingClientRect();
        
        // Moss can start anywhere within the element bounds
        const seedX = rect.left + Math.random() * (rect.right - rect.left);
        const seedY = rect.top + Math.random() * (rect.bottom - rect.top);
        
        // Pass the element itself (not borderPixels) for realistic moss
        this.plants.push(new Moss(seedX, seedY, this.pixelSize, element));
        console.log('🍃 Planted moss patch at', { x: seedX, y: seedY });
    }

    plantRandomVine() {
        const elements = this.getGrowableElements();
        if (elements.length === 0) {
            console.warn('No growable elements found!');
            return;
        }
        
        const element = elements[Math.floor(Math.random() * elements.length)];
        const rect = element.getBoundingClientRect();
        
        // Vines start from TOP edge or upper SIDE edges (hanging plants)
        const edgeChoice = Math.random();
        let seedX, seedY;
        
        if (edgeChoice < 0.5) {
            // Top edge - most natural for hanging vines
            seedX = rect.left + Math.random() * (rect.right - rect.left);
            seedY = rect.top;
        } else if (edgeChoice < 0.75) {
            // Left edge (upper portion only)
            seedX = rect.left;
            seedY = rect.top + Math.random() * (rect.bottom - rect.top) * 0.3;
        } else {
            // Right edge (upper portion only)
            seedX = rect.right;
            seedY = rect.top + Math.random() * (rect.bottom - rect.top) * 0.3;
        }
        
        this.plants.push(new Vine(seedX, seedY, this.pixelSize));
        console.log('🌱 Planted hanging vine at', { x: seedX, y: seedY });
    }

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