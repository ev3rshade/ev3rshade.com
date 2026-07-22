import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import type { Scene, Shape, Point } from "./types";
import { joinEndpoints, simplify, ensureCounterClockwise, centroid } from "./geometry";

type Props = {
  scene: Scene;
  onAddShape: (shape: Shape) => void;
};

const SNAP_DISTANCE = 30;

// The transform origin (centroid) for a given shape, in viewBox coords.
// Bodies rotate around their center of mass, so SVG must rotate around the same point.
function shapeCenter(s: Shape): Point {
  switch (s.type) {
    case "rect":
      return { x: s.x + s.width / 2, y: s.y + s.height / 2 };
    case "circle":
      return { x: s.cx, y: s.cy };
    case "path":
      return s.center;
  }
}

export type IllustrationHandle = {
  getElement: (id: string) => SVGGElement | null;
  getCenter: (id: string) => Point | null;
};

const Illustration = forwardRef<IllustrationHandle, Props>(function Illustration(
  { scene, onAddShape },
  ref
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [points, setPoints] = useState<Point[] | null>(null);
  const elementRefs = useRef<Map<string, SVGGElement>>(new Map());

  useImperativeHandle(ref, () => ({
    getElement: (id) => elementRefs.current.get(id) ?? null,
    getCenter: (id) => {
      const s = scene.shapes.find((sh) => sh.id === id);
      return s ? shapeCenter(s) : null;
    },
  }));

  function toSvgPoint(e: React.PointerEvent): Point {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 600;
    return { x, y };
  }

  function handleDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setPoints([toSvgPoint(e)]);
  }

  function handleMove(e: React.PointerEvent) {
    if (!points) return;
    setPoints((prev) => (prev ? [...prev, toSvgPoint(e)] : prev));
  }

  function shouldClose(pts: Point[]): boolean {
    if (pts.length < 5) return false;
    const a = pts[0];
    const b = pts[pts.length - 1];
    return Math.hypot(a.x - b.x, a.y - b.y) < SNAP_DISTANCE;
  }

  function handleUp() {
    if (points && points.length > 1) {
      const closed = shouldClose(points);
      let hull: Point[] = [];
      let center: Point = points[0];
      if (closed) {
        const simplified = simplify(points, 4);
        const joined = joinEndpoints(simplified);
        const loop = joined.slice(0, -1);
        hull = ensureCounterClockwise(loop);
        center = centroid(hull);
      }
      onAddShape({
        id: crypto.randomUUID(),
        type: "path",
        points,
        hull,
        center,
        closed,
        stroke: "#4f46e5",
        fill: closed ? "#4f46e580" : "none",
      });
    }
    setPoints(null);
  }

  function pointsToD(pts: Point[], closed: boolean): string {
    if (pts.length === 0) return "";
    const [first, ...rest] = pts;
    let d = `M ${first.x} ${first.y}`;
    for (const p of rest) d += ` L ${p.x} ${p.y}`;
    if (closed) d += " Z";
    return d;
  }

  const previewClosed = points ? shouldClose(points) : false;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 800 600"
      style={{ width: "100%", border: "1px solid #ccc", touchAction: "none" }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
    >
      {scene.shapes.map((s) => {
        // Each shape wrapped in a <g> we can transform from the physics loop.
        const setEl = (el: SVGGElement | null) => {
          if (el) elementRefs.current.set(s.id, el);
          else elementRefs.current.delete(s.id);
        };
        switch (s.type) {
          case "rect":
            return (
              <g key={s.id} ref={setEl}>
                <rect x={s.x} y={s.y} width={s.width} height={s.height} fill={s.fill} />
              </g>
            );
          case "circle":
            return (
              <g key={s.id} ref={setEl}>
                <circle cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} />
              </g>
            );
          case "path":
            return (
              <g key={s.id} ref={setEl}>
                <path
                  d={pointsToD(s.points, s.closed)}
                  stroke={s.stroke}
                  strokeWidth={2}
                  fill={s.fill}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
            );
        }
      })}

      {points && (
        <path
          d={pointsToD(points, previewClosed)}
          stroke="#4f46e5"
          strokeWidth={2}
          fill={previewClosed ? "#4f46e580" : "none"}
          strokeDasharray={previewClosed ? "none" : "4 4"}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
});

export default Illustration;