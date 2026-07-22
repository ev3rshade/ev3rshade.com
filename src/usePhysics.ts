import { useRef, useEffect } from "react";
import Matter from "matter-js";
import decomp from "poly-decomp";
import type { Shape } from "./types";

Matter.Common.setDecomp(decomp);

const WIDTH = 800;
const HEIGHT = 600;
const WALL = 40; // thickness of the boundary walls

export type BodyHandle = {
  id: string;
  body: Matter.Body;
  shape: Shape;
};

export function usePhysics() {
  const engineRef = useRef<Matter.Engine | null>(null);
  const bodiesRef = useRef<Map<string, BodyHandle>>(new Map());
  const runningRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  // Create the engine + static boundaries once.
  useEffect(() => {
    const engine = Matter.Engine.create();
    engine.gravity.y = 1; // matter-js default-ish; tune later
    engineRef.current = engine;

    const opts = { isStatic: true };
    const floor = Matter.Bodies.rectangle(WIDTH / 2, HEIGHT + WALL / 2, WIDTH + WALL * 2, WALL, opts);
    const ceiling = Matter.Bodies.rectangle(WIDTH / 2, -WALL / 2, WIDTH + WALL * 2, WALL, opts);
    const left = Matter.Bodies.rectangle(-WALL / 2, HEIGHT / 2, WALL, HEIGHT + WALL * 2, opts);
    const right = Matter.Bodies.rectangle(WIDTH + WALL / 2, HEIGHT / 2, WALL, HEIGHT + WALL * 2, opts);
    Matter.Composite.add(engine.world, [floor, ceiling, left, right]);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      Matter.Engine.clear(engine);
      Matter.World.clear(engine.world, false);
      bodiesRef.current.clear();
      engineRef.current = null;
    };
  }, []);

  // Turn one Shape into a matter-js body positioned by its center of mass.
  function makeBody(shape: Shape): Matter.Body | null {
    const restitution = 0.5;
    const friction = 0.3;
    const common = { restitution, friction };

    switch (shape.type) {
      case "rect": {
        const cx = shape.x + shape.width / 2;
        const cy = shape.y + shape.height / 2;
        return Matter.Bodies.rectangle(cx, cy, shape.width, shape.height, common);
      }
      case "circle": {
        return Matter.Bodies.circle(shape.cx, shape.cy, shape.r, common);
      }
      case "path": {
        if (!shape.closed || shape.hull.length < 3) return null; // open strokes don't get bodies
        const body = Matter.Bodies.fromVertices(
          shape.center.x,
          shape.center.y,
          [shape.hull],
          common,
          true // flagInternal: clean internal edges from decomposition
        );
        return body; // may be null if decomposition fails on a nasty shape
      }
    }
  }

  // Add a shape to the simulation.
  function addBody(shape: Shape) {
    const engine = engineRef.current;
    if (!engine) return;
    const body = makeBody(shape);
    if (!body) return;
    bodiesRef.current.set(shape.id, { id: shape.id, body, shape });
    Matter.Composite.add(engine.world, body);
  }

  // Start / stop the simulation loop.
  function start(onFrame: (handles: BodyHandle[]) => void) {
    const engine = engineRef.current;
    if (!engine || runningRef.current) return;
    runningRef.current = true;
    let last = performance.now();

    const tick = (now: number) => {
      if (!runningRef.current) return;
      const dt = Math.min(now - last, 1000 / 30); // clamp big gaps (tab switch)
      last = now;
      Matter.Engine.update(engine, dt);
      onFrame(Array.from(bodiesRef.current.values()));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function stop() {
    runningRef.current = false;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  return { addBody, start, stop };
}