import type * as THREE from "three";

export type CarStatus = "loading" | "ready" | "fallback";

export interface WheelRig {
  rollPivot: THREE.Object3D;
  steerPivot?: THREE.Object3D;
  radius: number;
}

export interface FallbackCarResult {
  car: THREE.Group;
  wheels: THREE.Object3D[];
  headlightMaterials: THREE.MeshStandardMaterial[];
  wheelRadius: number;
}
