import { useRef, useState } from "react";
import type { Scene, Shape, Point } from "./types";

type Props = {
  scene: Scene;
  onAddShape: (shape: Shape) => void;
};

const SNAP_DISTANCE = 30; // in viewBox units

function Illustration({ scene, onAddShape }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [points, setPoints] = useState<Point[] | null>(null);

  function toSvgPoint(e: React.PointerEvent): Point {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 600;
    return { x, y };
  }

  function shouldClose(points: Point[]): boolean {
    if (points.length < 5) return false;

    const a = points[0];
    const b = points[points.length - 1];
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < SNAP_DISTANCE;
  }

  function pointsToD(points: Point[], closed: boolean): string {
    if (points.length === 0) return "";
    const [first, ...rest] = points;
    let d = `M ${first.x} ${first.y}`;
    for (const p of rest) {
        d += ` L ${p.x} ${p.y}`;
    }
    if (closed) d += " Z";
    return d;
  }

  function handleDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setPoints([toSvgPoint(e)]);
  }

  function handleMove(e: React.PointerEvent) {
    if (!points) return;
    setPoints((prev) => (prev ? [...prev, toSvgPoint(e)] : prev));
  }

  function handleUp() {
    if (points && points.length > 1) {
      const closed = shouldClose(points);
      onAddShape({
        id: crypto.randomUUID(),
        type: "path",
        points,
        closed,
        stroke: "#4f46e5",
        fill: closed ? "#4f46e580" : "none",
      });
    }
    setPoints(null);
  }

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
        switch (s.type) {
          case "rect":
            return <rect key={s.id} x={s.x} y={s.y} width={s.width} height={s.height} fill={s.fill} />;
          case "circle":
            return <circle key={s.id} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} />;
          case "path":
            return (
              <path
                key={s.id}
                d={pointsToD(s.points, s.closed)}
                stroke={s.stroke}
                strokeWidth={2}
                fill={s.fill}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            );
        }
      })}

      {points && (
        <path
          d={pointsToD(points, false)}
          stroke="#4f46e5"
          strokeWidth={2}
          fill={"none"}
          strokeDasharray={"4 4"}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default Illustration;