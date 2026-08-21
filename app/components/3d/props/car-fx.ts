import * as THREE from "three";

/**
 * Procedural Web Audio Synthesizer with safe singleton context.
 */
class JourneyAudioEngine {
  private ctx: AudioContext | null = null;
  private blinkerTimer: number | null = null;
  private blinkerTick = false;

  private initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playBlinkerClick(highTone = false) {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sine";
      const freq = highTone ? 1400 : 920;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, ctx.currentTime + 0.035);

      filter.type = "bandpass";
      filter.frequency.value = freq;
      filter.Q.value = 4.0;

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.045);
    } catch {
      // Audio fallback
    }
  }

  startBlinkerSound() {
    if (this.blinkerTimer !== null) return;
    this.blinkerTick = false;
    this.blinkerTimer = window.setInterval(() => {
      this.blinkerTick = !this.blinkerTick;
      this.playBlinkerClick(this.blinkerTick);
    }, 450);
  }

  stopBlinkerSound() {
    if (this.blinkerTimer !== null) {
      clearInterval(this.blinkerTimer);
      this.blinkerTimer = null;
    }
  }
}

export const journeyAudio = new JourneyAudioEngine();

/**
 * Creates dynamic car lighting helpers with state caching to prevent frame-by-frame thrashing.
 */
export function createCarLightingRig(): {
  group: THREE.Group;
  setBlinkers: (active: boolean, side?: "left" | "right") => void;
  setBrakes: (active: boolean) => void;
  updateBlinkers: (time: number) => void;
} {
  const group = new THREE.Group();

  // Amber Blinker Materials
  const blinkerMatLeft = new THREE.MeshStandardMaterial({
    color: 0xff9100,
    emissive: 0xff9100,
    emissiveIntensity: 0.1,
    roughness: 0.2,
  });
  const blinkerMatRight = new THREE.MeshStandardMaterial({
    color: 0xff9100,
    emissive: 0xff9100,
    emissiveIntensity: 0.1,
    roughness: 0.2,
  });

  // Red Brake Lights Material
  const brakeMat = new THREE.MeshStandardMaterial({
    color: 0xd50000,
    emissive: 0xff1744,
    emissiveIntensity: 0.2,
    roughness: 0.2,
  });

  // Rear Brake Light Meshes
  const brakeLightGeo = new THREE.BoxGeometry(0.32, 0.12, 0.04);
  const leftBrake = new THREE.Mesh(brakeLightGeo, brakeMat);
  leftBrake.position.set(-0.78, 0.72, -2.12);
  group.add(leftBrake);

  const rightBrake = new THREE.Mesh(brakeLightGeo, brakeMat);
  rightBrake.position.set(0.78, 0.72, -2.12);
  group.add(rightBrake);

  // Front & Rear Blinker Meshes
  const blinkerGeo = new THREE.BoxGeometry(0.18, 0.08, 0.04);

  const rightFrontBlinker = new THREE.Mesh(blinkerGeo, blinkerMatRight);
  rightFrontBlinker.position.set(0.88, 0.68, 2.05);
  group.add(rightFrontBlinker);

  const rightRearBlinker = new THREE.Mesh(blinkerGeo, blinkerMatRight);
  rightRearBlinker.position.set(0.88, 0.72, -2.12);
  group.add(rightRearBlinker);

  const leftFrontBlinker = new THREE.Mesh(blinkerGeo, blinkerMatLeft);
  leftFrontBlinker.position.set(-0.88, 0.68, 2.05);
  group.add(leftFrontBlinker);

  const leftRearBlinker = new THREE.Mesh(blinkerGeo, blinkerMatLeft);
  leftRearBlinker.position.set(-0.88, 0.72, -2.12);
  group.add(leftRearBlinker);

  let currentBlinkers = false;
  let currentSide: "left" | "right" = "right";
  let currentBrakes = false;

  const setBlinkers = (active: boolean, side: "left" | "right" = "right") => {
    if (active === currentBlinkers && side === currentSide) return;
    currentBlinkers = active;
    currentSide = side;

    if (active) {
      journeyAudio.startBlinkerSound();
    } else {
      journeyAudio.stopBlinkerSound();
      blinkerMatLeft.emissiveIntensity = 0.1;
      blinkerMatRight.emissiveIntensity = 0.1;
    }
  };

  const setBrakes = (active: boolean) => {
    if (active === currentBrakes) return;
    currentBrakes = active;
    brakeMat.emissiveIntensity = active ? 4.8 : 0.2;
  };

  const updateBlinkers = (time: number) => {
    if (!currentBlinkers) return;
    const isLit = Math.sin(time * 12) > 0;
    const intensity = isLit ? 4.5 : 0.1;
    if (currentSide === "right") {
      blinkerMatRight.emissiveIntensity = intensity;
      blinkerMatLeft.emissiveIntensity = 0.1;
    } else {
      blinkerMatLeft.emissiveIntensity = intensity;
      blinkerMatRight.emissiveIntensity = 0.1;
    }
  };

  return {
    group,
    setBlinkers,
    setBrakes,
    updateBlinkers,
  };
}
