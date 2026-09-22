import type { ResumeBundle } from "./types";

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderResume(root: HTMLElement, bundle: ResumeBundle): void {
  const { config, profile, portfolio } = bundle;
  const name = profile.name || config.name;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle: profile.headline,
    description: profile.about,
    email: config.email,
    address: profile.location,
    url: config.sources.portfolio,
    sameAs: portfolio.socials.map((s) => s.url),
    knowsAbout: config.coreSkills,
  };

  root.innerHTML = `
    <div class="grain" aria-hidden="true"></div>
    <svg class="svg-filters" aria-hidden="true" focusable="false">
      <filter id="paper" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.76  0 0 0 0 0.73  0 0 0 0 0.68  0 0 0 0.18 0" in="n"/>
      </filter>
    </svg>

    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="${esc(config.sources.portfolio)}" rel="noopener">
          <img class="brand-logo" src="/assets/images/logo.png" alt="${esc(config.brand)}" width="220" height="70">
          <span class="brand-mark">Resume</span>
        </a>
        <nav class="site-nav" aria-label="Primary">
          <a class="nav-link" href="${esc(config.sources.portfolio)}" rel="noopener">Portfolio</a>
          <a class="nav-link" href="${esc(config.sources.blog)}" rel="noopener">Blog</a>
          <a class="nav-link" href="${esc(config.sources.github)}" rel="noopener">Open-Source</a>
          <button class="btn export-btn" type="button" id="export-pdf">Export PDF</button>
        </nav>
      </div>
    </header>

    <main class="site-main">
      <div class="inner resume">
        <section class="hero reveal" data-reveal="fade-up">
          <div class="hero-portrait">
            <div class="portrait-frame">
              <img src="/assets/images/pfp.jpg" alt="${esc(name)}" width="420" height="420">
            </div>
          </div>
          <div class="hero-copy">
            <p class="eyebrow">${esc(config.brand)}</p>
            <h1 class="hero-title">${esc(name)}</h1>
            <p class="lead">${esc(profile.headline)}</p>
            <p class="meta-line">${esc(profile.location)} · ${esc(config.email)} · Discord ${esc(config.discord)}</p>
            <p class="tagline">${esc(config.tagline)}</p>
          </div>
        </section>

        <section class="resume-section reveal" data-reveal="fade-up">
          <h2>About</h2>
          <p class="about-text">${esc(profile.about)}</p>
        </section>

        <section class="resume-section reveal" data-reveal="fade-up">
          <h2>Core Skills</h2>
          <ul class="skill-list">
            ${config.coreSkills.map((s) => `<li>${esc(s)}</li>`).join("")}
          </ul>
        </section>

        <section class="resume-section reveal" data-reveal="fade-up">
          <h2>Experience</h2>
          <ol class="experience-list">
            ${profile.experience
              .map(
                (job) => `
              <li class="experience-item">
                <div class="experience-head">
                  <h3>${esc(job.title)}</h3>
                  <p class="company">${esc(job.company)}</p>
                  <p class="dates"><time>${esc(job.start)}</time> – <time>${esc(job.end)}</time></p>
                </div>
                ${job.description ? `<p>${esc(job.description)}</p>` : ""}
              </li>`,
              )
              .join("")}
          </ol>
        </section>

        <section class="resume-section reveal" data-reveal="fade-up">
          <h2>Selected Projects</h2>
          <ul class="project-list">
            ${portfolio.projects
              .map(
                (p) => `
              <li class="project-item">
                <div class="project-head">
                  <h3>${p.url ? `<a href="${esc(p.url)}" rel="noopener">${esc(p.name)}</a>` : esc(p.name)}</h3>
                  <p class="project-meta">${esc(p.contributions)} · ${esc(p.timeline)}${
                    p.peakCcu && p.peakCcu !== "N/A"
                      ? ` · Peak ${esc(p.peakCcu)} CCU`
                      : ""
                  }</p>
                </div>
                <p class="project-point">• ${esc(p.summary)}</p>
              </li>`,
              )
              .join("")}
          </ul>
        </section>
      </div>
    </main>

    <footer class="site-footer reveal" data-reveal="fade-up">
      <ul class="social" aria-label="Elsewhere">
        ${portfolio.socials
          .map(
            (s) => `
          <li>
            <a href="${esc(s.url)}" rel="me noopener" title="${esc(s.label)}">
              <span>${esc(s.label)}</span>
            </a>
          </li>`,
          )
          .join("")}
      </ul>
      <p class="footer-note">Use the above connections to learn more about me. Portfolio lives on <a href="${esc(config.sources.portfolio)}">igottic.com</a>.</p>
    </footer>

    <script type="application/ld+json">${JSON.stringify(schema)}</script>
  `;
}

export function renderLoading(root: HTMLElement): void {
  root.innerHTML = `
    <div class="grain" aria-hidden="true"></div>
    <main class="site-main">
      <div class="inner loading-state">
        <p class="eyebrow">iGottic</p>
        <h1 class="hero-title">Loading resume…</h1>
      </div>
    </main>
  `;
}

export function renderError(root: HTMLElement, message: string): void {
  root.innerHTML = `
    <div class="grain" aria-hidden="true"></div>
    <main class="site-main">
      <div class="inner loading-state">
        <p class="eyebrow">iGottic</p>
        <h1 class="hero-title">Couldn’t load resume</h1>
        <p class="lead">${esc(message)}</p>
        <button class="btn" type="button" onclick="location.reload()">Retry</button>
      </div>
    </main>
  `;
}
