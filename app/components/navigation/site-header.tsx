"use client";

import { useState } from "react";
import { SITE } from "../../constants/site";
import { ArrowIcon, MenuIcon } from "../ui/icons";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="TL Mabuhay home">
        <span className="brand-mark">
          <span>TL</span>
        </span>
        <span className="brand-type">
          <strong>TL MABUHAY</strong>
          <small>DRIVING LESSON ACADEMY</small>
        </span>
      </a>

      <nav
        className={menuOpen ? "site-nav is-open" : "site-nav"}
        aria-label="Primary navigation"
      >
        <a href="#journey" onClick={() => setMenuOpen(false)}>
          Journey
        </a>
        <a href="#courses" onClick={() => setMenuOpen(false)}>
          Courses
        </a>
        <a href="#confidence" onClick={() => setMenuOpen(false)}>
          Why TL
        </a>
        <a href={SITE.links.branches}>Branches</a>
      </nav>

      <a className="header-cta" href={SITE.links.enroll}>
        Enroll <ArrowIcon />
      </a>
      <button
        className="menu-button"
        type="button"
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <MenuIcon />
      </button>
    </header>
  );
}
