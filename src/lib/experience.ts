import type { ExperienceItem } from "./types";

const COMPANY_LOGOS: Record<string, string> = {
  "Tencell Studios": "/assets/images/companies/tencellstudios.png",
  "Oxomo Games": "/assets/images/companies/oxomogames.png",
  Meta: "/assets/images/companies/meta.png",
  "Iconic Gaming": "/assets/images/companies/iconicgaming.png",
  Roblox: "/assets/images/companies/roblox.png",
  Roforco: "/assets/images/companies/roforco.jpg",
  "Games Unite": "/assets/images/companies/gamesunite.jpg",
};

export interface CompanyGroup {
  company: string;
  logo?: string;
  duration: string;
  roles: ExperienceItem[];
}

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function parseMonthYear(value: string): { year: number; month: number } | null {
  if (/present/i.test(value)) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  const match = value.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return null;
  const month = MONTHS[match[1].slice(0, 3).toLowerCase()];
  if (!month) return null;
  return { year: Number(match[2]), month };
}

function toMonths(point: { year: number; month: number }): number {
  return point.year * 12 + point.month;
}

export function formatDuration(roles: ExperienceItem[]): string {
  const starts = roles
    .map((r) => parseMonthYear(r.start))
    .filter((p): p is { year: number; month: number } => !!p);
  const ends = roles
    .map((r) => parseMonthYear(r.end))
    .filter((p): p is { year: number; month: number } => !!p);
  if (!starts.length || !ends.length) return "";

  const start = Math.min(...starts.map(toMonths));
  const end = Math.max(...ends.map(toMonths));
  const span = Math.max(1, end - start + 1);
  const years = Math.floor(span / 12);
  const months = span % 12;
  if (years && months) return `${years} yr${years === 1 ? "" : "s"} ${months} mo${months === 1 ? "" : "s"}`;
  if (years) return `${years} yr${years === 1 ? "" : "s"}`;
  return `${months || 1} mo${months === 1 ? "" : "s"}`;
}

export function companyLogo(company: string): string | undefined {
  return COMPANY_LOGOS[company];
}

/** Group consecutive roles by company, preserving LinkedIn order. */
export function groupExperience(items: ExperienceItem[]): CompanyGroup[] {
  const groups: CompanyGroup[] = [];
  for (const role of items) {
    const last = groups[groups.length - 1];
    if (last && last.company === role.company) {
      last.roles.push(role);
    } else {
      groups.push({
        company: role.company,
        logo: companyLogo(role.company),
        duration: "",
        roles: [role],
      });
    }
  }
  for (const group of groups) {
    group.duration = formatDuration(group.roles);
  }
  return groups;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Turn plain text with \\n into HTML paragraphs / line breaks. */
export function formatRichText(text: string): string {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const html = escapeHtml(block).replace(/\n/g, "<br>");
      return `<p>${html}</p>`;
    })
    .join("");
}

/** Split text into paragraphs for PDF wrapping. */
export function splitParagraphs(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const blocks = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return blocks.flatMap((block) => {
    if (/^- /.test(block) || block.includes("\n- ")) {
      return block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    }
    return [block.replace(/\n/g, " ").trim()];
  });
}
