import { jsPDF } from "jspdf";
import type { ResumeBundle } from "./types";
import { splitParagraphs } from "./experience";

const PAGE_W = 215.9;
const PAGE_H = 279.4;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BODY = "helvetica";

/** Normalize fancy punctuation that breaks many ATS parsers. */
function atsText(value: string): string {
  return value
    .replace(/\u2013|\u2014|\u2212/g, "-")
    .replace(/\u2022|\u00B7|\u2023/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wrap(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const lines = doc.splitTextToSize(atsText(text), maxWidth) as string[];
  for (const line of lines) {
    if (y > PAGE_H - 16) {
      doc.addPage();
      y = MARGIN;
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

function ensureSpace(doc: jsPDF, y: number, need: number): number {
  if (y + need > PAGE_H - 14) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function wrapParagraphs(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  paragraphGap = 2,
): number {
  const paragraphs = splitParagraphs(text);
  for (let i = 0; i < paragraphs.length; i++) {
    let line = paragraphs[i];
    // Keep bullet markers ASCII-friendly for ATS extraction.
    if (/^- /.test(line)) line = `* ${line.slice(2)}`;
    else if (/^• /.test(line)) line = `* ${line.slice(2)}`;
    y = wrap(doc, line, x, y, maxWidth, lineHeight);
    if (i < paragraphs.length - 1) y += paragraphGap;
  }
  return y;
}

function sectionTitle(doc: jsPDF, label: string, y: number): number {
  y = ensureSpace(doc, y, 12);
  doc.setFont(BODY, "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(atsText(label).toUpperCase(), MARGIN, y);
  y += 2;
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.35);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  return y + 6;
}

function labeledLine(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
): number {
  doc.setFont(BODY, "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  const prefix = `${label}: `;
  doc.text(prefix, MARGIN, y);
  const prefixW = doc.getTextWidth(prefix);
  doc.setFont(BODY, "normal");
  return wrap(doc, value, MARGIN + prefixW, y, CONTENT_W - prefixW, 4.2);
}

/**
 * ATS-optimized PDF: single column, core fonts, selectable text,
 * standard section labels, no decorative images or multi-column layout.
 */
export async function exportResumePdf(bundle: ResumeBundle): Promise<void> {
  const { config, profile, portfolio } = bundle;
  const doc = new jsPDF({ unit: "mm", format: "letter", compress: true });
  const name = profile.name || config.name;
  const textLeft = MARGIN;

  const skillKeywords = config.coreSkills.map(atsText);
  doc.setProperties({
    title: `${name} Resume`,
    subject: "Professional resume for applicant tracking systems",
    author: name,
    keywords: [
      "resume",
      "curriculum vitae",
      "CV",
      name,
      profile.headline,
      ...skillKeywords,
      "Roblox",
      "game development",
      "producer",
      "LiveOps",
      "Luau",
    ]
      .map(atsText)
      .filter(Boolean)
      .join(", "),
    creator: "iGottic Resume Site",
  });

  let y = MARGIN;

  // Identity - plain block, no images or side columns
  doc.setFont(BODY, "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  y = wrap(doc, name, textLeft, y, CONTENT_W, 7);

  doc.setFont(BODY, "normal");
  doc.setFontSize(11);
  y = wrap(doc, profile.headline, textLeft, y + 1, CONTENT_W, 5);
  y += 3;

  if (profile.location) y = labeledLine(doc, "Location", profile.location, y) + 1;
  y = labeledLine(doc, "Email", config.email, y) + 1;
  y = labeledLine(doc, "LinkedIn", config.sources.linkedin, y) + 1;
  y = labeledLine(doc, "Portfolio", config.sources.portfolio, y) + 1;
  y = labeledLine(doc, "Discord", config.discord, y) + 4;

  // Summary
  y = sectionTitle(doc, "Professional Summary", y);
  doc.setFont(BODY, "normal");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  if (config.tagline) {
    y = wrap(doc, config.tagline, textLeft, y, CONTENT_W, 4.5);
    y += 2;
  }
  y = wrapParagraphs(doc, profile.about, textLeft, y, CONTENT_W, 4.5);
  y += 5;

  // Skills - comma-separated for cleaner keyword extraction
  y = sectionTitle(doc, "Skills", y);
  doc.setFont(BODY, "normal");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  y = wrap(doc, skillKeywords.join(", "), textLeft, y, CONTENT_W, 4.5);
  y += 5;

  // Experience - title, company, dates, bullets (role-first for ATS)
  y = sectionTitle(doc, "Work Experience", y);
  for (const job of profile.experience) {
    y = ensureSpace(doc, y, 20);

    doc.setFont(BODY, "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    y = wrap(doc, job.title, textLeft, y, CONTENT_W, 4.5);

    doc.setFont(BODY, "normal");
    doc.setFontSize(10);
    y = wrap(doc, job.company, textLeft, y, CONTENT_W, 4.3);

    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    const dates = `${job.start} - ${job.end}${job.current ? " (Current)" : ""}`;
    y = wrap(doc, dates, textLeft, y, CONTENT_W, 4);
    y += 1.5;

    if (job.description) {
      doc.setFontSize(9.5);
      doc.setTextColor(20, 20, 20);
      y = wrapParagraphs(doc, job.description, textLeft, y, CONTENT_W, 4.2, 1.5);
    }
    y += 4;
  }

  // Projects
  y = sectionTitle(doc, "Projects", y);
  for (const project of portfolio.projects) {
    y = ensureSpace(doc, y, 16);

    doc.setFont(BODY, "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    y = wrap(doc, project.name, textLeft, y, CONTENT_W, 4.3);

    doc.setFont(BODY, "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    const peak =
      project.peakCcu && project.peakCcu !== "N/A"
        ? `, Peak ${project.peakCcu} CCU`
        : "";
    y = wrap(
      doc,
      `${project.creator} | ${project.contributions} | ${project.timeline}${peak}`,
      textLeft,
      y,
      CONTENT_W,
      4,
    );

    doc.setFontSize(9.5);
    doc.setTextColor(20, 20, 20);
    y = wrap(doc, `* ${project.summary}`, textLeft, y, CONTENT_W, 4.2);
    if (project.url) {
      doc.setFontSize(8.5);
      doc.setTextColor(50, 50, 50);
      y = wrap(doc, project.url, textLeft, y, CONTENT_W, 3.8);
    }
    y += 3.5;
  }

  // Links / contact again for parsers that skim the end
  y = sectionTitle(doc, "Additional Links", y);
  doc.setFont(BODY, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);
  for (const social of portfolio.socials) {
    y = ensureSpace(doc, y, 6);
    y = wrap(doc, `${social.label}: ${social.url}`, textLeft, y, CONTENT_W, 4.2);
    y += 1;
  }

  doc.save(config.pdf.filename);
}
