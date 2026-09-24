# Mia Gobble — Resume

Static resume site styled after [blog.igottic.com](https://blog.igottic.com) and [igottic.com](https://igottic.com).

All content is edited manually in JSON files — nothing is fetched from LinkedIn or the portfolio at runtime.

## Where to edit

| What | File |
| --- | --- |
| Tagline, core skills, email, Discord, nav links, PDF options | [`public/config.json`](public/config.json) |
| Name, headline, location, about, experience | [`public/data/linkedin.json`](public/data/linkedin.json) |
| Projects + social links | [`public/data/portfolio.json`](public/data/portfolio.json) |

## Develop

```bash
npm install
npm run dev
```

## Export PDF

Use **Export PDF**. The file is selectable text optimized for ATS systems:

- Single-column layout with standard Helvetica fonts (no decorative images)
- Plain labeled contact fields (email, LinkedIn, portfolio, Discord, location)
- Standard section headings: Professional Summary, Skills, Work Experience, Projects
- ASCII hyphens and `*` bullets; role-first experience (title, company, dates)
- PDF metadata includes name, headline, and skill keywords


## Build / deploy

GitHub Pages builds automatically on push to `main` via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

Locally:

```bash
npm run build
```

Serve the `dist/` folder to preview.
