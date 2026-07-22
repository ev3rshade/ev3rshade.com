import type { Point } from "./types";

// --- Exact endpoint join ---
// Overwrites the last point with the first so the loop closes with zero gap.
// Use only when the path is meant to be closed.
export function joinEndpoints(points: Point[]): Point[] {
  if (points.length < 2) return points;
  const out = points.slice();
  out[out.length - 1] = { ...out[0] };
  return out;
}

// --- Ramer-Douglas-Peucker simplification ---
// Recursively drops points that lie within `epsilon` of the line between
// the segment's endpoints. Higher epsilon = fewer points = coarser shape.
export function simplify(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points.slice();

  const first = points[0];
  const last = points[points.length - 1];

  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplify(points.slice(0, index + 1), epsilon);
    const right = simplify(points.slice(index), epsilon);
    // drop the duplicated join point between the two halves
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

function perpendicularDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ex = p.x - a.x;
    const ey = p.y - a.y;
    return Math.sqrt(ex * ex + ey * ey);
  }
  // project p onto line ab, clamp not needed for RDP perpendicular measure
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  const ex = p.x - projX;
  const ey = p.y - projY;
  return Math.sqrt(ex * ex + ey * ey);
}

// --- Centroid (area-weighted, correct for polygons) ---
// Not the average of points -- that biases toward dense clusters.
// This uses the polygon area formula so the center is physically correct.
export function centroid(points: Point[]): Point {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const cross = p1.x * p2.y - p2.x * p1.y;
    area += cross;
    cx += (p1.x + p2.x) * cross;
    cy += (p1.y + p2.y) * cross;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-9) {
    // degenerate (collinear) -- fall back to point average
    const avg = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: avg.x / points.length, y: avg.y / points.length };
  }
  return { x: cx / (6 * area), y: cy / (6 * area) };
}

// --- Signed area sign, used to normalize winding order ---
// matter-js / poly-decomp expect a consistent winding (counter-clockwise).
export function signedArea(points: Point[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return area / 2;
}

export function ensureCounterClockwise(points: Point[]): Point[] {
  return signedArea(points) < 0 ? points.slice().reverse() : points;
}