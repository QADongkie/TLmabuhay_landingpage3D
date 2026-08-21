"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clamp, smoothstep } from "../../lib/math";
import { createFallbackCar } from "./fallback-car";
import { addRoad } from "./road-environment";
import type { CarStatus, WheelRig } from "./types";
import { setupWheelRigs } from "./wheel-rigs";

// ─── Web Audio engine synthesizer ───────────────────────────────────────────
function playEngineStart() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = ((Math.PI + 220) * x) / (Math.PI + 220 * Math.abs(x));
    }

    // 1. Starter motor crank — rhythmic heavy mechanical turns
    const crankOsc = ctx.createOscillator();
    const crankGain = ctx.createGain();
    const crankDist = ctx.createWaveShaper();
    crankDist.curve = curve;
    crankOsc.type = "sawtooth";
    crankOsc.frequency.setValueAtTime(36, ctx.currentTime);
    crankOsc.frequency.linearRampToValueAtTime(56, ctx.currentTime + 0.9);

    crankGain.gain.setValueAtTime(0, ctx.currentTime);
    crankGain.gain.linearRampToValueAtTime(0.42, ctx.currentTime + 0.08);
    crankGain.gain.setValueAtTime(0.42, ctx.currentTime + 0.72);
    crankGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.95);

    crankOsc.connect(crankDist);
    crankDist.connect(crankGain);
    crankGain.connect(ctx.destination);
    crankOsc.start(ctx.currentTime);
    crankOsc.stop(ctx.currentTime + 0.95);

    // 2. Ignition combustion blast — filtered explosive pop + sub thump
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.28, ctx.sampleRate);
    const nd = noiseBuffer.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 650;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.75, ctx.currentTime + 0.88);
    noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.16);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(ctx.currentTime + 0.88);

    // 3. Engine catch, rev burst & idle growl
    const idleOsc = ctx.createOscillator();
    const idleOsc2 = ctx.createOscillator();
    const idleGain = ctx.createGain();
    const idleDist = ctx.createWaveShaper();
    idleDist.curve = curve;

    idleOsc.type = "sawtooth";
    idleOsc.frequency.setValueAtTime(58, ctx.currentTime + 0.9);
    idleOsc.frequency.exponentialRampToValueAtTime(210, ctx.currentTime + 1.45); // rev burst!
    idleOsc.frequency.exponentialRampToValueAtTime(76, ctx.currentTime + 2.3); // settle to idle

    idleOsc2.type = "square";
    idleOsc2.frequency.setValueAtTime(29, ctx.currentTime + 0.9);
    idleOsc2.frequency.exponentialRampToValueAtTime(105, ctx.currentTime + 1.45);
    idleOsc2.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 2.3);

    idleGain.gain.setValueAtTime(0, ctx.currentTime + 0.88);
    idleGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.0);
    idleGain.gain.setValueAtTime(0.35, ctx.currentTime + 1.45);
    idleGain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 2.5);
    idleGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 4.5);

    idleOsc.connect(idleDist);
    idleOsc2.connect(idleDist);
    idleDist.connect(idleGain);
    idleGain.connect(ctx.destination);
    idleOsc.start(ctx.currentTime + 0.9);
    idleOsc2.start(ctx.currentTime + 0.9);
    idleOsc.stop(ctx.currentTime + 4.5);
    idleOsc2.stop(ctx.currentTime + 4.5);
  } catch {
    // AudioContext blocked or unavailable
  }
}

type EnginePhase = "idle" | "cranking" | "fired" | "running";

interface CarCanvasProps {
  experienceRef: React.RefObject<HTMLDivElement | null>;
  onStatus: (status: CarStatus) => void;
  introGone?: boolean;
}

export function CarCanvas({
  experienceRef,
  onStatus,
  introGone,
}: CarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [enginePhase, setEnginePhase] = useState<EnginePhase>("idle");
  const enginePhaseRef = useRef<EnginePhase>("idle");
  enginePhaseRef.current = enginePhase;

  const [rpm, setRpm] = useState(0);
  const [carReady, setCarReady] = useState(false);
  const engineTimers = useRef<number[]>([]);
  const rafEngineRef = useRef<number>(0);
  const startedRef = useRef(false);

  // Cleanup engine timers on unmount
  useEffect(() => {
    return () => {
      engineTimers.current.forEach((t) => window.clearTimeout(t));
      if (rafEngineRef.current) cancelAnimationFrame(rafEngineRef.current);
    };
  }, []);

  const triggerEngineStart = useCallback(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) return;

    setEnginePhase("cranking");
    playEngineStart();

    const start = performance.now();
    const animateRpm = () => {
      const t = (performance.now() - start) / 1000;
      let r = 0;
      if (t < 0.9) {
        // Cranking stage
        r = t * 920;
      } else if (t < 1.45) {
        // Ignition burst surge up to 3400 RPM!
        r = 920 + Math.pow((t - 0.9) / 0.55, 0.7) * (3400 - 920);
      } else if (t < 2.4) {
        // Settle down to idle
        const p = (t - 1.45) / 0.95;
        r = 3400 - (1 - Math.pow(1 - p, 2)) * (3400 - 780);
      } else {
        // Idle flutter around 780 RPM
        r = 780 + Math.sin(t * 5.5) * 28;
      }
      setRpm(Math.round(Math.max(0, r)));
      if (t < 4.8) rafEngineRef.current = requestAnimationFrame(animateRpm);
    };
    rafEngineRef.current = requestAnimationFrame(animateRpm);

    engineTimers.current.push(
      window.setTimeout(() => setEnginePhase("fired"), 900),
      window.setTimeout(() => setEnginePhase("running"), 2400),
      window.setTimeout(() => {
        setEnginePhase("idle");
        setRpm(0);
      }, 5500),
    );
  }, []);

  // Fire engine start when BOTH intro has finished and 3D car is loaded
  useEffect(() => {
    if (introGone && carReady && !startedRef.current) {
      startedRef.current = true;
      const delay = window.setTimeout(() => {
        triggerEngineStart();
      }, 350);
      return () => window.clearTimeout(delay);
    }
  }, [introGone, carReady, triggerEngineStart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const experience = experienceRef.current;
    if (!canvas || !experience) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      onStatus("fallback");
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x001326, 0.026);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 160);
    camera.position.set(6.8, 3.2, 8.4);

    const hemi = new THREE.HemisphereLight(0xb9dfff, 0x06111e, 2.3);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(7, 11, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -12;
    key.shadow.camera.right = 12;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -12;
    scene.add(key);

    const goldLight = new THREE.PointLight(0xf5b800, 18, 26, 2);
    goldLight.position.set(-4, 2.8, -8);
    scene.add(goldLight);

    addRoad(scene);

    const horizonMaterial = new THREE.MeshBasicMaterial({
      color: 0xf5b800,
      transparent: true,
      opacity: 0.08,
      fog: false,
    });
    const horizon = new THREE.Mesh(
      new THREE.CircleGeometry(11, 64),
      horizonMaterial,
    );
    horizon.position.set(0, 5.8, -82);
    scene.add(horizon);

    const carAnchor = new THREE.Group();
    scene.add(carAnchor);
    const fallback = createFallbackCar();
    carAnchor.add(fallback.car);

    let wheelRigs: WheelRig[] = fallback.wheels.map((hub) => ({
      rollPivot: hub,
      radius: fallback.wheelRadius,
    }));
    let headlightMaterials: THREE.MeshStandardMaterial[] =
      fallback.headlightMaterials;
    let wheelRadius = fallback.wheelRadius;

    const loader = new GLTFLoader();
    let loadedCar: THREE.Object3D | null = null;
    loader.load(
      "/assets/tl-road-car.glb",
      (gltf) => {
        const model = gltf.scene;
        const loadedHeadlights: THREE.MeshStandardMaterial[] = [];
        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.castShadow = true;
          object.receiveShadow = true;
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          const cloned = materials.map((material) => {
            const next = material.clone();
            if (next instanceof THREE.MeshStandardMaterial) {
              if (next.name === "NISSANsentra") {
                next.color.set(0x0b3a68);
                next.metalness = 0.76;
                next.roughness = 0.2;
              }
              if (next.name === "NISSANsentraluz") {
                next.emissive = new THREE.Color(0xffdd72);
                next.emissiveIntensity = 0.2;
                loadedHeadlights.push(next);
              }
            }
            return next;
          });
          object.material = Array.isArray(object.material)
            ? cloned
            : cloned[0];
        });

        const initialBox = new THREE.Box3().setFromObject(model);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const scale = 4.35 / Math.max(initialSize.x, initialSize.z);
        model.scale.setScalar(scale);
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -box.min.y + 0.03, -center.z);

        // Build centered rotation pivots for all 4 wheel assemblies + brake discs
        const loadedRigs = setupWheelRigs(model, scale);

        // Rotate centered wrapper so car stays on lane facing forward
        const forwardModel = new THREE.Group();
        forwardModel.rotation.y = Math.PI;
        forwardModel.add(model);
        carAnchor.remove(fallback.car);
        carAnchor.add(forwardModel);
        loadedCar = forwardModel;

        if (loadedRigs.length) {
          wheelRigs = loadedRigs;
          wheelRadius = loadedRigs[0].radius;
        }
        if (loadedHeadlights.length) headlightMaterials = loadedHeadlights;
        onStatus("ready");
        setCarReady(true);
      },
      undefined,
      () => onStatus("fallback"),
    );

    const pointer = new THREE.Vector2();
    const targetProgress = { value: 0 };
    let currentProgress = 0;
    let raf = 0;
    let lastWidth = 0;
    let lastHeight = 0;

    const updateProgress = () => {
      const bounds = experience.getBoundingClientRect();
      const length = Math.max(1, bounds.height - window.innerHeight);
      targetProgress.value = reduceMotion ? 1 : clamp(-bounds.top / length);
    };

    const updatePointer = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height || (width === lastWidth && height === lastHeight))
        return;
      lastWidth = width;
      lastHeight = height;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const targetCamera = new THREE.Vector3();
    const lookAt = new THREE.Vector3();
    const waypointPos = new THREE.Vector3();
    const waypointLook = new THREE.Vector3();
    const clock = new THREE.Clock();

    const SHOWROOM_ANGLE = Math.PI * 0.84;

    const render = () => {
      resize();
      currentProgress +=
        (targetProgress.value - currentProgress) * (reduceMotion ? 1 : 0.07);
      const time = clock.getElapsedTime();
      const drive = smoothstep(0.13, 0.84, currentProgress);
      const arrival = smoothstep(0.79, 0.98, currentProgress);
      const intro = 1 - smoothstep(0.02, 0.22, currentProgress);
      const cinematic = Math.max(intro, arrival);

      const ignite = smoothstep(0, 0.045, currentProgress);
      const reveal = smoothstep(0.03, 0.115, currentProgress);
      const turn = smoothstep(0.02, 0.115, currentProgress);
      const chase = smoothstep(0.09, 0.13, currentProgress);

      const lane = 0;
      const startCarZ = 3.8;
      const z = THREE.MathUtils.lerp(startCarZ, -69, drive);

      // Engine phase reaction in 3D:
      const phase = enginePhaseRef.current;
      const isCranking = phase === "cranking";
      const isFired = phase === "fired";
      const isRunning = phase === "running";

      let engineYOffset = 0;
      let engineZRot = 0;
      if (isCranking) {
        engineYOffset = (Math.random() - 0.5) * 0.012;
      } else if (isFired) {
        engineYOffset = Math.sin(time * 42) * 0.016;
        engineZRot = Math.sin(time * 28) * 0.012;
      } else if (isRunning) {
        engineYOffset = Math.sin(time * 50) * 0.003;
      }

      carAnchor.position.set(lane, 0.04 + engineYOffset, z);
      carAnchor.rotation.y = THREE.MathUtils.lerp(SHOWROOM_ANGLE, 0, turn);
      carAnchor.rotation.z = engineZRot;

      if (currentProgress < 0.16) {
        waypointPos.set(
          1.55 + pointer.x * 0.08,
          1.05 - pointer.y * 0.05 + Math.sin(time * 0.6) * 0.015,
          3.35,
        );
        const heroPos = new THREE.Vector3(
          6.8 + pointer.x * 0.32,
          3.25 - pointer.y * 0.18,
          8.4,
        );
        waypointPos.lerp(heroPos, reveal);
        const chasePos = new THREE.Vector3(pointer.x * 0.12, 5.8, z + 10.5);
        waypointPos.lerp(chasePos, chase);
        targetCamera.copy(waypointPos);

        waypointLook.set(0, 0.62, z + 1.1);
        const heroLook = new THREE.Vector3(0, 0.75, z);
        waypointLook.lerp(heroLook, reveal);
        const chaseLook = new THREE.Vector3(0, 0.3, z - 4.5);
        waypointLook.lerp(chaseLook, chase);
        lookAt.copy(waypointLook);
      } else {
        targetCamera.set(
          THREE.MathUtils.lerp(pointer.x * 0.12, 4.8, arrival),
          THREE.MathUtils.lerp(5.8, 2.65, arrival),
          THREE.MathUtils.lerp(z + 10.5, z + 8.4, arrival),
        );
        lookAt.set(
          0,
          THREE.MathUtils.lerp(0.3, 0.85, arrival),
          z - THREE.MathUtils.lerp(4.5, 1.5, arrival),
        );
      }

      camera.position.lerp(targetCamera, reduceMotion ? 1 : 0.075);
      camera.lookAt(lookAt);

      // Wheels spin in deterministic sync with travel distance
      const travelDistance = startCarZ - z;
      const baseRollAngle =
        wheelRadius > 0 ? travelDistance / wheelRadius : 0;

      const turnDerivative = Math.sin(turn * Math.PI);
      const steerAngle = turn < 0.99 ? turnDerivative * 0.28 : 0;

      wheelRigs.forEach((rig) => {
        const radius = rig.radius || wheelRadius;
        rig.rollPivot.rotation.x =
          radius > 0 ? travelDistance / radius : baseRollAngle;
        if (rig.steerPivot) {
          rig.steerPivot.rotation.y = steerAngle;
        }
      });

      const fogEase = smoothstep(0, 0.1, currentProgress);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.density = THREE.MathUtils.lerp(0.1, 0.026, fogEase);
      }

      const effectiveIgnite = Math.max(
        ignite,
        isFired ? 1 : isRunning ? 0.75 : isCranking ? 0.3 : 0,
      );

      hemi.intensity = THREE.MathUtils.lerp(0.4, 2.3, effectiveIgnite);
      key.intensity = THREE.MathUtils.lerp(0.7, 4.2, effectiveIgnite);
      headlightMaterials.forEach((material) => {
        material.emissiveIntensity = THREE.MathUtils.lerp(
          0.12,
          isFired ? 4.5 : 1.85,
          effectiveIgnite,
        );
      });

      horizonMaterial.opacity = THREE.MathUtils.lerp(0.08, 0.95, cinematic);
      const igniteFlare = ignite * (1 - reveal);
      goldLight.intensity = THREE.MathUtils.lerp(
        4,
        isFired ? 48 : 34,
        Math.max(cinematic, isFired ? 1 : igniteFlare),
      );

      experience.style.setProperty("--drive", currentProgress.toFixed(4));
      experience.style.setProperty("--route", drive.toFixed(4));
      experience.style.setProperty("--arrival", arrival.toFixed(4));
      experience.style.setProperty("--intro", intro.toFixed(4));
      experience.style.setProperty("--cinematic", cinematic.toFixed(4));
      experience.style.setProperty("--ignite", ignite.toFixed(4));
      experience.style.setProperty("--reveal", reveal.toFixed(4));
      experience.style.setProperty("--turn", turn.toFixed(4));

      if (loadedCar && !isFired) loadedCar.rotation.z = 0;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      window.removeEventListener("pointermove", updatePointer);
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
    };
  }, [experienceRef, onStatus]);

  const rpmPercent = Math.min(rpm / 6500, 1);

  return (
    <div className={`car-canvas-wrap engine-phase--${enginePhase}`}>
      <canvas ref={canvasRef} className="road-canvas" aria-hidden="true" />

      {/* Engine FX overlay */}
      <div
        className={`engine-overlay engine-phase--${enginePhase}`}
        aria-hidden="true"
      >
        {/* Dynamic Sports Tachometer HUD */}
        {rpm > 0 && (
          <div className={`scene-rpm-gauge ${rpm > 2400 ? "is-redline" : ""}`}>
            <div className="scene-rpm-dial">
              <svg viewBox="0 0 140 85" fill="none">
                {/* Dial background track */}
                <path
                  d="M 15 75 A 55 55 0 0 1 125 75"
                  stroke="rgba(255,255,255,0.09)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {/* Redline zone marker */}
                <path
                  d="M 98 28 A 55 55 0 0 1 125 75"
                  stroke="rgba(255,60,60,0.28)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {/* Active fill arc */}
                <path
                  d="M 15 75 A 55 55 0 0 1 125 75"
                  className="rpm-fill-arc"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="188"
                  strokeDashoffset={188 - 188 * rpmPercent}
                />
                {/* Needle */}
                <line
                  x1="70"
                  y1="75"
                  x2={70 + 48 * Math.cos(Math.PI + Math.PI * rpmPercent)}
                  y2={75 + 48 * Math.sin(Math.PI + Math.PI * rpmPercent)}
                  className="rpm-needle"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <circle cx="70" cy="75" r="4.5" fill="#f5b800" />
                <circle cx="70" cy="75" r="2" fill="#001327" />
              </svg>
            </div>
            <div className="scene-rpm-readout">
              <strong>{rpm.toLocaleString()}</strong>
              <span>RPM</span>
            </div>
            <div className="scene-rpm-badge">
              {enginePhase === "cranking" && (
                <span className="badge-cranking">
                  <i className="badge-dot" /> STARTER ENGAGED
                </span>
              )}
              {enginePhase === "fired" && (
                <span className="badge-fired">
                  <i className="badge-dot" /> IGNITION BURST
                </span>
              )}
              {enginePhase === "running" && (
                <span className="badge-running">
                  <i className="badge-dot" /> 780 RPM · IDLE
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
