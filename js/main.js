// js entry point

import PlantManager from './plants/PlantManager.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize
    const canvas = document.getElementById('plant-canvas');
    const plantManager = new PlantManager(canvas);
    window.plantManager = plantManager;

    // Plant initial plants
    setTimeout(() => plantManager.plantRandomFern(), 500);
    setTimeout(() => plantManager.plantRandomMoss(), 1000);
    setTimeout(() => plantManager.plantRandomVine(), 1500);
});