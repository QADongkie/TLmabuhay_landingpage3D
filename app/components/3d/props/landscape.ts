import * as THREE from "three";

/**
 * Creates a low-poly tropical tree (Acacia / Palm aesthetic).
 */
export function createTropicalTree(scale = 1): THREE.Group {
  const tree = new THREE.Group();

  // Bark
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    roughness: 0.9,
  });

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 * scale, 0.22 * scale, 3.8 * scale, 7),
    trunkMat,
  );
  trunk.position.y = (3.8 * scale) / 2;
  trunk.castShadow = true;
  tree.add(trunk);

  // Canopy tiers
  const leavesMat = new THREE.MeshStandardMaterial({
    color: 0x1b4332,
    roughness: 0.78,
    metalness: 0.05,
    emissive: 0x081c15,
    emissiveIntensity: 0.3,
  });

  const tiers = [
    { y: 3.2 * scale, r: 1.8 * scale, h: 1.4 * scale },
    { y: 4.1 * scale, r: 1.4 * scale, h: 1.2 * scale },
    { y: 4.8 * scale, r: 0.9 * scale, h: 1.0 * scale },
  ];

  tiers.forEach((t) => {
    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry(t.r, t.h, 7),
      leavesMat,
    );
    foliage.position.y = t.y;
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    tree.add(foliage);
  });

  return tree;
}

/**
 * Builds the roadside greenery corridor.
 */
export function buildRoadsideGreenery(): THREE.Group {
  const greenery = new THREE.Group();

  const treePositions: [number, number, number][] = [
    [-6.5, -6, 1.1],
    [6.8, -12, 0.95],
    [-7.2, -22, 1.2],
    [7.5, -34, 1.05],
    [-6.8, -48, 1.15],
    [7.2, -62, 1.25],
    [-7.0, -78, 1.0],
    [7.4, -92, 1.3],
  ];

  treePositions.forEach(([x, z, scale]) => {
    const tree = createTropicalTree(scale);
    tree.position.set(x, 0, z);
    greenery.add(tree);
  });

  return greenery;
}
