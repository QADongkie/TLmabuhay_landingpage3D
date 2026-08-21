import * as THREE from "three";

/**
 * Creates a vertical 3-aspect LED traffic light signal post (Red / Amber / Green).
 */
export function createTrafficSignal(
  initialState: "red" | "yellow" | "green" = "red",
): {
  group: THREE.Group;
  setSignal: (state: "red" | "yellow" | "green") => void;
} {
  const signalGroup = new THREE.Group();

  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0x263238,
    metalness: 0.85,
    roughness: 0.35,
  });

  // Vertical pole
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 5.2, 16),
    poleMaterial,
  );
  pole.position.y = 2.6;
  pole.castShadow = true;
  signalGroup.add(pole);

  // Horizontal cantilever arm extending over lane
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.1, 0.1),
    poleMaterial,
  );
  arm.position.set(-1.8, 4.8, 0);
  signalGroup.add(arm);

  // Housing Box
  const housingMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.8,
  });
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 1.25, 0.3),
    housingMat,
  );
  housing.position.set(-2.8, 4.2, 0);
  signalGroup.add(housing);

  // Backing Board (Yellow border typical in PH / international road signals)
  const backBoardMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.7,
  });
  const backBoard = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 1.5, 0.04),
    backBoardMat,
  );
  backBoard.position.set(-2.8, 4.2, 0.05);
  signalGroup.add(backBoard);

  // Lenses Materials
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xff1744,
    emissive: 0xff002b,
    emissiveIntensity: initialState === "red" ? 4.5 : 0.1,
    roughness: 0.2,
  });

  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xffea00,
    emissive: 0xffaa00,
    emissiveIntensity: initialState === "yellow" ? 4.0 : 0.1,
    roughness: 0.2,
  });

  const greenMat = new THREE.MeshStandardMaterial({
    color: 0x00e676,
    emissive: 0x00c853,
    emissiveIntensity: initialState === "green" ? 4.5 : 0.1,
    roughness: 0.2,
  });

  const lensGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 24);
  lensGeo.rotateX(Math.PI / 2);

  // Red Lens (Top)
  const redLens = new THREE.Mesh(lensGeo, redMat);
  redLens.position.set(-2.8, 4.55, 0.16);
  signalGroup.add(redLens);

  // Amber Lens (Middle)
  const yellowLens = new THREE.Mesh(lensGeo, yellowMat);
  yellowLens.position.set(-2.8, 4.2, 0.16);
  signalGroup.add(yellowLens);

  // Green Lens (Bottom)
  const greenLens = new THREE.Mesh(lensGeo, greenMat);
  greenLens.position.set(-2.8, 3.85, 0.16);
  signalGroup.add(greenLens);

  // Visors over lenses
  [-2.8].forEach((x) => {
    [4.55, 4.2, 3.85].forEach((y) => {
      const visor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.15, 16, 1, true, 0, Math.PI),
        housingMat,
      );
      visor.rotation.x = Math.PI / 2;
      visor.rotation.z = Math.PI;
      visor.position.set(x, y + 0.05, 0.22);
      signalGroup.add(visor);
    });
  });

  // Red Light Glow Point
  const redGlow = new THREE.PointLight(0xff1744, initialState === "red" ? 8 : 0, 8);
  redGlow.position.set(-2.8, 4.55, 0.5);
  signalGroup.add(redGlow);

  const setSignal = (state: "red" | "yellow" | "green") => {
    redMat.emissiveIntensity = state === "red" ? 4.5 : 0.1;
    yellowMat.emissiveIntensity = state === "yellow" ? 4.0 : 0.1;
    greenMat.emissiveIntensity = state === "green" ? 4.5 : 0.1;
    redGlow.intensity = state === "red" ? 8 : 0;
  };

  return { group: signalGroup, setSignal };
}
