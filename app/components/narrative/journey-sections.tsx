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
        <span>YOUR ROUTE</span>
        <b>01—03</b>
      </div>
      <h2 id="journey-title">
        Three turns.
        <br />
        <em>One confident driver.</em>
      </h2>
    </section>
  );
}

export function CourseChaptersSection() {
  return (
    <>
      <section
        className="chapter chapter-left narrative-panel"
        id="courses"
        aria-labelledby="theory-title"
      >
        <article className="chapter-card">
          <span className="chapter-number">01</span>
          <p>Learn</p>
          <h2 id="theory-title">Know every sign.</h2>
          <div className="chapter-meta">
            <span>{SITE.courses.theoretical.code}</span>
            <span>{SITE.courses.theoretical.duration}</span>
            <span>{SITE.courses.theoretical.price}</span>
          </div>
          <a href={SITE.links.enrollTheoretical}>
            See theory course <ArrowIcon />
          </a>
        </article>
      </section>

      <section
        className="chapter chapter-right narrative-panel"
        aria-labelledby="practice-title"
      >
        <article className="chapter-card">
          <span className="chapter-number">02</span>
          <p>Practice</p>
          <h2 id="practice-title">Build real control.</h2>
          <div className="chapter-meta">
            <span>{SITE.courses.practical.code}</span>
            <span>{SITE.courses.practical.duration}</span>
            <span>{SITE.courses.practical.price}</span>
          </div>
          <a href={SITE.links.enrollPractical}>
            See practical course <ArrowIcon />
          </a>
        </article>
      </section>

      <section
        className="chapter chapter-left narrative-panel"
        id="confidence"
        aria-labelledby="confidence-title"
      >
        <article className="chapter-card chapter-card--gold">
          <span className="chapter-number">03</span>
          <p>Drive</p>
          <h2 id="confidence-title">Move with confidence.</h2>
          <div className="quality-list">
            <span>Awareness</span>
            <span>Discipline</span>
            <span>Control</span>
          </div>
          <a href={SITE.links.branches}>
            Find your branch <ArrowIcon />
          </a>
        </article>
      </section>
    </>
  );
}
