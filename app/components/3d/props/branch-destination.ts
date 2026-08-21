import * as THREE from "three";

let cachedBillboardTexture: THREE.CanvasTexture | null = null;
let cachedBranchSignTexture: THREE.CanvasTexture | null = null;

/**
 * Creates the high-contrast illuminated billboard face for Stage 4: "Why TL Mabuhay".
 */
function getBillboardTexture(): THREE.CanvasTexture {
  if (cachedBillboardTexture) return cachedBillboardTexture;

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Deep Navy background
  const bgGrad = ctx.createLinearGradient(0, 0, 1024, 512);
  bgGrad.addColorStop(0, "#001326");
  bgGrad.addColorStop(0.5, "#071c33");
  bgGrad.addColorStop(1, "#0a2b4e");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Gold accent border
  ctx.strokeStyle = "#f5b800";
  ctx.lineWidth = 12;
  ctx.strokeRect(20, 20, 984, 472);

  // Inner framing line
  ctx.strokeStyle = "rgba(245, 184, 0, 0.35)";
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, 952, 440);

  // Top header: TL MABUHAY
  ctx.fillStyle = "#f5b800";
  ctx.font = "900 44px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("TL MABUHAY DRIVING ACADEMY", 60, 95);

  // Subtitle
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 24px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("YOUR DEFENSIVE DRIVING ADVOCATE", 60, 135);

  // Divider line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 160);
  ctx.lineTo(964, 160);
  ctx.stroke();

  // 3 Key Pillar Metrics
  const pillars = [
    { stat: "147", label: "BRANCHES", sub: "Nationwide Access" },
    { stat: "160K+", label: "DRIVERS", sub: "Trained Defensive" },
    { stat: "LTO", label: "ACCREDITED", sub: "Official Standard" },
  ];

  pillars.forEach((p, idx) => {
    const x = 60 + idx * 315;

    ctx.fillStyle = "rgba(11, 43, 78, 0.75)";
    ctx.fillRect(x, 190, 280, 240);
    ctx.strokeStyle = "rgba(245, 184, 0, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 190, 280, 240);

    ctx.fillStyle = "#f5b800";
    ctx.font = "900 68px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(p.stat, x + 24, 275);

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 24px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(p.label, x + 24, 325);

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "500 18px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(p.sub, x + 24, 370);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedBillboardTexture = texture;
  return texture;
}

/**
 * Creates the glowing main branch signboard texture.
 */
function getBranchSignTexture(): THREE.CanvasTexture {
  if (cachedBranchSignTexture) return cachedBranchSignTexture;

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createLinearGradient(0, 0, 1024, 256);
  grad.addColorStop(0, "#001833");
  grad.addColorStop(0.5, "#002b5c");
  grad.addColorStop(1, "#001833");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = "#f5b800";
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 1004, 236);

  ctx.fillStyle = "#f5b800";
  ctx.font = "900 52px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("TL MABUHAY DRIVING ACADEMY", 512, 105);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 28px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("OFFICIAL LTO ACCREDITED TRAINING CENTER", 512, 160);

  ctx.fillStyle = "#00e676";
  ctx.font = "800 22px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("● ENROLLMENT & PRACTICAL DRIVING HUB", 512, 205);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedBranchSignTexture = texture;
  return texture;
}

/**
 * Helper to build an illuminated architectural poster display lightbox.
 */
function createPosterLightbox(
  imagePath: string,
  width: number,
  height: number,
): THREE.Group {
  const group = new THREE.Group();

  const textureLoader = new THREE.TextureLoader();
  const posterTex = textureLoader.load(imagePath);
  posterTex.colorSpace = THREE.SRGBColorSpace;

  // Frame casing
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1a2634,
    metalness: 0.85,
    roughness: 0.25,
  });
  const goldBorderMat = new THREE.MeshStandardMaterial({
    color: 0xf5b800,
    emissive: 0x5a3e00,
    emissiveIntensity: 0.4,
    metalness: 0.6,
    roughness: 0.2,
  });

  const casing = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.24, height + 0.24, 0.16),
    frameMat,
  );
  casing.castShadow = true;
  group.add(casing);

  const border = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.12, height + 0.12, 0.18),
    goldBorderMat,
  );
  group.add(border);

  // Poster Image Face (Emissive backlit)
  const posterMat = new THREE.MeshStandardMaterial({
    map: posterTex,
    emissive: 0xffffff,
    emissiveMap: posterTex,
    emissiveIntensity: 0.65,
    roughness: 0.2,
    metalness: 0.05,
  });
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    posterMat,
  );
  face.position.set(0, 0, 0.1);
  group.add(face);

  // Top LED light bar fixture
  const ledBar = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.85, 0.08, 0.22),
    goldBorderMat,
  );
  ledBar.position.set(0, height / 2 + 0.18, 0.12);
  group.add(ledBar);

  return group;
}

/**
 * Creates the roadside TL Mabuhay Billboard gantry structure (Stage 4).
 */
export function createHighwayBillboard(): THREE.Group {
  const gantry = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x37474f,
    metalness: 0.85,
    roughness: 0.35,
  });

  // Dual vertical support towers
  [-2.2, 2.2].forEach((x) => {
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 7.8, 12),
      steelMat,
    );
    column.position.set(x, 3.9, 0);
    column.castShadow = true;
    gantry.add(column);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.4, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.9 }),
    );
    base.position.set(x, 0.2, 0);
    gantry.add(base);
  });

  const truss = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.15, 0.15),
    steelMat,
  );
  truss.position.set(0, 4.2, 0);
  gantry.add(truss);

  const boardHousing = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 3.3, 0.32),
    steelMat,
  );
  boardHousing.position.set(0, 6.2, 0);
  boardHousing.castShadow = true;
  gantry.add(boardHousing);

  const faceMat = new THREE.MeshStandardMaterial({
    map: getBillboardTexture(),
    roughness: 0.2,
    metalness: 0.05,
    emissive: 0xffffff,
    emissiveMap: getBillboardTexture(),
    emissiveIntensity: 0.45,
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 3.1), faceMat);
  face.position.set(0, 6.2, 0.17);
  gantry.add(face);

  return gantry;
}

/**
 * Creates the Stage 5 TL Mabuhay Flagship Branch building, 3 illuminated poster displays,
 * 45-degree parking bays, and academy entrance canopy.
 */
export function createBranchDestination(): THREE.Group {
  const destGroup = new THREE.Group();

  // 1. Branch Main Building Architecture
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x081728,
    roughness: 0.65,
    metalness: 0.25,
  });
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(16, 7.5, 7.5),
    wallMat,
  );
  building.position.set(11.5, 3.75, -77);
  building.castShadow = true;
  building.receiveShadow = true;
  destGroup.add(building);

  // Second tier upper roof accent
  const roofTier = new THREE.Mesh(
    new THREE.BoxGeometry(14.5, 0.8, 6.8),
    new THREE.MeshStandardMaterial({ color: 0x040c16, metalness: 0.8, roughness: 0.2 }),
  );
  roofTier.position.set(11.5, 7.9, -77);
  destGroup.add(roofTier);

  // 2. Entrance Glass Windows and Lobby Canopy
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    emissive: 0x003366,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.75,
    roughness: 0.1,
    metalness: 0.9,
  });
  const glassLobby = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 3.4),
    glassMat,
  );
  glassLobby.position.set(6.8, 1.8, -73.2);
  destGroup.add(glassLobby);

  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x061424,
    metalness: 0.85,
    roughness: 0.25,
  });
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 0.3, 3.6),
    canopyMat,
  );
  canopy.position.set(6.8, 3.65, -74.5);
  canopy.castShadow = true;
  destGroup.add(canopy);

  // Canopy gold trim
  const canopyTrim = new THREE.Mesh(
    new THREE.BoxGeometry(5.7, 0.08, 3.7),
    new THREE.MeshStandardMaterial({ color: 0xf5b800, emissive: 0x7c5a00, emissiveIntensity: 0.5 }),
  );
  canopyTrim.position.set(6.8, 3.75, -74.5);
  destGroup.add(canopyTrim);

  // Canopy columns
  [4.5, 9.1].forEach((x) => {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 3.65, 16),
      canopyMat,
    );
    col.position.set(x, 1.82, -73.1);
    col.castShadow = true;
    destGroup.add(col);
  });

  // 3. Main Glowing Signboard above Entrance
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5.8, 1.45),
    new THREE.MeshStandardMaterial({
      map: getBranchSignTexture(),
      emissive: 0xffffff,
      emissiveMap: getBranchSignTexture(),
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.1,
    }),
  );
  signMesh.position.set(6.8, 4.65, -73.2);
  destGroup.add(signMesh);

  // 4. THE 3 TL MABUHAY POSTERS ON THE BRANCH

  // POSTER 1 (Left Entrance Wall): Official Academy Certification / Logo
  const poster1 = createPosterLightbox(
    "/assets/posters/tl-poster-1.png",
    2.2,
    3.0,
  );
  poster1.position.set(4.4, 2.8, -73.2);
  destGroup.add(poster1);

  // POSTER 2 (Upper Right Facade): Defensive Driving Advocate
  const poster2 = createPosterLightbox(
    "/assets/posters/tl-poster-2.jpg",
    3.2,
    2.3,
  );
  poster2.position.set(11.8, 4.2, -73.2);
  destGroup.add(poster2);

  // POSTER 3 (Forecourt Roadside Pylon Billboard angled to driver):
  const poster3 = createPosterLightbox(
    "/assets/posters/tl-poster-3.jpg",
    2.4,
    3.2,
  );
  poster3.position.set(13.2, 2.4, -68.5);
  poster3.rotation.y = -Math.PI / 4; // Angled 45 deg facing incoming car
  destGroup.add(poster3);

  // Poster 3 Pylon Base Post
  const pylonBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.15, 2.4, 12),
    canopyMat,
  );
  pylonBase.position.set(13.2, 1.2, -68.5);
  destGroup.add(pylonBase);

  // 5. 45-Degree Parking Bays
  const parkingAsphalt = new THREE.Mesh(
    new THREE.PlaneGeometry(10.5, 16),
    new THREE.MeshStandardMaterial({
      color: 0x081320,
      roughness: 0.94,
      metalness: 0.06,
    }),
  );
  parkingAsphalt.rotation.x = -Math.PI / 2;
  parkingAsphalt.position.set(5.5, 0.01, -73);
  parkingAsphalt.receiveShadow = true;
  destGroup.add(parkingAsphalt);

  const lineMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x888888,
    emissiveIntensity: 0.45,
    roughness: 0.35,
  });

  const curbMat = new THREE.MeshStandardMaterial({
    color: 0xf5b800,
    emissive: 0x4a3700,
    emissiveIntensity: 0.35,
    roughness: 0.7,
  });

  const stallZPositions = [-67.5, -71.0, -74.5, -78.0];
  stallZPositions.forEach((z) => {
    const stallLine = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.02, 5.4),
      lineMat,
    );
    stallLine.rotation.y = -Math.PI / 4;
    stallLine.position.set(4.5, 0.025, z);
    destGroup.add(stallLine);

    const wheelStop = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.1, 0.18),
      curbMat,
    );
    wheelStop.rotation.y = Math.PI / 4;
    wheelStop.position.set(6.4, 0.05, z - 1.8);
    wheelStop.castShadow = true;
    destGroup.add(wheelStop);
  });

  return destGroup;
}
