import { SITE } from "../../constants/site";
import { ArrowIcon } from "../ui/icons";

export function FinaleSection() {
  return (
    <section
      className="hero finale-section narrative-panel"
      id="destination"
      aria-labelledby="hero-title"
    >
      <div className="hero-copy">
        <div className="section-kicker">
          <span>STAGE 05</span>
          <b>YOUR DESTINATION</b>
        </div>
        <p className="eyebrow">
          <span /> {SITE.brand.fullName}
        </p>
        <h2 id="hero-title">
          <span>YOUR DEFENSIVE</span>
          <em>DRIVING ADVOCATE.</em>
        </h2>
        <p className="final-motto">
          Master the road with safety, precision, and confidence.
        </p>
        <div className="hero-actions">
          <a className="primary-button" href={SITE.links.enroll}>
            <span className="button-car">●</span>
            Start Your Journey
            <ArrowIcon />
          </a>
          <a className="text-link" href={SITE.links.branches}>
            Find Nearest Branch <ArrowIcon />
          </a>
        </div>
      </div>

      <div className="hero-stats" aria-label="TL Mabuhay highlights">
        <div>
          <strong>{SITE.stats.branches}</strong>
          <span>{SITE.stats.branchesLabel}</span>
        </div>
        <div>
          <strong>{SITE.stats.drivers}</strong>
          <span>{SITE.stats.driversLabel}</span>
        </div>
        <div>
          <strong>{SITE.stats.accreditation}</strong>
          <span>{SITE.stats.accreditationLabel}</span>
        </div>
      </div>
    </section>
  );
}
