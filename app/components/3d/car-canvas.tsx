"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clamp, smoothstep } from "../../lib/math";
import { createFallbackCar } from "./fallback-car";
import { addRoad } from "./road-environment";
import { journeyAudio } from "./props/car-fx";
import { setupBuiltInCarLights, type BuiltInCarLightsController } from "./built-in-lights";
import { InteractiveSteerHud } from "../narrative/interactive-steer-hud";
import type { CarStatus, WheelRig } from "./types";
import { setupWheelRigs } from "./wheel-rigs";

// ─── Web Audio Engine Synthesizer for Ignition ──────────────────────────────
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

    // 1. Starter motor crank
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

    // 2. Combustion blast
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

    // 3. Engine catch and idle
    const idleOsc = ctx.createOscillator();
    const idleOsc2 = ctx.createOscillator();
    const idleGain = ctx.createGain();
    const idleDist = ctx.createWaveShaper();
    idleDist.curve = curve;

    idleOsc.type = "sawtooth";
    idleOsc.frequency.setValueAtTime(58, ctx.currentTime + 0.9);
    idleOsc.frequency.exponentialRampToValueAtTime(210, ctx.currentTime + 1.45);
    idleOsc.frequency.exponentialRampToValueAtTime(76, ctx.currentTime + 2.3);

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
    // Audio context fallback
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

  // Stage 2 Interactive Steering States
  const [inStage2, setInStage2] = useState(false);
  const inStage2Ref = useRef(false);
  const [steeredRight, setSteeredRight] = useState(false);
  const [wrongAttempt, setWrongAttempt] = useState(false);
  const [autoDemonstrating, setAutoDemonstrating] = useState(false);
  const steerRightRef = useRef(false);

  // Clean up timers
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
        r = t * 920;
      } else if (t < 1.45) {
        r = 920 + Math.pow((t - 0.9) / 0.55, 0.7) * (3400 - 920);
      } else if (t < 2.4) {
        const p = (t - 1.45) / 0.95;
        r = 3400 - (1 - Math.pow(1 - p, 2)) * (3400 - 780);
      } else {
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

  useEffect(() => {
    if (introGone && carReady && !startedRef.current) {
      startedRef.current = true;
      const delay = window.setTimeout(() => {
        triggerEngineStart();
      }, 350);
      return () => window.clearTimeout(delay);
    }
  }, [introGone, carReady, triggerEngineStart]);

  // Handle Steering Right Action
  const handleSteerRight = useCallback(() => {
    setSteeredRight(true);
    setWrongAttempt(false);
    steerRightRef.current = true;
    journeyAudio.playBlinkerClick(true);
  }, []);

  // Handle Wrong Steering Attempt
  const handleWrongSteer = useCallback(() => {
    setWrongAttempt(true);
    journeyAudio.playBlinkerClick(false);
    const t = window.setTimeout(() => setWrongAttempt(false), 2400);
    return () => clearTimeout(t);
  }, []);

  // Auto-demonstration fallback for Stage 2
  useEffect(() => {
    if (!inStage2 || steeredRight) return;
    const timer = window.setTimeout(() => {
      setAutoDemonstrating(true);
      handleSteerRight();
    }, 3500);
    return () => clearTimeout(timer);
  }, [inStage2, steeredRight, handleSteerRight]);

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
    scene.fog = new THREE.FogExp2(0x001326, 0.024);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 160);
    camera.position.set(1.55, 1.05, 3.35);

    const hemi = new THREE.HemisphereLight(0xb9dfff, 0x06111e, 2.3);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(7, 11, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -14;
    key.shadow.camera.right = 14;
    key.shadow.camera.top = 14;
    key.shadow.camera.bottom = -14;
    scene.add(key);

    const goldLight = new THREE.PointLight(0xf5b800, 18, 26, 2);
    goldLight.position.set(-4, 2.8, -8);
    scene.add(goldLight);

    // Build the 3D Road Environment with Stop Lights and Centered City Backdrop
    const envHandles = addRoad(scene);

    const horizonMaterial = new THREE.MeshBasicMaterial({
      color: 0xf5b800,
      transparent: true,
      opacity: 0.08,
      fog: false,
    });
    const horizon = new THREE.Mesh(
      new THREE.CircleGeometry(11, 48),
      horizonMaterial,
    );
    horizon.position.set(0, 5.8, -88);
    scene.add(horizon);

    const carAnchor = new THREE.Group();
    scene.add(carAnchor);
    const fallback = createFallbackCar();
    carAnchor.add(fallback.car);

    let builtInLights: BuiltInCarLightsController | null = null;
    let wheelRigs: WheelRig[] = fallback.wheels.map((hub) => ({
      rollPivot: hub,
      radius: fallback.wheelRadius,
      rollAxis: "x",
    }));
    let wheelRadius = fallback.wheelRadius;

    const loader = new GLTFLoader();
    let loadedCar: THREE.Object3D | null = null;

    // Load the new Fairheaven low-poly car model
    loader.load(
      "/assets/fairheaven-lowpoly-car.glb",
      (gltf) => {
        const model = gltf.scene;

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
              if (
                next.name === "Fairheaven_LT80_Bodymat" ||
                next.name === "NISSANsentra"
              ) {
                next.color.set(0x0b3a68);
                next.metalness = 0.78;
                next.roughness = 0.2;
              }
            }
            return next;
          });
          object.material = Array.isArray(object.material)
            ? cloned
            : cloned[0];
        });

        builtInLights = setupBuiltInCarLights(model);

        const initialBox = new THREE.Box3().setFromObject(model);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const scale = 4.35 / Math.max(initialSize.x, initialSize.z);
        model.scale.setScalar(scale);

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -box.min.y + 0.03, -center.z);

        const loadedRigs = setupWheelRigs(model, scale);

        // Fairheaven length is along X (+X is front). Rotate by +PI/2 to face -Z (forward on road)
        const forwardModel = new THREE.Group();
        forwardModel.rotation.y = Math.PI / 2;
        forwardModel.add(model);

        carAnchor.remove(fallback.car);
        carAnchor.add(forwardModel);
        loadedCar = forwardModel;

        if (loadedRigs.length) {
          wheelRigs = loadedRigs;
          wheelRadius = loadedRigs[0].radius;
        }

        onStatus("ready");
        setCarReady(true);
      },
      undefined,
      () => {
        onStatus("fallback");
      },
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

      builtInLights?.updateBlinkers(time);

      const p = currentProgress;

      // ─── STAGE PROGRESS & CSS ENGINE METRICS ──────────────────────────────
      const ignite = smoothstep(0, 0.045, p);
      const reveal = smoothstep(0.03, 0.115, p);
      const turn = smoothstep(0.02, 0.115, p);
      const chase = smoothstep(0.09, 0.14, p);

      const drive = smoothstep(0.13, 0.84, p);
      const arrival = smoothstep(0.79, 0.98, p);
      const intro = 1 - smoothstep(0.02, 0.22, p);
      const cinematic = Math.max(intro, arrival);

      const isStage2Active = p >= 0.25 && p <= 0.46;
      if (inStage2Ref.current !== isStage2Active) {
        inStage2Ref.current = isStage2Active;
        setInStage2(isStage2Active);
      }

      // ─── DYNAMIC TRAFFIC SIGNALS (STOP LIGHTS) ───────────────────────────
      // Stage 1 Stop Light: Red on approach, switches to Green once stopped/cleared
      if (p < 0.22) {
        envHandles.stage1Signal.setSignal("red");
      } else {
        envHandles.stage1Signal.setSignal("green");
      }

      // Stage 4 Stop Light: Red at safe stop viewpoint
      if (p >= 0.68 && p <= 0.86) {
        envHandles.stage4Signal.setSignal("red");
      } else {
        envHandles.stage4Signal.setSignal("green");
      }

      // ─── 1. SMOOTH CONTINUOUS CAR POSITIONING ────────────────────────────
      let carX = 0;
      let carZ = 3.8;
      let carRotY = 0;
      let isBraking = false;
      let isBlinkingRight = false;
      let steerAngle = 0;

      if (p < 0.14) {
        // Stage 0: Showroom Hero Angle turning to forward
        carZ = 3.8;
        carX = 0;
        carRotY = THREE.MathUtils.lerp(SHOWROOM_ANGLE, 0, turn);
      } else if (p < 0.30) {
        // Stage 1: Master the Signals (Red Light Safe Stop)
        const s1 = (p - 0.14) / 0.16;
        if (s1 < 0.5) {
          const sub = s1 / 0.5;
          carZ = THREE.MathUtils.lerp(3.8, -13.8, smoothstep(0, 1, sub));
          if (sub > 0.65) isBraking = true;
        } else {
          const sub = (s1 - 0.5) / 0.5;
          carZ = THREE.MathUtils.lerp(-13.8, -19.5, smoothstep(0, 1, sub));
        }
        carX = 0;
        carRotY = 0;
      } else if (p < 0.50) {
        // Stage 2: Build Real Control (PDC Slalom & Right Turn)
        const s2 = (p - 0.30) / 0.20;
        isBlinkingRight = true;
        const steerT = smoothstep(0, 0.85, s2);
        carX = THREE.MathUtils.lerp(0, 2.8, steerT);
        carZ = THREE.MathUtils.lerp(-19.5, -36.0, s2);
        steerAngle = Math.sin(steerT * Math.PI) * 0.35;
        carRotY = -Math.sin(steerT * Math.PI * 0.75) * 0.2;
      } else if (p < 0.70) {
        // Stage 3: Move With Confidence (Highway Sweep)
        const s3 = (p - 0.50) / 0.20;
        carX = THREE.MathUtils.lerp(2.8, 1.2, smoothstep(0, 1, s3));
        carZ = THREE.MathUtils.lerp(-36.0, -52.0, s3);
        carRotY = Math.sin(s3 * Math.PI) * 0.08;
      } else if (p < 0.86) {
        // Stage 4: Why TL Mabuhay (Red Light Safe Stop)
        carX = 1.2;
        carZ = -52.0;
        carRotY = 0;
        isBraking = true;
      } else {
        // Stage 5: Your Destination (45° Angle Parking)
        const s5 = (p - 0.86) / 0.14;
        isBlinkingRight = true;
        const parkT = smoothstep(0, 0.85, s5);
        carX = THREE.MathUtils.lerp(1.2, 5.2, parkT);
        carZ = THREE.MathUtils.lerp(-52.0, -73.2, s5);
        carRotY = THREE.MathUtils.lerp(0, -Math.PI / 4, parkT);
        if (s5 > 0.7) isBraking = true;
      }

      builtInLights?.setBrakes(isBraking);
      builtInLights?.setBlinkers(isBlinkingRight, "right");

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

      carAnchor.position.set(carX, 0.04 + engineYOffset, carZ);
      carAnchor.rotation.y = carRotY;
      carAnchor.rotation.z = engineZRot;

      // ─── 2. DYNAMIC CAMERA: INTRO ZOOM-IN / ZOOM-OUT TO CHASE ────────────
      if (p < 0.16) {
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

        const chasePos = new THREE.Vector3(carX + pointer.x * 0.12, 5.2, carZ + 9.8);
        waypointPos.lerp(chasePos, chase);
        targetCamera.copy(waypointPos);

        waypointLook.set(0, 0.62, carZ + 1.1);
        const heroLook = new THREE.Vector3(0, 0.75, carZ);
        waypointLook.lerp(heroLook, reveal);
        const chaseLook = new THREE.Vector3(carX, 0.5, carZ - 4.0);
        waypointLook.lerp(chaseLook, chase);
        lookAt.copy(waypointLook);
      } else if (p < 0.70) {
        targetCamera.set(carX + pointer.x * 0.16, 4.8, carZ + 9.4);
        lookAt.set(carX, 0.65, carZ - 3.8);
      } else if (p < 0.84) {
        const povT = smoothstep(0.70, 0.78, p);
        const chasePos = new THREE.Vector3(carX + pointer.x * 0.16, 4.8, carZ + 9.4);
        const driverSeatPos = new THREE.Vector3(carX - 0.35, 1.15, carZ - 0.1);
        targetCamera.lerpVectors(chasePos, driverSeatPos, povT);

        const forwardLook = new THREE.Vector3(carX, 0.65, carZ - 3.8);
        const billboardLook = new THREE.Vector3(-7.5, 5.2, -55.0);
        lookAt.lerpVectors(forwardLook, billboardLook, povT);
      } else {
        const s5T = smoothstep(0.84, 0.92, p);
        const driverSeatPos = new THREE.Vector3(carX - 0.35, 1.15, carZ - 0.1);
        const billboardLook = new THREE.Vector3(-7.5, 5.2, -55.0);

        const exteriorCam = new THREE.Vector3(8.5, 4.0, -66.5);
        const exteriorLook = new THREE.Vector3(5.5, 0.8, -74.0);

        targetCamera.lerpVectors(driverSeatPos, exteriorCam, s5T);
        lookAt.lerpVectors(billboardLook, exteriorLook, s5T);
      }

      camera.position.lerp(targetCamera, reduceMotion ? 1 : 0.085);
      camera.lookAt(lookAt);

      // ─── 3. WHEELS ROTATION & STEERING ───────────────────────────────────
      const travelDistance = 3.8 - carZ;
      const baseRollAngle =
        wheelRadius > 0 ? travelDistance / wheelRadius : 0;

      const turnDerivative = Math.sin(turn * Math.PI);
      const introSteer = turn < 0.99 ? turnDerivative * 0.28 : 0;
      const effectiveSteer = p < 0.14 ? introSteer : steerAngle;

      wheelRigs.forEach((rig) => {
        const radius = rig.radius || wheelRadius;
        const roll = radius > 0 ? travelDistance / radius : baseRollAngle;

        if (rig.rollAxis === "z") {
          rig.rollPivot.rotation.z = -roll;
        } else {
          rig.rollPivot.rotation.x = roll;
        }

        if (rig.steerPivot) {
          rig.steerPivot.rotation.y = effectiveSteer;
        }
      });

      const effectiveIgnite = Math.max(
        ignite,
        isFired ? 1 : isRunning ? 0.75 : isCranking ? 0.3 : 0,
      );
      hemi.intensity = THREE.MathUtils.lerp(0.5, 2.3, effectiveIgnite);
      key.intensity = THREE.MathUtils.lerp(0.8, 4.2, effectiveIgnite);

      builtInLights?.setHeadlights(
        THREE.MathUtils.lerp(0.12, isFired ? 4.5 : 2.2, effectiveIgnite),
      );

      horizonMaterial.opacity = THREE.MathUtils.lerp(0.08, 0.95, cinematic);
      const igniteFlare = ignite * (1 - reveal);
      goldLight.intensity = THREE.MathUtils.lerp(
        4,
        isFired ? 48 : 34,
        Math.max(cinematic, isFired ? 1 : igniteFlare),
      );

      experience.style.setProperty("--drive", p.toFixed(4));
      experience.style.setProperty("--route", drive.toFixed(4));
      experience.style.setProperty("--arrival", arrival.toFixed(4));
      experience.style.setProperty("--intro", intro.toFixed(4));
      experience.style.setProperty("--cinematic", cinematic.toFixed(4));
      experience.style.setProperty("--ignite", ignite.toFixed(4));
      experience.style.setProperty("--reveal", reveal.toFixed(4));
      experience.style.setProperty("--turn", turn.toFixed(4));

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
      journeyAudio.stopBlinkerSound();
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

      {/* Stage 2 Interactive Steering HUD Overlay */}
      <InteractiveSteerHud
        visible={inStage2}
        steered={steeredRight}
        wrongAttempt={wrongAttempt}
        autoDemonstrating={autoDemonstrating}
        onSteerRight={handleSteerRight}
        onWrongSteer={handleWrongSteer}
      />

      {/* Engine FX overlay */}
      <div
        className={`engine-overlay engine-phase--${enginePhase}`}
        aria-hidden="true"
      >
        {rpm > 0 && (
          <div className={`scene-rpm-gauge ${rpm > 2400 ? "is-redline" : ""}`}>
            <div className="scene-rpm-dial">
              <svg viewBox="0 0 140 85" fill="none">
                <path
                  d="M 15 75 A 55 55 0 0 1 125 75"
                  stroke="rgba(255,255,255,0.09)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M 98 28 A 55 55 0 0 1 125 75"
                  stroke="rgba(255,60,60,0.28)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M 15 75 A 55 55 0 0 1 125 75"
                  className="rpm-fill-arc"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="188"
                  strokeDashoffset={188 - 188 * rpmPercent}
                />
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
