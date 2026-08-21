import { SITE } from "../../constants/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <a className="brand footer-brand" href="#top" aria-label="Back to top">
        <span className="brand-mark">
          <span>TL</span>
        </span>
        <span className="brand-type">
          <strong>TL MABUHAY</strong>
          <small>DRIVING LESSON ACADEMY</small>
        </span>
      </a>
      <nav aria-label="Footer navigation">
        <a href="#courses">Courses</a>
        <a href={SITE.links.branches}>Branches</a>
        <a href={SITE.links.rules}>Rules</a>
        <a href={SITE.links.enroll}>Enroll</a>
      </nav>
      <p>YOUR DEFENSIVE DRIVING ADVOCATE · 2026</p>
      <small>
        3D model by{" "}
        <a
          href="https://sketchfab.com/ddiaz-design"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ddiaz Design
        </a>{" "}
        · CC BY-NC-SA 4.0 · Concept use only
      </small>
    </footer>
  );
}
