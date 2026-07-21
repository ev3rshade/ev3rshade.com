import { useState } from "react";
import type { Scene, Shape } from "./types";
import Illustration from "./Illustration";

function App() {
  const [scene, setScene] = useState<Scene>({ shapes: [] });

  function addShape(shape: Shape) {
    setScene((prev) => ({ shapes: [...prev.shapes, shape] }));
  }

  return (
    <div>
      <h1>Illustration Board</h1>
      <Illustration scene={scene} onAddShape={addShape} />
    </div>
  );
}

export default App;