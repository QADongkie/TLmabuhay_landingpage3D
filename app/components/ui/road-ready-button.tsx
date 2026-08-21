"use client";

import { useEffect, useRef, useState } from "react";
import { SITE } from "../../constants/site";
import { ArrowIcon } from "./icons";

export function RoadReadyButton() {
  const [phase, setPhase] = useState<"idle" | "driving" | "ready">("idle");
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => timers.current.forEach((timer) => window.clearTimeout(timer)),
    [],
  );

  const startJourney = () => {
    if (phase !== "idle") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.location.assign(SITE.links.enroll);
      return;
    }

    setPhase("driving");
    timers.current.push(
      window.setTimeout(() => setPhase("ready"), 1350),
      window.setTimeout(
        () => window.location.assign(SITE.links.enroll),
        2250,
      ),
    );
  };

  return (
    <button
      type="button"
      className={`road-ready-button is-${phase}`}
      onClick={startJourney}
      aria-label={
        phase === "idle"
          ? "Start your driving journey"
          : phase === "driving"
            ? "Starting your journey"
            : "Road ready. Opening enrollment."
      }
    >
      <span className="road-ready-button__idle">
        Start your journey <ArrowIcon />
      </span>
      <span className="road-ready-button__track" aria-hidden="true">
        <i className="mini-road" />
        <span className="mini-checkpoint cp-one" />
        <span className="mini-checkpoint cp-two" />
        <span className="mini-checkpoint cp-three" />
        <span className="mini-sedan"><i /><b /></span>
      </span>
      <span className="road-ready-button__success" aria-hidden="true">
        Road ready <span>✓</span>
      </span>
    </button>
  );
}
