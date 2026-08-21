import * as THREE from "three";
import { journeyAudio } from "./props/car-fx";

export interface BuiltInCarLightsController {
  setHeadlights: (intensity: number) => void;
  setBrakes: (active: boolean) => void;
  setBlinkers: (active: boolean, side?: "left" | "right") => void;
  updateBlinkers: (time: number) => void;
}

/**
 * Automatically binds to the Fairheaven low-poly car's built-in light meshes
 * (Headlights, Brakelights, Turn Signals) or the fallback model.
 */
export function setupBuiltInCarLights(model: THREE.Object3D): BuiltInCarLightsController {
  // 1. Headlight Material (Golden-White LED)
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfff0d0,
    emissive: new THREE.Color(0xffdd72),
    emissiveIntensity: 0.2,
    metalness: 0.3,
    roughness: 0.15,
  });

  // 2. Brake Light Material (Vibrant Red LED)
  const brakeMat = new THREE.MeshStandardMaterial({
    color: 0xd50000,
    emissive: new THREE.Color(0xff1744),
    emissiveIntensity: 0.25,
    metalness: 0.3,
    roughness: 0.15,
  });

  // 3. Left Blinker Material (Amber LED)
  const leftBlinkerMat = new THREE.MeshStandardMaterial({
    color: 0xff9100,
    emissive: new THREE.Color(0xff9100),
    emissiveIntensity: 0.1,
    metalness: 0.3,
    roughness: 0.15,
  });

  // 4. Right Blinker Material (Amber LED)
  const rightBlinkerMat = new THREE.MeshStandardMaterial({
    color: 0xff9100,
    emissive: new THREE.Color(0xff9100),
    emissiveIntensity: 0.1,
    metalness: 0.3,
    roughness: 0.15,
  });

  // Check for Fairheaven model nodes
  const hlMesh = (model.getObjectByName("Fairheaven_LT80_Headlights_UCB_Lights_and_Glass_0") ||
    model.getObjectByName("Fairheaven_LT80_Headlights")) as THREE.Mesh | null;
  const blMesh = (model.getObjectByName("Fairheaven_LT80_Brakelights_UCB_Lights_and_Glass_0") ||
    model.getObjectByName("Fairheaven_LT80_Brakelights")) as THREE.Mesh | null;

  if (hlMesh) {
    hlMesh.material = headlightMat;
  }
  if (blMesh) {
    blMesh.material = brakeMat;
  }

  // Also handle Nissan model fallback if present
  const nissanMesh = model.getObjectByName("Mesh6_NISSANsentraluz_0") as THREE.Mesh | null;
  if (nissanMesh && nissanMesh.geometry) {
    const geo = nissanMesh.geometry.clone();
    const parent = nissanMesh.parent || model;

    const frontMesh = new THREE.Mesh(geo.clone(), headlightMat);
    const rearMesh = new THREE.Mesh(geo.clone(), brakeMat);
    const rightBlinkerMesh = new THREE.Mesh(geo.clone(), rightBlinkerMat);
    const leftBlinkerMesh = new THREE.Mesh(geo.clone(), leftBlinkerMat);

    const filterMesh = (m: THREE.Mesh, pred: (x: number, y: number, z: number) => boolean) => {
      const p = m.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        if (!pred(p.getX(i), p.getY(i), p.getZ(i))) p.setXYZ(i, 0, -100, 0);
      }
      p.needsUpdate = true;
    };

    filterMesh(frontMesh, (x, y, z) => z < -2.3 && x >= 0.65 && x <= 1.45);
    filterMesh(rearMesh, (x, y, z) => z >= -2.3 && x >= 0.65 && x <= 1.45);
    filterMesh(rightBlinkerMesh, (x, y, z) => x > 1.45);
    filterMesh(leftBlinkerMesh, (x, y, z) => x < 0.65);

    parent.remove(nissanMesh);
    parent.add(frontMesh);
    parent.add(rearMesh);
    parent.add(rightBlinkerMesh);
    parent.add(leftBlinkerMesh);
  }

  let blinkersActive = false;
  let activeSide: "left" | "right" = "right";
  let currentBrakes = false;

  const setHeadlights = (intensity: number) => {
    headlightMat.emissiveIntensity = intensity;
  };

  const setBrakes = (active: boolean) => {
    if (active === currentBrakes) return;
    currentBrakes = active;
    brakeMat.emissiveIntensity = active ? 4.8 : 0.25;
  };

  const setBlinkers = (active: boolean, side: "left" | "right" = "right") => {
    if (active === blinkersActive && side === activeSide) return;
    blinkersActive = active;
    activeSide = side;

    if (active) {
      journeyAudio.startBlinkerSound();
    } else {
      journeyAudio.stopBlinkerSound();
      leftBlinkerMat.emissiveIntensity = 0.1;
      rightBlinkerMat.emissiveIntensity = 0.1;
    }
  };

  const updateBlinkers = (time: number) => {
    if (!blinkersActive) return;
    const isLit = Math.sin(time * 12) > 0;
    const intensity = isLit ? 4.5 : 0.1;
    if (activeSide === "right") {
      rightBlinkerMat.emissiveIntensity = intensity;
      leftBlinkerMat.emissiveIntensity = 0.1;
    } else {
      leftBlinkerMat.emissiveIntensity = intensity;
      rightBlinkerMat.emissiveIntensity = 0.1;
    }
  };

  return {
    setHeadlights,
    setBrakes,
    setBlinkers,
    updateBlinkers,
  };
}
