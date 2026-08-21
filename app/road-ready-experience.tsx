"use client";

import { useCallback, useRef, useState } from "react";
import { CarCanvas } from "./components/3d/car-canvas";
import type { CarStatus } from "./components/3d/types";
import { FinaleSection } from "./components/narrative/finale-section";
import { IgnitionSection } from "./components/narrative/ignition-section";
import {
  CourseChaptersSection,
  JourneyIntroSection,
} from "./components/narrative/journey-sections";
import { SiteFooter } from "./components/navigation/site-footer";
import { SiteHeader } from "./components/navigation/site-header";
import { LogoIntro } from "./components/ui/logo-intro";

export default function RoadReadyExperience() {
  const experienceRef = useRef<HTMLDivElement>(null);
  const [carStatus, setCarStatus] = useState<CarStatus>("loading");
  const [introGone, setIntroGone] = useState(false);

  const handleStatus = useCallback((status: CarStatus) => {
    setCarStatus(status);
  }, []);

  const handleIntroGone = useCallback(() => {
    setIntroGone(true);
  }, []);

  return (
    <div className="page-shell">
      <LogoIntro sceneReady={carStatus === "ready"} onGone={handleIntroGone} />

      <a className="skip-link" href="#journey">
        Skip to the journey
      </a>

      <SiteHeader />

      <main id="top">
        <div className="drive-experience" ref={experienceRef}>
          <div className="visual-shell" aria-hidden="true">
            <div className="visual-stage">
              <div className="scene-sky" />
              <div className="scene-grid" />
              <div className="scene-sun" />
              <CarCanvas
                experienceRef={experienceRef}
                onStatus={handleStatus}
                introGone={introGone}
              />
              <div className="ignition-flare" />
              <div className="scene-vignette" />
              <div className="route-meter">
                <span>START</span>
                <div className="route-meter__track">
                  <i />
                </div>
                <span>READY</span>
              </div>
              <div className="telemetry">
                <span>ROUTE</span>
                <strong>TL—001</strong>
                <i />
                <span>
                  {carStatus === "loading"
                    ? "LOADING CAR"
                    : carStatus === "ready"
                      ? "3D READY"
                      : "SAFE MODE"}
                </span>
              </div>
            </div>
          </div>

          <IgnitionSection />
          <JourneyIntroSection />
          <CourseChaptersSection />
          <FinaleSection />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
