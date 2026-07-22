import { useState, useRef } from "react";
import type { Scene, Shape } from "./types";
import Illustration from "./Illustration";
import type { IllustrationHandle } from "./Illustration";
import { usePhysics } from "./usePhysics";

function App() {
  const [scene, setScene] = useState<Scene>({ shapes: [] });
  const illoRef = useRef<IllustrationHandle>(null);
  const { addBody, start, stop } = usePhysics();
  const [running, setRunning] = useState(false);

  function addShape(shape: Shape) {
    setScene((prev) => ({ shapes: [...prev.shapes, shape] }));
  }

  function handleRun() {
    if (running) {
      stop();
      setRunning(false);
      return;
    }
    // Register every current shape as a body, then start the loop.
    for (const s of scene.shapes) addBody(s);

    start((handles) => {
      const illo = illoRef.current;
      if (!illo) return;
      for (const h of handles) {
        const el = illo.getElement(h.id);
        const center = illo.getCenter(h.id);
        if (!el || !center) continue;

        // How far the body's center moved from where the shape was drawn.
        const dx = h.body.position.x - center.x;
        const dy = h.body.position.y - center.y;
        const angleDeg = (h.body.angle * 180) / Math.PI;

        // Translate by the delta, then rotate around the (now-current) center.
        el.setAttribute(
          "transform",
          `translate(${dx} ${dy}) rotate(${angleDeg} ${center.x} ${center.y})`
        );
      }
    });
    setRunning(true);
  }

  return (
    <div>
      <h1>Illustration Board</h1>
      <button onClick={handleRun}>{running ? "Stop" : "Drop"}</button>
      <Illustration ref={illoRef} scene={scene} onAddShape={addShape} />
    </div>
  );
}

export default App;