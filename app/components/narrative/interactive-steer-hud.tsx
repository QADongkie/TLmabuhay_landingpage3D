"use client";

import React, { useEffect, useState } from "react";

interface InteractiveSteerHudProps {
  visible: boolean;
  steered: boolean;
  wrongAttempt: boolean;
  autoDemonstrating: boolean;
  onSteerRight: () => void;
  onWrongSteer: () => void;
}

export function InteractiveSteerHud({
  visible,
  steered,
  wrongAttempt,
  autoDemonstrating,
  onSteerRight,
  onWrongSteer,
}: InteractiveSteerHudProps) {
  const [secondsLeft, setSecondsLeft] = useState(3.5);

  useEffect(() => {
    if (!visible || steered) {
      setSecondsLeft(3.5);
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [visible, steered]);

  // Handle global keyboard inputs when in Stage 2
  useEffect(() => {
    if (!visible || steered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        onSteerRight();
      } else if (
        e.key === "ArrowLeft" ||
        e.key === "a" ||
        e.key === "A" ||
        e.key === "ArrowUp" ||
        e.key === "w"
      ) {
        onWrongSteer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, steered, onSteerRight, onWrongSteer]);

  if (!visible) return null;

  return (
    <div
      className={`interactive-steer-hud ${steered ? "is-steered" : ""} ${
        wrongAttempt ? "is-wrong" : ""
      }`}
      role="region"
      aria-label="Interactive Driving Control"
    >
      <div className="steer-card">
        <div className="steer-header">
          <span className="steer-badge">PDC DRILL</span>
          <span className="steer-title">Weave through cones & turn right</span>
        </div>

        {wrongAttempt && !steered && (
          <div className="steer-feedback" role="alert">
            <span className="feedback-icon">⚠️</span>
            <span>Check the sign — turn right!</span>
          </div>
        )}

        {steered ? (
          <div className="steer-success">
            <span className="success-icon">✓</span>
            <span>Smooth control! Right turn executed.</span>
          </div>
        ) : (
          <div className="steer-controls">
            <div className="key-hints">
              <span className="key-pill">→</span>
              <span className="key-divider">or</span>
              <span className="key-pill">D</span>
              <span className="key-divider">or</span>
              <button
                type="button"
                className="touch-steer-btn"
                onClick={onSteerRight}
              >
                Steer Right ➔
              </button>
            </div>

            <div className="auto-demo-track" title="Instructor auto-pilot timer">
              <div
                className="auto-demo-fill"
                style={{ width: `${(secondsLeft / 3.5) * 100}%` }}
              />
              <span className="auto-demo-label">
                {autoDemonstrating
                  ? "Instructor demonstrating..."
                  : `Auto-demonstrating in ${secondsLeft.toFixed(1)}s`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
