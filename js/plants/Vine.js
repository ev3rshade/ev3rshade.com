export default class Vine {
    constructor(x, y, pixelSize) {
        this.x = x; // Starting point (on element edge)
        this.y = y;
        this.pixelSize = pixelSize;
        
        // Vine structure
        this.segments = [{ x, y, age: 0 }]; // Main stem segments
        this.leaves = []; // Leaf objects
        
        // Growth parameters
        this.maxLength = 80 + Math.random() * 120; // Longer for realistic draping
        this.growthSpeed = 0.2; // Slower, more natural growth
        this.growth = 0;
        this.currentDirection = { x: 0, y: 1 }; // Start growing down
        
        // Physics
        this.gravity = 0.8; // Pull downward
        this.curviness = 0.15; // How much it curves naturally
        this.reachedBottom = false;
        this.horizontalGrowth = false;
        
        // Animation
        this.swayPhase = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.008; // Much slower than before
        this.leafSwayOffsets = []; // Each leaf sways differently
        
        // Colors - blue theme
        this.stemColor = this.randomBlueShade();
        this.leafColor = this.randomLeafBlue();
        
        // Growth state
        this.hasGrownUpward = false;
        this.upwardGrowthCount = 0;
        this.maxUpwardGrowth = 3 + Math.floor(Math.random() * 5); // Small upward section
    }

    randomBlueShade() {
        const blues = ['#0066ff', '#0052cc', '#1a75ff'];
        return blues[Math.floor(Math.random() * blues.length)];
    }

    randomLeafBlue() {
        const leafBlues = ['#3385ff', '#4d94ff', '#1a75ff', '#0073e6'];
        return leafBlues[Math.floor(Math.random() * leafBlues.length)];
    }

    update() {
        // Grow the vine
        if (this.segments.length < this.maxLength) {
            this.growth += this.growthSpeed;
            
            if (this.growth >= 1) {
                this.growth = 0;
                this.growVineSegment();
            }
        }
        
        // Age segments and update sway
        this.segments.forEach(s => s.age++);
        this.leaves.forEach(l => l.age++);
        this.swayPhase += this.swaySpeed;
    }

    growVineSegment() {
        const tip = this.segments[this.segments.length - 1];
        
        // Determine growth direction based on state
        let newX = tip.x;
        let newY = tip.y;
        
        if (!this.hasGrownUpward && this.upwardGrowthCount < this.maxUpwardGrowth) {
            // Initial upward growth (small section)
            newY -= this.pixelSize;
            newX += (Math.random() - 0.5) * this.pixelSize * 0.5; // Slight horizontal variation
            this.upwardGrowthCount++;
            
            if (this.upwardGrowthCount >= this.maxUpwardGrowth) {
                this.hasGrownUpward = true;
            }
        } else if (!this.reachedBottom) {
            // Main downward growth with curves
            
            // Add curviness - vines curve naturally
            const curveOffset = (Math.random() - 0.5) * this.pixelSize * this.curviness;
            
            // Gravity pulls down
            this.currentDirection.y += this.gravity * 0.1;
            this.currentDirection.y = Math.min(this.currentDirection.y, 1);
            
            // Add some horizontal drift for natural curves
            this.currentDirection.x += (Math.random() - 0.5) * 0.3;
            this.currentDirection.x *= 0.9; // Dampen horizontal movement
            
            // Normalize direction
            const magnitude = Math.sqrt(
                this.currentDirection.x ** 2 + this.currentDirection.y ** 2
            );
            this.currentDirection.x /= magnitude;
            this.currentDirection.y /= magnitude;
            
            // Calculate new position
            newX = tip.x + this.currentDirection.x * this.pixelSize + curveOffset;
            newY = tip.y + this.currentDirection.y * this.pixelSize;
            
            // Check if reached bottom of screen
            if (newY >= window.innerHeight - this.pixelSize * 2) {
                this.reachedBottom = true;
                this.horizontalGrowth = true;
                newY = window.innerHeight - this.pixelSize * 2;
            }
        } else if (this.horizontalGrowth) {
            // Crawl horizontally along bottom
            const direction = Math.random() > 0.5 ? 1 : -1;
            newX = tip.x + direction * this.pixelSize;
            newY = tip.y + (Math.random() - 0.5) * this.pixelSize * 0.2; // Slight vertical variation
            
            // Keep at bottom
            newY = Math.min(newY, window.innerHeight - this.pixelSize);
        }
        
        // Add new segment
        const newSegment = { x: newX, y: newY, age: 0 };
        this.segments.push(newSegment);
        
        // Add leaf periodically (every 8-12 segments for realistic spacing)
        if (this.segments.length % (8 + Math.floor(Math.random() * 5)) === 0) {
            this.addLeaf(newX, newY, this.segments.length);
        }
    }

    addLeaf(x, y, segmentIndex) {
        // Alternate leaf sides
        const side = this.leaves.length % 2 === 0 ? 1 : -1;
        
        // Leaf offset from stem
        const offsetX = side * this.pixelSize * (2 + Math.random() * 2);
        const offsetY = -this.pixelSize * (1 + Math.random());
        
        // Leaf size (heart-shaped, represented by multiple pixels)
        const size = this.pixelSize * (1.5 + Math.random() * 0.5);
        
        const leaf = {
            x: x + offsetX,
            y: y + offsetY,
            size: size,
            side: side,
            age: 0,
            segmentIndex: segmentIndex,
            swayOffset: Math.random() * Math.PI * 2 // Each leaf has unique sway timing
        };
        
        this.leaves.push(leaf);
        this.leafSwayOffsets.push(Math.random() * Math.PI * 2);
    }

    draw(ctx) {
        // Draw stem (main vine)
        this.drawStem(ctx);
        
        // Draw leaves
        this.drawLeaves(ctx);
    }

    drawStem(ctx) {
        ctx.strokeStyle = this.stemColor;
        ctx.lineWidth = this.pixelSize * 0.6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (this.segments.length < 2) return;
        
        // Draw smooth curved line through segments
        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        
        for (let i = 1; i < this.segments.length; i++) {
            const segment = this.segments[i];
            const alpha = Math.min(1, segment.age / 20);
            
            // Sway animation - more sway at the tip
            const swayInfluence = i / this.segments.length; // 0 at base, 1 at tip
            const swayAmount = Math.sin(this.swayPhase + i * 0.05) * swayInfluence * 2;
            
            const x = segment.x + swayAmount;
            const y = segment.y;
            
            ctx.globalAlpha = alpha;
            ctx.lineTo(x, y);
        }
        
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    drawLeaves(ctx) {
        this.leaves.forEach((leaf, index) => {
            const alpha = Math.min(1, leaf.age / 25);
            
            // Calculate sway for this leaf based on its position on vine
            const swayInfluence = leaf.segmentIndex / this.segments.length;
            const leafSway = Math.sin(this.swayPhase + leaf.swayOffset) * swayInfluence * 3;
            const leafBounce = Math.cos(this.swayPhase * 0.5 + leaf.swayOffset) * swayInfluence * 1.5;
            
            const leafX = leaf.x + leafSway;
            const leafY = leaf.y + leafBounce;
            
            ctx.globalAlpha = alpha;
            
            // Draw heart-shaped pixel leaf
            this.drawPixelLeaf(ctx, leafX, leafY, leaf.size, leaf.side);
        });
        
        ctx.globalAlpha = 1;
    }

    drawPixelLeaf(ctx, x, y, size, side) {
        ctx.fillStyle = this.leafColor;
        
        // Heart/teardrop shape made of pixels
        const pixelStep = this.pixelSize;
        
        // Simple heart shape using pixel blocks
        // Center
        ctx.fillRect(x, y, pixelStep, pixelStep);
        
        // Top bulges (heart shape)
        ctx.fillRect(x - pixelStep * side, y - pixelStep, pixelStep, pixelStep);
        ctx.fillRect(x + pixelStep * side, y - pixelStep, pixelStep, pixelStep);
        
        // Middle
        ctx.fillRect(x - pixelStep * side, y, pixelStep, pixelStep);
        ctx.fillRect(x + pixelStep * side, y, pixelStep, pixelStep);
        
        // Bottom (pointed)
        ctx.fillRect(x, y + pixelStep, pixelStep, pixelStep);
        ctx.fillRect(x - pixelStep * side * 0.5, y + pixelStep * 1.5, pixelStep, pixelStep);
        
        // Add pixel stem connecting to main vine
        ctx.fillStyle = this.stemColor;
        ctx.fillRect(x - pixelStep * side * 0.5, y - pixelStep * 0.5, pixelStep * 0.5, pixelStep);
    }

    // Helper method to check if vine needs removal (optional)
    isOffScreen() {
        const lastSegment = this.segments[this.segments.length - 1];
        return lastSegment.x < -100 || lastSegment.x > window.innerWidth + 100;
    }
}