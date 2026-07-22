export type Point = { x: number; y: number };

export type Shape =
  | { id: string; type: "rect"; x: number; y: number; width: number; height: number; fill: string }
  | { id: string; type: "circle"; cx: number; cy: number; r: number; fill: string }
  | {
      id: string;
      type: "path";
      points: Point[];        // raw/smooth points, for rendering
      hull: Point[];          // simplified + joined + CCW, for physics
      center: Point;          // area-weighted centroid
      closed: boolean;
      stroke: string;
      fill: string;
    };
  
export type Scene = {
  shapes: Shape[];
};