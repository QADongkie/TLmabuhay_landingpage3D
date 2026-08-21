import * as THREE from "three";
import type { WheelRig } from "./types";

export const WHEEL_CONFIGS = [
  // Fairheaven Low-Poly Car wheel nodes
  { id: "front_left", wheelNode: "Fairheaven_LT80_WheelHubcaps_FL", isFront: true, rollAxis: "z" as const },
  { id: "front_right", wheelNode: "Fairheaven_LT80_WheelHubcaps_FR", isFront: true, rollAxis: "z" as const },
  { id: "rear_left", wheelNode: "Fairheaven_LT80_WheelHubcaps_RL", isFront: false, rollAxis: "z" as const },
  { id: "rear_right", wheelNode: "Fairheaven_LT80_WheelHubcaps_RR", isFront: false, rollAxis: "z" as const },
  // Nissan Sentra fallback wheel nodes
  { id: "front_left_nissan", wheelNode: "Group25", isFront: true, rollAxis: "x" as const },
  { id: "front_right_nissan", wheelNode: "Group17", isFront: true, rollAxis: "x" as const },
  { id: "rear_left_nissan", wheelNode: "Group21", isFront: false, rollAxis: "x" as const },
  { id: "rear_right_nissan", wheelNode: "Group13", isFront: false, rollAxis: "x" as const },
] as const;

/**
 * Builds centered rotation pivots for all 4 wheel assemblies.
 */
export function setupWheelRigs(
  model: THREE.Object3D,
  scale: number,
): WheelRig[] {
  const loadedRigs: WheelRig[] = [];

  WHEEL_CONFIGS.forEach((cfg) => {
    const wheelObj = model.getObjectByName(cfg.wheelNode);
    if (!wheelObj) return;

    const parent = wheelObj.parent || model;
    model.updateMatrixWorld(true);

    const wBox = new THREE.Box3().setFromObject(wheelObj);
    const wCenter = wBox.getCenter(new THREE.Vector3());
    const wSize = wBox.getSize(new THREE.Vector3());
    const measuredRadius =
      wSize.y / 2 > 0.05 ? wSize.y / 2 : 0.32 * scale;

    const parentLocalCenter = wCenter.clone();
    parent.worldToLocal(parentLocalCenter);

    // Steer pivot handles front wheel yaw steering (Y-axis)
    const steerPivot = new THREE.Group();
    steerPivot.name = `${cfg.id}_steer`;
    steerPivot.position.copy(parentLocalCenter);

    // Roll pivot handles the axle rolling rotation
    const rollPivot = new THREE.Group();
    rollPivot.name = `${cfg.id}_roll`;
    steerPivot.add(rollPivot);

    // Re-center wheel geometry at the pivot origin
    wheelObj.position.sub(parentLocalCenter);
    rollPivot.add(wheelObj);

    parent.add(steerPivot);

    loadedRigs.push({
      rollPivot,
      steerPivot: cfg.isFront ? steerPivot : undefined,
      radius: measuredRadius,
      rollAxis: cfg.rollAxis,
    });
  });

  return loadedRigs;
}
