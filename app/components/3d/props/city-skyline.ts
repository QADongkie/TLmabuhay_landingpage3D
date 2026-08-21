import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Loads and arranges the new 3D City with built-in Stoplights and Glowing Street Facades.
 */
export function addCityEnvironment(scene: THREE.Scene) {
  const cityGroup = new THREE.Group();
  cityGroup.name = "city_environment";
  scene.add(cityGroup);

  const loader = new GLTFLoader();
  loader.load(
    "/assets/city-set-1.glb",
    (gltf) => {
      const baseCity = gltf.scene;

      // Enhance materials and glowing signs/stoplights
      baseCity.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.castShadow = true;
        child.receiveShadow = true;

        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.roughness = 0.72;
            mat.metalness = 0.28;

            const name = mat.name.toLowerCase();
            if (name.includes("redglow")) {
              mat.emissive = new THREE.Color(0xff1744);
              mat.emissiveIntensity = 3.5;
            } else if (name.includes("greenglow")) {
              mat.emissive = new THREE.Color(0x00e676);
              mat.emissiveIntensity = 2.8;
            } else if (name.includes("whiteglow")) {
              mat.emissive = new THREE.Color(0xfff3d0);
              mat.emissiveIntensity = 2.2;
            } else if (name.includes("glow")) {
              mat.emissive = new THREE.Color(0xf5b800);
              mat.emissiveIntensity = 1.4;
            } else if (name.includes("paramount") || name.includes("clinic") || name.includes("pawnshop") || name.includes("fishfactory")) {
              mat.roughness = 0.6;
              mat.metalness = 0.35;
            }
          }
        });
      });

      const initialBox = new THREE.Box3().setFromObject(baseCity);
      const initialSize = initialBox.getSize(new THREE.Vector3());

      const targetHeight = 16.0;
      const scale = targetHeight / Math.max(initialSize.y, 1);
      baseCity.scale.setScalar(scale);

      const scaledBox = new THREE.Box3().setFromObject(baseCity);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

      // Center baseCity geometry inside a pivot wrapper
      const centeredWrapper = new THREE.Group();
      baseCity.position.set(-scaledCenter.x, -scaledBox.min.y - 0.05, -scaledCenter.z);
      centeredWrapper.add(baseCity);

      // Position the city center along the main highway corridor
      centeredWrapper.position.set(0, 0, -45.0);
      cityGroup.add(centeredWrapper);
    },
    undefined,
    () => {
      // Graceful fallback
    },
  );

  return cityGroup;
}
