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

Use **Export PDF**. The file is selectable text (not a screenshot), with human-readable pages for about, skills, experience, projects, and links, plus PDF metadata.

## Build / deploy

```bash
npm run build
```

Serve the `dist/` folder (GitHub Pages, Cloudflare Pages, Netlify, etc.).
