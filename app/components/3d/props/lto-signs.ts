import * as THREE from "three";

/**
 * Creates canvas-based high-resolution textures for official LTO (Land Transportation Office)
 * and Philippine highway traffic signs.
 */
function createTurnRightSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Blue circular regulatory sign (LTO Mandatory Action: Turn Right)
  ctx.beginPath();
  ctx.arc(256, 256, 238, 0, Math.PI * 2);
  ctx.fillStyle = "#0d47a1";
  ctx.fill();

  // White border
  ctx.lineWidth = 14;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  // White right arrow
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(140, 230, 160, 52, 8);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(270, 160);
  ctx.lineTo(390, 256);
  ctx.lineTo(270, 352);
  ctx.lineTo(270, 296);
  ctx.lineTo(250, 296);
  ctx.lineTo(250, 216);
  ctx.lineTo(270, 216);
  ctx.closePath();
  ctx.fill();

  ctx.font = "700 32px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("TURN RIGHT", 256, 420);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSpeedLimitSignTexture(speed: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // White circle
  ctx.beginPath();
  ctx.arc(256, 256, 238, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Red border
  ctx.lineWidth = 36;
  ctx.strokeStyle = "#d32f2f";
  ctx.stroke();

  // Speed number
  ctx.fillStyle = "#111827";
  ctx.font = "900 180px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(speed.toString(), 256, 240);

  // MAX Subtitle
  ctx.font = "700 36px -apple-system, sans-serif";
  ctx.fillStyle = "#4b5563";
  ctx.fillText("KM/H", 256, 360);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Builds a complete 3D road sign assembly with galvanized metal post, backplate, and mounting clamps.
 */
export function createSignPost(
  texture: THREE.CanvasTexture,
  shape: "circle" | "octagon" | "diamond" | "rect" = "circle",
  height = 2.4,
  radius = 0.65,
): THREE.Group {
  const group = new THREE.Group();

  // Galvanized steel post material
  const postMaterial = new THREE.MeshStandardMaterial({
    color: 0x90a4ae,
    metalness: 0.85,
    roughness: 0.35,
  });

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.045, height, 16),
    postMaterial,
  );
  post.position.y = height / 2;
  post.castShadow = true;
  post.receiveShadow = true;
  group.add(post);

  // Concrete footing base
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x455a64,
    roughness: 0.9,
  });
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.18, 16),
    baseMaterial,
  );
  base.position.y = 0.09;
  group.add(base);

  const signMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.35,
    metalness: 0.15,
  });

  const backMaterial = new THREE.MeshStandardMaterial({
    color: 0x78909c,
    metalness: 0.75,
    roughness: 0.45,
  });

  const signGeometry = new THREE.CylinderGeometry(radius, radius, 0.03, 32);
  signGeometry.rotateX(Math.PI / 2);

  // Front display face
  const faceMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    signMaterial,
  );
  faceMesh.position.set(0, height - 0.15, 0.02);
  faceMesh.castShadow = true;
  group.add(faceMesh);

  // Solid backing board
  const backMesh = new THREE.Mesh(signGeometry, backMaterial);
  backMesh.position.set(0, height - 0.15, 0);
  backMesh.castShadow = true;
  group.add(backMesh);

  return group;
}

/**
 * Creates clean, essential roadside signs positioned along the journey.
 */
export function buildLtoSignEnvironment(): {
  group: THREE.Group;
  turnRightSign: THREE.Group;
  speedSign: THREE.Group;
} {
  const group = new THREE.Group();

  // 1. Stage 2: LTO Mandatory Turn Right Sign at fork entrance (z = -19.5)
  const turnTex = createTurnRightSignTexture();
  const turnRightSign = createSignPost(turnTex, "circle", 2.45, 0.64);
  turnRightSign.position.set(3.6, 0, -19.5);
  turnRightSign.rotation.y = -0.25;
  group.add(turnRightSign);

  // 2. Stage 3: Speed Limit 40 km/h sign (z = -34)
  const speedTex = createSpeedLimitSignTexture(40);
  const speedSign = createSignPost(speedTex, "circle", 2.2, 0.55);
  speedSign.position.set(-3.6, 0, -34.0);
  speedSign.rotation.y = 0.18;
  group.add(speedSign);

  return { group, turnRightSign, speedSign };
}
