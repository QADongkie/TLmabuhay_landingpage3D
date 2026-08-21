import * as THREE from "three";

/**
 * Creates a detailed 3D training traffic cone (LTO / driving academy spec):
 * - Heavy black recycled rubber base
 * - High-vis fluorescent orange cone body
 * - Dual retroreflective silver bands
 * - Top grip collar
 */
export function createTrafficCone(): THREE.Group {
  const coneGroup = new THREE.Group();

  // 1. Black heavy rubber base
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.92,
    metalness: 0.08,
  });
  const baseMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.045, 0.38),
    baseMaterial,
  );
  baseMesh.position.y = 0.0225;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  coneGroup.add(baseMesh);

  // 2. High-vis fluorescent orange cone body
  const orangeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff521a,
    roughness: 0.38,
    metalness: 0.12,
    emissive: 0x661800,
    emissiveIntensity: 0.35,
  });

  const coneMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.16, 0.72, 24, 1, true),
    orangeMaterial,
  );
  coneMesh.position.y = 0.4;
  coneMesh.castShadow = true;
  coneMesh.receiveShadow = true;
  coneGroup.add(coneMesh);

  // 3. Top rounded collar
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.042, 0.015, 12, 24),
    orangeMaterial,
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.76;
  coneGroup.add(collar);

  // 4. Retroreflective silver bands
  const reflectiveMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.22,
    metalness: 0.25,
    emissive: 0xffffff,
    emissiveIntensity: 0.45,
  });

  // Upper band
  const upperBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.082, 0.12, 24),
    reflectiveMaterial,
  );
  upperBand.position.y = 0.54;
  coneGroup.add(upperBand);

  // Lower band
  const lowerBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.098, 0.12, 0.1, 24),
    reflectiveMaterial,
  );
  lowerBand.position.y = 0.34;
  coneGroup.add(lowerBand);

  return coneGroup;
}

/**
 * Builds the Stage 2 Practical Driving Course (PDC) slalom cone track.
 */
export function buildSlalomConeTrack(): THREE.Group {
  const trackGroup = new THREE.Group();

  // Define slalom cone positions guiding car from center road into the right fork turn
  const coneCoordinates: [number, number][] = [
    // Center divider cones before fork
    [-0.4, -18.5],
    [0.4, -18.5],
    // Slalom gate 1
    [-1.2, -21.0],
    [1.8, -22.2],
    // Slalom gate 2 (curve to the right)
    [-0.2, -24.5],
    [2.8, -25.5],
    // Slalom gate 3 (right lane entry)
    [1.4, -28.0],
    [3.9, -29.2],
    // Gate 4
    [2.6, -32.0],
    [4.6, -33.5],
  ];

  coneCoordinates.forEach(([x, z], index) => {
    const cone = createTrafficCone();
    // Slight random rotation on rubber base for realism
    cone.rotation.y = (index * 1.37) % (Math.PI * 2);
    cone.position.set(x, 0, z);
    trackGroup.add(cone);
  });

  return trackGroup;
}
