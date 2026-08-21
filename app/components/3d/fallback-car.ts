import * as THREE from "three";
import type { FallbackCarResult } from "./types";

export function createFallbackCar(): FallbackCarResult {
  const car = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({
    color: 0x0c3158,
    metalness: 0.72,
    roughness: 0.24,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x030911,
    metalness: 0.2,
    roughness: 0.72,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x86aac2,
    transmission: 0.35,
    roughness: 0.16,
    transparent: true,
    opacity: 0.8,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xf5b800,
    emissive: 0x5a3900,
    emissiveIntensity: 0.35,
    metalness: 0.48,
    roughness: 0.32,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.4, 4.25), paint);
  body.position.y = 0.52;
  body.castShadow = true;
  car.add(body);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.16, 1.25), paint);
  hood.position.set(0, 0.78, -1.28);
  hood.castShadow = true;
  car.add(hood);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.62, 1.85), glass);
  cabin.position.set(0, 1.04, 0.25);
  cabin.castShadow = true;
  car.add(cabin);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.06, 3.9), gold);
  stripe.position.set(0, 0.65, 0);
  car.add(stripe);

  const wheelGeometry = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 24);
  const wheels: THREE.Object3D[] = [];
  [
    [-1.02, 0.42, -1.28],
    [1.02, 0.42, -1.28],
    [-1.02, 0.42, 1.28],
    [1.02, 0.42, 1.28],
  ].forEach(([x, y, z]) => {
    const hub = new THREE.Group();
    hub.position.set(x, y, z);
    const wheel = new THREE.Mesh(wheelGeometry, dark);
    wheel.rotation.z = Math.PI / 2;
    wheel.castShadow = true;
    hub.add(wheel);
    car.add(hub);
    wheels.push(hub);
  });

  const lightMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff7c2,
    emissive: 0xffd44c,
    emissiveIntensity: 0.2,
  });
  [-0.58, 0.58].forEach((x) => {
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.12, 0.08),
      lightMaterial,
    );
    light.position.set(x, 0.7, -2.16);
    car.add(light);
  });

  return {
    car,
    wheels,
    headlightMaterials: [lightMaterial],
    wheelRadius: 0.38,
  };
}
