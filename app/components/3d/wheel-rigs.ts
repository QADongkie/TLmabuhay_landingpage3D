import * as THREE from "three";
import type { WheelRig } from "./types";

export const WHEEL_CONFIGS = [
  { id: "rear_right", wheelNode: "Group13", discNode: "Group32", isFront: false },
  { id: "front_right", wheelNode: "Group17", discNode: "Group31", isFront: true },
  { id: "rear_left", wheelNode: "Group21", discNode: "Group29", isFront: false },
  { id: "front_left", wheelNode: "Group25", discNode: "Group30", isFront: true },
] as const;

/**
 * Builds centered rotation pivots for all 4 wheel assemblies + brake rotors.
 *
 * In the raw GLB asset, wheel nodes have their local origin at (0,0,0) with
 * geometry offset in space. By centering the geometry inside dedicated
 * steerPivot and rollPivot containers, each wheel spins perfectly on its axle
 * with zero wobble, zero clipping, and natural front steering.
 */
export function setupWheelRigs(
  model: THREE.Object3D,
  scale: number,
): WheelRig[] {
  const loadedRigs: WheelRig[] = [];

  WHEEL_CONFIGS.forEach((cfg) => {
    const wheelObj = model.getObjectByName(cfg.wheelNode);
    const discObj = model.getObjectByName(cfg.discNode);
    if (!wheelObj) return;

    const parent = wheelObj.parent || model;
    model.updateMatrixWorld(true);

    const wBox = new THREE.Box3().setFromObject(wheelObj);
    const wCenter = wBox.getCenter(new THREE.Vector3());
    const wSize = wBox.getSize(new THREE.Vector3());
    const measuredRadius =
      wSize.y / 2 > 0.05 ? wSize.y / 2 : 0.3 * scale;

    const parentLocalCenter = wCenter.clone();
    parent.worldToLocal(parentLocalCenter);

    // Steer pivot handles front wheel yaw steering
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

    if (discObj) {
      discObj.position.sub(parentLocalCenter);
      rollPivot.add(discObj);
    }

    parent.add(steerPivot);

    loadedRigs.push({
      rollPivot,
      steerPivot: cfg.isFront ? steerPivot : undefined,
      radius: measuredRadius,
    });
  });

  return loadedRigs;
}
