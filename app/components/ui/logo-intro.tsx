"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface LogoIntroProps {
  sceneReady: boolean;
  onGone?: () => void;
}

function animateIntroLogo(event: React.SyntheticEvent<HTMLObjectElement>) {
  const logoDocument = event.currentTarget.contentDocument;
  if (!logoDocument) return;
  event.currentTarget.previousElementSibling?.classList.add("is-hidden");

  const animatePart = (
    selector: string,
    keyframes: Keyframe[],
    delay: number,
    duration = 760,
  ) => {
    const part = logoDocument.querySelector<SVGElement>(selector);
    if (!part) return;
    part.style.transformBox = "fill-box";
    part.style.transformOrigin = "center";
    part.animate(keyframes, {
      delay,
      duration,
      easing: "cubic-bezier(.16, 1, .3, 1)",
      fill: "both",
    });
  };

  animatePart(
    "#outer-rim",
    [
      { opacity: 0, transform: "scale(.58) rotate(-68deg)" },
      { opacity: 1, transform: "scale(1.06) rotate(5deg)", offset: 0.76 },
      { opacity: 1, transform: "scale(1) rotate(0deg)" },
    ],
    110,
    920,
  );
  animatePart(
    "#brand-ring",
    [
      { opacity: 0, transform: "scale(.7) rotate(54deg)" },
      { opacity: 1, transform: "scale(1) rotate(0deg)" },
    ],
    260,
    820,
  );
  animatePart(
    "#core",
    [
      { opacity: 0, transform: "scale(.38)" },
      { opacity: 1, transform: "scale(1.08)", offset: 0.74 },
      { opacity: 1, transform: "scale(1)" },
    ],
    410,
    760,
  );
  animatePart(
    "#driver",
    [
      { opacity: 0, transform: "translateY(30px) scale(.88)" },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ],
    590,
    650,
  );
  animatePart(
    "#year",
    [
      { opacity: 0, transform: "translateY(18px) scale(.8)" },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ],
    760,
    520,
  );
}

export function LogoIntro({ sceneReady, onGone }: LogoIntroProps) {
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(true);
  const leavingRef = useRef(false);
  const timers = useRef<number[]>([]);

  const beginExit = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    timers.current.push(window.setTimeout(() => setVisible(false), 920));
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    timers.current.push(
      window.setTimeout(
        () => setMinimumElapsed(true),
        reducedMotion ? 260 : 2350,
      ),
      window.setTimeout(beginExit, reducedMotion ? 850 : 5200),
    );
    return () => timers.current.forEach((timer) => window.clearTimeout(timer));
  }, [beginExit]);

  useEffect(() => {
    if (minimumElapsed && sceneReady) beginExit();
  }, [beginExit, minimumElapsed, sceneReady]);

  const onGoneRef = useRef(onGone);
  onGoneRef.current = onGone;

  useEffect(() => {
    if (!visible) {
      onGoneRef.current?.();
      return;
    }
    document.documentElement.classList.add("intro-is-active");
    return () => {
      document.documentElement.classList.remove("intro-is-active");
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`logo-intro${sceneReady ? " is-ready" : ""}${leaving ? " is-leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={
        sceneReady
          ? "TL Mabuhay experience ready"
          : "Preparing the TL Mabuhay driving experience"
      }
    >
      <div className="intro-grid" aria-hidden="true" />
      <div className="intro-speed-panels" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="intro-road-stripe" aria-hidden="true">
        <i />
      </div>

      <div className="intro-emblem-stage" aria-hidden="true">
        <div className="intro-orbit intro-orbit--outer">
          <i />
          <i />
          <i />
        </div>
        <div className="intro-orbit intro-orbit--inner">
          <i />
        </div>
        <div className="intro-emblem-fallback" />
        <object
          className="intro-emblem"
          data="/assets/tl-mabuhay-logo-layered.svg"
          type="image/svg+xml"
          tabIndex={-1}
          onLoad={animateIntroLogo}
        />
        <div className="intro-emblem-flare" />
      </div>

      <div className="intro-wordmark" aria-hidden="true">
        <span>TL MABUHAY</span>
        <strong>Your Defensive Driving Advocate</strong>
      </div>

      <div className="intro-loading" aria-hidden="true">
        <div>
          <i />
        </div>
        <span>{sceneReady ? "ROAD READY" : "PREPARING 3D DRIVE"}</span>
      </div>
      <p className="intro-route" aria-hidden="true">
        <span>ROUTE</span> TL—001 <i /> 2017—2026
      </p>

      <div
        className="intro-exit-wipe intro-exit-wipe--gold"
        aria-hidden="true"
      />
      <div
        className="intro-exit-wipe intro-exit-wipe--ice"
        aria-hidden="true"
      />
    </div>
  );
}
