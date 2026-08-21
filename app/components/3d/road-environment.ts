import * as THREE from "three";

export function addRoad(scene: THREE.Scene) {
  const road = new THREE.Group();
  const asphalt = new THREE.MeshStandardMaterial({
    color: 0x07111d,
    roughness: 0.96,
    metalness: 0.04,
  });
  const shoulder = new THREE.MeshStandardMaterial({
    color: 0x0b2743,
    roughness: 0.82,
  });
  const line = new THREE.MeshStandardMaterial({
    color: 0xf5b800,
    emissive: 0x3b2700,
    emissiveIntensity: 0.65,
    roughness: 0.48,
  });

  const surface = new THREE.Mesh(new THREE.PlaneGeometry(9, 94), asphalt);
  surface.rotation.x = -Math.PI / 2;
  surface.position.set(0, 0, -36);
  surface.receiveShadow = true;
  road.add(surface);

  [-4.72, 4.72].forEach((x) => {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 94), shoulder);
    edge.position.set(x, 0.02, -36);
    edge.receiveShadow = true;
    road.add(edge);

    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 94), line);
    rail.position.set(x * 0.92, 0.08, -36);
    road.add(rail);
  });

  for (let z = 8; z > -83; z -= 5.1) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.035, 2.15), line);
    dash.position.set(0, 0.045, z);
    road.add(dash);

    [-4.15, 4.15].forEach((x) => {
      const reflector = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.11, 0.34),
        line,
      );
      reflector.position.set(x, 0.1, z);
      road.add(reflector);
    });
  }

  [-16, -37, -58].forEach((z) => {
    const gate = new THREE.Group();
    const gateMaterial = new THREE.MeshStandardMaterial({
      color: 0x17456e,
      emissive: 0x071d35,
      emissiveIntensity: 0.7,
      metalness: 0.42,
      roughness: 0.42,
    });
    [-4.25, 4.25].forEach((x) => {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 1.3, 0.13),
        gateMaterial,
      );
      post.position.set(x, 0.65, 0);
      gate.add(post);
    });
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(8.65, 0.13, 0.13),
      gateMaterial,
    );
    bar.position.y = 1.26;
    gate.add(bar);
    gate.position.z = z;
    road.add(gate);
  });

  scene.add(road);
}
