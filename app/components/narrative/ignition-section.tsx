import { SITE } from "../../constants/site";
import { RoadReadyButton } from "../ui/road-ready-button";

const HEADLINE_WORDS = ["Your", "Defensive", "Driving", "Advocate"];

export function IgnitionSection() {
  return (
    <section
      className="ignition-section narrative-panel"
      aria-labelledby="ignition-title"
    >
      <div className="ignition-inner">
        <div className="ignition-copy">
          <div className="campaign-tag">
            <i /> Road to Ready
          </div>
          <h1 id="ignition-title" className="ignition-title">
            {HEADLINE_WORDS.map((word, index) => (
              <span key={word} style={{ "--i": index } as React.CSSProperties}>
                {word}
              </span>
            ))}
          </h1>
          <p className="ignition-sub">{SITE.brand.fullName}</p>
          <div className="ignition-actions">
            <RoadReadyButton />
            <a href="#journey">
              Explore the journey <span>↓</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
