import { SITE } from "../../constants/site";
import { ArrowIcon } from "../ui/icons";

export function FinaleSection() {
  return (
    <section
      className="hero finale-section narrative-panel"
      id="arrival"
      aria-labelledby="hero-title"
    >
      <div className="hero-copy">
        <p className="eyebrow">
          <span /> {SITE.brand.fullName}
        </p>
        <h2 id="hero-title">
          <span>ROAD TO</span>
          <em>READY.</em>
        </h2>
        <p className="final-motto">{SITE.brand.tagline}.</p>
        <div className="hero-actions">
          <a className="primary-button" href={SITE.links.enroll}>
            <span className="button-car">●</span>
            Start driving safer
            <ArrowIcon />
          </a>
          <a className="text-link" href={SITE.links.branches}>
            Find a branch <ArrowIcon />
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
