import { SITE } from "../../constants/site";
import { ArrowIcon } from "../ui/icons";

export function JourneyIntroSection() {
  return (
    <section
      className="journey-intro narrative-panel"
      id="journey"
      aria-labelledby="journey-title"
    >
      <div className="section-kicker">
        <span>YOUR ROAD TO READY</span>
        <b>01—05</b>
      </div>
      <h2 id="journey-title">
        Five milestones.
        <br />
        <em>One licensed defensive driver.</em>
      </h2>
    </section>
  );
}

export function CourseChaptersSection() {
  return (
    <>
      {/* ─── STAGE 1: KNOW EVERY SIGN ──────────────────────────────────────── */}
      <section
        className="chapter chapter-left narrative-panel"
        id="know-every-sign"
        aria-labelledby="theory-title"
      >
        <article className="chapter-card">
          <span className="chapter-number">01</span>
          <p>TDC · Theoretical Driving Course</p>
          <h2 id="theory-title">Master the Signals.</h2>
          <p className="chapter-desc">
            Master intersection stop lights, stop line discipline, and
            traffic signals before taking the wheel.
          </p>
          <div className="chapter-meta">
            <span>{SITE.courses.theoretical.code}</span>
            <span>{SITE.courses.theoretical.duration}</span>
            <span>{SITE.courses.theoretical.price}</span>
          </div>
          <a href={SITE.links.enrollTheoretical}>
            Explore theoretical course <ArrowIcon />
          </a>
        </article>
      </section>

      {/* ─── STAGE 2: BUILD REAL CONTROL ───────────────────────────────────── */}
      <section
        className="chapter chapter-right narrative-panel"
        id="build-real-control"
        aria-labelledby="practice-title"
      >
        <article className="chapter-card">
          <span className="chapter-number">02</span>
          <p>PDC · Practical Driving Course</p>
          <h2 id="practice-title">Build Real Control.</h2>
          <p className="chapter-desc">
            Develop steering muscle memory, slalom maneuvering, and smooth
            fork turn-ins with certified professional instructors.
          </p>
          <div className="chapter-meta">
            <span>{SITE.courses.practical.code}</span>
            <span>{SITE.courses.practical.duration}</span>
            <span>{SITE.courses.practical.price}</span>
          </div>
          <a href={SITE.links.enrollPractical}>
            Explore practical course <ArrowIcon />
          </a>
        </article>
      </section>

      {/* ─── STAGE 3: MOVE WITH CONFIDENCE ─────────────────────────────────── */}
      <section
        className="chapter chapter-left narrative-panel"
        id="move-with-confidence"
        aria-labelledby="confidence-title"
      >
        <article className="chapter-card chapter-card--gold">
          <span className="chapter-number">03</span>
          <p>Highway & Night Mastery</p>
          <h2 id="confidence-title">Move With Confidence.</h2>
          <p className="chapter-desc">
            Experience smooth highway cruising, corner banking, and nocturnal
            road awareness under illuminated streetlights.
          </p>
          <div className="quality-list">
            <span>Awareness</span>
            <span>Discipline</span>
            <span>Control</span>
          </div>
          <a href={SITE.links.branches}>
            View training tracks <ArrowIcon />
          </a>
        </article>
      </section>

      {/* ─── STAGE 4: WHY TL MABUHAY ──────────────────────────────────────── */}
      <section
        className="chapter chapter-right narrative-panel"
        id="why-tl-mabuhay"
        aria-labelledby="why-title"
      >
        <article className="chapter-card chapter-card--navy">
          <span className="chapter-number">04</span>
          <p>Safe Driving Standards</p>
          <h2 id="why-title">Why TL Mabuhay.</h2>
          <p className="chapter-desc">
            Zero distracted driving. Safe stops at every red signal, certified
            curriculum, and the Philippines&apos; most trusted academy network.
          </p>
          <div className="pillar-metrics">
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
          <a href={SITE.links.home} target="_blank" rel="noopener noreferrer">
            Visit official academy portal <ArrowIcon />
          </a>
        </article>
      </section>
    </>
  );
}
