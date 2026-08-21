import * as THREE from "three";
import { buildLtoSignEnvironment } from "./props/lto-signs";
import { buildSlalomConeTrack } from "./props/traffic-cones";
import { buildHighwayStreetLights } from "./props/street-lights";
import { createTrafficSignal } from "./props/traffic-signals";
import { buildRoadsideGreenery } from "./props/landscape";
import {
  createHighwayBillboard,
  createBranchDestination,
} from "./props/branch-destination";
import { addCityEnvironment } from "./props/city-skyline";

export interface EnvironmentHandles {
  stage1Signal: ReturnType<typeof createTrafficSignal>;
  stage4Signal: ReturnType<typeof createTrafficSignal>;
}

export function addRoad(scene: THREE.Scene): EnvironmentHandles {
  const road = new THREE.Group();

  // 0. Add 3D City Environment Backdrop
  addCityEnvironment(scene);

  // Materials
  const asphalt = new THREE.MeshStandardMaterial({
    color: 0x07111d,
    roughness: 0.94,
    metalness: 0.06,
  });

  const shoulder = new THREE.MeshStandardMaterial({
    color: 0x0b2743,
    roughness: 0.82,
  });

  const yellowLine = new THREE.MeshStandardMaterial({
    color: 0xf5b800,
    emissive: 0x3b2700,
    emissiveIntensity: 0.65,
    roughness: 0.48,
  });

  const whiteLine = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x444444,
    emissiveIntensity: 0.4,
    roughness: 0.4,
  });

  // 1. Main highway surface (Z from +12 to -95)
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 108), asphalt);
  surface.rotation.x = -Math.PI / 2;
  surface.position.set(0, 0, -42);
  surface.receiveShadow = true;
  road.add(surface);

  // 2. Right road fork / branch expansion (Z from -18 to -44)
  const forkSurface = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 28), asphalt);
  forkSurface.rotation.x = -Math.PI / 2;
  forkSurface.rotation.z = -0.18; // angled right
  forkSurface.position.set(3.2, 0.005, -30);
  forkSurface.receiveShadow = true;
  road.add(forkSurface);

  // 3. Shoulder edges & guard rails
  [-4.9, 4.9].forEach((x) => {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.07, 108), shoulder);
    edge.position.set(x, 0.02, -42);
    edge.receiveShadow = true;
    road.add(edge);

    // Guardrail posts and W-beam rail
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x546e7a,
      metalness: 0.85,
      roughness: 0.35,
    });
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 108), railMat);
    rail.position.set(x * 0.96, 0.35, -42);
    rail.castShadow = true;
    road.add(rail);

    for (let z = 10; z > -94; z -= 6.0) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.5, 0.1),
        railMat,
      );
      post.position.set(x * 0.96, 0.25, z);
      post.castShadow = true;
      road.add(post);
    }
  });

  // 4. Center yellow divider dashes & cat's eye reflectors
  for (let z = 10; z > -92; z -= 4.8) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.035, 2.4), yellowLine);
    dash.position.set(0, 0.045, z);
    road.add(dash);

    [-4.3, 4.3].forEach((x) => {
      const reflector = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.09, 0.3),
        yellowLine,
      );
      reflector.position.set(x, 0.08, z);
      road.add(reflector);
    });
  }

  // 5. Stage 1: Official White STOP Bar (Z = -14.2)
  const stopBar = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.04, 0.55),
    whiteLine,
  );
  stopBar.position.set(-1.8, 0.046, -14.2);
  road.add(stopBar);

  // 6. Stage 1: 3-Aspect LED Stop Light (Z = -14.2)
  const stage1Signal = createTrafficSignal("red");
  stage1Signal.group.position.set(-3.8, 0, -14.2);
  stage1Signal.group.rotation.y = Math.PI / 2; // Facing the incoming car
  road.add(stage1Signal.group);

  // 7. Stage 4: Red Light Stop Bar (Z = -52.0)
  const signalStopBar = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.04, 0.55),
    whiteLine,
  );
  signalStopBar.position.set(-1.8, 0.046, -52.0);
  road.add(signalStopBar);

  // 8. Stage 4: 3-Aspect LED Traffic Light at Red Light Viewpoint (Z = -52.2)
  const stage4Signal = createTrafficSignal("red");
  stage4Signal.group.position.set(4.6, 0, -52.2);
  stage4Signal.group.rotation.y = -Math.PI / 2;
  road.add(stage4Signal.group);

  // 9. Add Streamlined LTO Signs (Turn Right & Speed Limit)
  const ltoSigns = buildLtoSignEnvironment();
  road.add(ltoSigns.group);

  // 10. Add Slalom Cones (Stage 2)
  const slalom = buildSlalomConeTrack();
  road.add(slalom);

  // 11. Add Highway Streetlights
  const streetlights = buildHighwayStreetLights();
  road.add(streetlights);

  // 12. Add Roadside Trees & Greenery
  const greenery = buildRoadsideGreenery();
  road.add(greenery);

  // 13. Add Stage 4 TL Mabuhay Billboard
  const billboard = createHighwayBillboard();
  billboard.position.set(-7.5, 0, -55);
  billboard.rotation.y = 0.28;
  road.add(billboard);

  // 14. Add Stage 5 Branch Destination & 45-degree Parking Bays
  const branchDest = createBranchDestination();
  road.add(branchDest);

  scene.add(road);

  return { stage1Signal, stage4Signal };
}
