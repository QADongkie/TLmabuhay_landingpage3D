import * as THREE from "three";

/**
 * Creates a modern curved highway LED streetlight (optimized for 60fps performance).
 */
export function createStreetLight(side: "left" | "right" = "right"): THREE.Group {
  const poleGroup = new THREE.Group();

  // Galvanized dark metallic pole
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x37474f,
    metalness: 0.88,
    roughness: 0.28,
  });

  // Vertical mast
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.09, 5.8, 12),
    metalMaterial,
  );
  mast.position.y = 2.9;
  mast.castShadow = true;
  poleGroup.add(mast);

  // Concrete base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.35, 12),
    new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.9 }),
  );
  base.position.y = 0.175;
  poleGroup.add(base);

  // Curved arm reaching over the lane
  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 5.7, 0),
    new THREE.Vector3(side === "right" ? -0.4 : 0.4, 6.3, 0),
    new THREE.Vector3(side === "right" ? -1.6 : 1.6, 6.4, 0),
    new THREE.Vector3(side === "right" ? -2.2 : 2.2, 6.1, 0),
  ]);

  const armGeo = new THREE.TubeGeometry(armCurve, 12, 0.045, 6, false);
  const arm = new THREE.Mesh(armGeo, metalMaterial);
  arm.castShadow = true;
  poleGroup.add(arm);

  // Luminaire / LED Light Head Fixture
  const headGeo = new THREE.BoxGeometry(0.48, 0.1, 0.24);
  const head = new THREE.Mesh(headGeo, metalMaterial);
  const headX = side === "right" ? -2.25 : 2.25;
  head.position.set(headX, 6.06, 0);
  head.rotation.z = side === "right" ? 0.15 : -0.15;
  poleGroup.add(head);

  // Glowing LED emitter lens (Emissive Bloom)
  const lensGeo = new THREE.PlaneGeometry(0.42, 0.2);
  const lensMat = new THREE.MeshBasicMaterial({
    color: 0xfffae0,
  });
  const lens = new THREE.Mesh(lensGeo, lensMat);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(headX, 6.01, 0);
  poleGroup.add(lens);

  return poleGroup;
}

/**
 * Builds the highway streetlight corridor (Stage 3 & 4).
 */
export function buildHighwayStreetLights(): THREE.Group {
  const corridor = new THREE.Group();

  const lightZPositions = [-8, -26, -42, -56, -72, -88];

  lightZPositions.forEach((z, idx) => {
    const side = idx % 2 === 0 ? "right" : "left";
    const x = side === "right" ? 5.2 : -5.2;
    const light = createStreetLight(side);
    light.position.set(x, 0, z);
    corridor.add(light);
  });

  return corridor;
}
