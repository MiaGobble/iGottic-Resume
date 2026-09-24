import type { ResumeBundle } from "./types";
import {
  escapeHtml,
  formatRichText,
  groupExperience,
} from "./experience";

export function renderResume(root: HTMLElement, bundle: ResumeBundle): void {
  const { config, profile, portfolio } = bundle;
  const name = profile.name || config.name;
  const companies = groupExperience(profile.experience);

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

    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="${escapeHtml(config.sources.portfolio)}" rel="noopener">
          <img class="brand-logo" src="/assets/images/logo.png" alt="${escapeHtml(config.brand)}" width="220" height="70">
          <span class="brand-mark">Resume</span>
        </a>
        <nav class="site-nav" aria-label="Primary">
          <a class="nav-link" href="${escapeHtml(config.sources.portfolio)}" rel="noopener">Portfolio</a>
          <a class="nav-link" href="${escapeHtml(config.sources.blog)}" rel="noopener">Blog</a>
          <a class="nav-link" href="${escapeHtml(config.sources.github)}" rel="noopener">Open-Source</a>
          <button class="btn export-btn" type="button" id="export-pdf">Export PDF</button>
        </nav>
      </div>
    </header>

    <main class="site-main">
      <div class="inner resume">
        <section class="hero reveal" data-reveal="fade-up">
          <div class="hero-portrait">
            <div class="portrait-frame">
              <img src="/assets/images/pfp.jpg" alt="${escapeHtml(name)}" width="420" height="420">
            </div>
          </div>
          <div class="hero-copy">
            <h1 class="hero-title">${escapeHtml(name)}</h1>
            <p class="lead">${escapeHtml(profile.headline)}</p>
            <p class="meta-line">${escapeHtml(profile.location)} · Discord ${escapeHtml(config.discord)}</p>
            <p class="meta-line contact-line">
              <a href="mailto:${escapeHtml(config.email)}">${escapeHtml(config.email)}</a>
              ·
              <a href="${escapeHtml(config.sources.linkedin)}" rel="noopener">${escapeHtml(config.sources.linkedin.replace(/^https?:\/\//, ""))}</a>
            </p>
            <p class="tagline">${escapeHtml(config.tagline)}</p>
          </div>
        </section>

        <section class="resume-section reveal" data-reveal="fade-up">
          <h2>About</h2>
          <div class="rich-text about-text">${formatRichText(profile.about)}</div>
        </section>

        <section class="resume-section reveal" data-reveal="fade-up">
          <h2>Core Skills</h2>
          <ul class="skill-list">
            ${config.coreSkills.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
          </ul>
        </section>

        <section class="resume-section reveal" data-reveal="fade-up">
          <h2>Experience</h2>
          <ul class="company-list">
            ${companies
              .map((group) => {
                const multi = group.roles.length > 1;
                return `
              <li class="company-group${multi ? " is-multi" : ""}">
                <div class="company-header">
                  ${
                    group.logo
                      ? `<img class="company-logo" src="${escapeHtml(group.logo)}" alt="" width="48" height="48">`
                      : `<span class="company-logo company-logo-fallback" aria-hidden="true"></span>`
                  }
                  <div class="company-heading">
                    <h3 class="company-name">${escapeHtml(group.company)}</h3>
                    ${group.duration ? `<p class="company-duration">${escapeHtml(group.duration)}</p>` : ""}
                  </div>
                </div>
                <ol class="role-list">
                  ${group.roles
                    .map(
                      (job) => `
                    <li class="role-item">
                      <h4 class="role-title">${escapeHtml(job.title)}</h4>
                      <p class="dates"><time>${escapeHtml(job.start)}</time> – <time>${escapeHtml(job.end)}</time></p>
                      ${job.description ? `<div class="rich-text role-desc">${formatRichText(job.description)}</div>` : ""}
                    </li>`,
                    )
                    .join("")}
                </ol>
              </li>`;
              })
              .join("")}
          </ul>
        </section>

        <section class="resume-section reveal" data-reveal="fade-up">
          <h2>Selected Projects</h2>
          <ul class="project-list">
            ${portfolio.projects
              .map(
                (p) => `
              <li class="project-item">
                <div class="project-head">
                  <h3>${p.url ? `<a href="${escapeHtml(p.url)}" rel="noopener">${escapeHtml(p.name)}</a>` : escapeHtml(p.name)}</h3>
                  <p class="project-meta">${escapeHtml(p.contributions)} · ${escapeHtml(p.timeline)}${
                    p.peakCcu && p.peakCcu !== "N/A"
                      ? ` · Peak ${escapeHtml(p.peakCcu)} CCU`
                      : ""
                  }</p>
                </div>
                <p class="project-point">• ${escapeHtml(p.summary)}</p>
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
            <a href="${escapeHtml(s.url)}" rel="me noopener" title="${escapeHtml(s.label)}">
              <span>${escapeHtml(s.label)}</span>
            </a>
          </li>`,
          )
          .join("")}
      </ul>
      <p class="footer-note">Use the above connections to learn more about me. Portfolio lives on <a href="${escapeHtml(config.sources.portfolio)}">igottic.com</a>.</p>
    </footer>

    <script type="application/ld+json">${JSON.stringify(schema)}</script>
  `;
}

export function renderLoading(root: HTMLElement): void {
  root.innerHTML = `
    <div class="grain" aria-hidden="true"></div>
    <main class="site-main">
      <div class="inner loading-state">
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
        <h1 class="hero-title">Couldn’t load resume</h1>
        <p class="lead">${escapeHtml(message)}</p>
        <button class="btn" type="button" onclick="location.reload()">Retry</button>
      </div>
    </main>
  `;
}
