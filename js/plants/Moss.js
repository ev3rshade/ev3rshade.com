export default class Moss {
    constructor(x,y,ps,el) {
        this.x=x; this.y=y; this.pixelSize=ps;
        this.element=el; this.elementRect=el.getBoundingClientRect();
        this.pixels=[{x,y,age:0,density:1}]; this.flowers=[];
        this.maxSize=100+Math.random()*200;
        this.growthSpeed=0.3; this.growth=0; this.currentSize=1;
        this.spreadRadius=ps*4; this.edgePatchiness=0.4; this.centerDensity=0.9;
        this.animPhase=Math.random()*Math.PI*2; this.animSpeed=0.004;
        this.flowerPhase=Math.random()*Math.PI*2; this.flowerSpeed=0.002;
        this.mossColor=['#0066ff','#0059e6','#0052cc','#1a75ff'][Math.floor(Math.random()*4)];
        this.darkMossColor=['#0047b3','#003d99','#004080'][Math.floor(Math.random()*3)];
        this.flowerColor=['#80aaff','#99bbff','#b3ccff','#cce0ff'][Math.floor(Math.random()*4)];
    }
    update() {
        if(this.currentSize<this.maxSize) {
            this.growth+=this.growthSpeed;
            if(this.growth>=1) { this.growth=0; this.spreadMoss(); }
        }
        this.pixels.forEach(p=>{ p.age++; if(p.age>50&&p.density<1) p.density=Math.min(1,p.density+0.01); });
        this.flowers.forEach(f=>f.age++);
        if(this.pixels.length>30&&Math.random()<0.02) this.addFlower();
        this.flowers=this.flowers.filter(f=>f.age<300);
        this.animPhase+=this.animSpeed; this.flowerPhase+=this.flowerSpeed;
    }
    spreadMoss() {
        const s=this.pixels[Math.floor(Math.random()*this.pixels.length)];
        const isEdge=this.isNearEdge(s.x,s.y);
        const attempts=isEdge?2:4;
        for(let i=0;i<attempts;i++) {
            const a=Math.random()*Math.PI*2;
            const d=this.pixelSize+Math.random()*this.spreadRadius;
            const nx=s.x+Math.cos(a)*d, ny=s.y+Math.sin(a)*d;
            if(this.isWithinElement(nx,ny)) {
                const shouldGrow=isEdge?Math.random()>this.edgePatchiness:Math.random()>0.1;
                if(shouldGrow) {
                    const exists=this.pixels.some(p=>Math.abs(p.x-nx)<this.pixelSize&&Math.abs(p.y-ny)<this.pixelSize);
                    if(!exists) {
                        const dist=Math.sqrt((nx-this.x)**2+(ny-this.y)**2);
                        const maxD=Math.max(this.elementRect.width,this.elementRect.height);
                        const df=1-(dist/maxD);
                        const dens=0.3+df*0.7;
                        this.pixels.push({x:nx,y:ny,age:0,density:dens,flickerOffset:Math.random()*Math.PI*2});
                        this.currentSize++;
                    }
                }
            }
        }
    }
    isWithinElement(x,y) {
        return x>=this.elementRect.left&&x<=this.elementRect.right&&y>=this.elementRect.top&&y<=this.elementRect.bottom;
    }
    isNearEdge(x,y) {
        const m=this.pixelSize*3;
        return x<this.elementRect.left+m||x>this.elementRect.right-m||y<this.elementRect.top+m||y>this.elementRect.bottom-m;
    }
    addFlower() {
        const mature=this.pixels.filter(p=>p.age>50&&p.density>0.7);
        if(mature.length===0)return;
        const host=mature[Math.floor(Math.random()*mature.length)];
        const fs=2+Math.floor(Math.random()*3);
        const f={x:host.x,y:host.y,age:0,size:fs,pixels:[],appearPhase:Math.random()*Math.PI*2};
        for(let i=0;i<fs;i++) {
            const a=(i/fs)*Math.PI*2, d=this.pixelSize*(0.5+Math.random()*0.5);
            f.pixels.push({x:host.x+Math.cos(a)*d,y:host.y+Math.sin(a)*d});
        }
        this.flowers.push(f);
    }
    draw(ctx) {
        this.pixels.forEach(p=>{
            const a=Math.min(1,p.age/30);
            const isOuter=p.density<0.6;
            let fa=a*p.density;
            if(isOuter) {
                const fl=Math.sin(this.animPhase+p.flickerOffset)*0.3+0.7;
                fa*=fl;
                const sx=Math.sin(this.animPhase+p.flickerOffset)*0.5;
                const sy=Math.cos(this.animPhase*0.7+p.flickerOffset)*0.5;
                ctx.fillStyle=p.density>0.4?this.mossColor:this.darkMossColor;
                ctx.globalAlpha=fa;
                ctx.fillRect(p.x+sx,p.y+sy,this.pixelSize,this.pixelSize);
            } else {
                ctx.fillStyle=this.mossColor;
                ctx.globalAlpha=fa;
                ctx.fillRect(p.x,p.y,this.pixelSize,this.pixelSize);
                if(Math.random()<0.2) {
                    ctx.fillStyle=this.darkMossColor;
                    ctx.globalAlpha=fa*0.5;
                    ctx.fillRect(p.x,p.y,this.pixelSize*0.5,this.pixelSize*0.5);
                }
            }
        });
        this.flowers.forEach(f=>{
            const lp=f.age/300;
            let fa;
            if(lp<0.2) fa=lp/0.2;
            else if(lp>0.8) fa=(1-lp)/0.2;
            else fa=Math.sin(this.flowerPhase+f.appearPhase)*0.2+0.8;
            ctx.fillStyle=this.flowerColor;
            f.pixels.forEach((fp,i)=>{
                ctx.globalAlpha=fa;
                ctx.fillRect(fp.x,fp.y,this.pixelSize,this.pixelSize);
                if(i===0) {
                    ctx.fillStyle='#ffffff';
                    ctx.globalAlpha=fa*0.6;
                    ctx.fillRect(fp.x+this.pixelSize*0.25,fp.y+this.pixelSize*0.25,this.pixelSize*0.5,this.pixelSize*0.5);
                    ctx.fillStyle=this.flowerColor;
                }
            });
        });
        ctx.globalAlpha=1;
    }
}