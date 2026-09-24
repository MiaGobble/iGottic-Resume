import { jsPDF } from "jspdf";
import type { ResumeBundle } from "./types";
import { groupExperience, splitParagraphs } from "./experience";

const PAGE_W = 215.9;
const PAGE_H = 279.4;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function fetchAsBase64(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return arrayBufferToBase64(await res.arrayBuffer());
}

async function loadImage(path: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = "async";
  img.src = path;
  await img.decode();
  return img;
}

/** Center-crop (object-fit: cover) into a fixed aspect box, then return a data URL. */
function coverCropDataUrl(
  img: HTMLImageElement,
  targetAspectW: number,
  targetAspectH: number,
  mime: "image/png" | "image/jpeg",
  pixelWidth = 1600,
): string {
  const aspect = targetAspectW / targetAspectH;
  const pixelHeight = Math.max(1, Math.round(pixelWidth / aspect));
  const canvas = document.createElement("canvas");
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable for image crop");

  const scale = Math.max(
    pixelWidth / img.naturalWidth,
    pixelHeight / img.naturalHeight,
  );
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  const dx = (pixelWidth - drawW) / 2;
  const dy = (pixelHeight - drawH) / 2;
  ctx.drawImage(img, dx, dy, drawW, drawH);
  return canvas.toDataURL(mime, 0.92);
}

async function registerFonts(doc: jsPDF): Promise<void> {
  const fonts = [
    {
      path: "/assets/fonts/RockSalt-Regular.ttf",
      vfs: "RockSalt-Regular.ttf",
      name: "RockSalt",
      style: "normal",
    },
    {
      path: "/assets/fonts/Metal-Regular.ttf",
      vfs: "Metal-Regular.ttf",
      name: "Metal",
      style: "normal",
    },
    {
      path: "/assets/fonts/maven-pro-v40-latin-regular.ttf",
      vfs: "MavenPro-Regular.ttf",
      name: "MavenPro",
      style: "normal",
    },
    {
      path: "/assets/fonts/maven-pro-v40-latin-700.ttf",
      vfs: "MavenPro-Bold.ttf",
      name: "MavenPro",
      style: "bold",
    },
  ] as const;

  for (const font of fonts) {
    const data = await fetchAsBase64(font.path);
    doc.addFileToVFS(font.vfs, data);
    doc.addFont(font.vfs, font.name, font.style);
  }
}

function wrap(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  for (const line of lines) {
    if (y > PAGE_H - 18) {
      doc.addPage();
      y = MARGIN;
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

function ensureSpace(doc: jsPDF, y: number, need: number): number {
  if (y + need > PAGE_H - 16) {
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
  paragraphGap = 2.5,
): number {
  const paragraphs = splitParagraphs(text);
  for (let i = 0; i < paragraphs.length; i++) {
    y = wrap(doc, paragraphs[i], x, y, maxWidth, lineHeight);
    if (i < paragraphs.length - 1) y += paragraphGap;
  }
  return y;
}

function logoFormat(path: string): "PNG" | "JPEG" {
  return /\.jpe?g$/i.test(path) ? "JPEG" : "PNG";
}

function sectionTitle(doc: jsPDF, label: string, y: number): number {
  y = ensureSpace(doc, y, 14);
  doc.setFont("RockSalt", "normal");
  doc.setFontSize(14);
  doc.setTextColor(19, 24, 27);
  doc.text(label, MARGIN, y);
  return y + 8;
}

/** Build a selectable-text PDF with branding fonts, banner, and profile photo. */
export async function exportResumePdf(bundle: ResumeBundle): Promise<void> {
  const { config, profile, portfolio } = bundle;
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const name = profile.name || config.name;
  const companies = groupExperience(profile.experience);

  await registerFonts(doc);

  const [bannerImg, pfpImg] = await Promise.all([
    loadImage("/assets/images/banner.png"),
    loadImage("/assets/images/pfp.jpg"),
  ]);

  const logoEntries = await Promise.all(
    companies
      .filter((g) => g.logo)
      .map(async (g) => {
        try {
          const img = await loadImage(g.logo!);
          const data = coverCropDataUrl(img, 1, 1, logoFormat(g.logo!) === "JPEG" ? "image/jpeg" : "image/png", 256);
          return [g.company, { data, format: logoFormat(g.logo!) }] as const;
        } catch {
          return null;
        }
      }),
  );
  const logos = new Map(
    logoEntries.filter((e): e is NonNullable<typeof e> => !!e),
  );

  const bannerBoxH = 42;
  const bannerData = coverCropDataUrl(
    bannerImg,
    PAGE_W,
    bannerBoxH,
    "image/png",
    1800,
  );
  const pfpSize = 28;
  const pfpData = coverCropDataUrl(pfpImg, 1, 1, "image/jpeg", 800);

  doc.setProperties({
    title: `${name} — Resume`,
    subject: "Professional resume",
    author: name,
    keywords: [
      "resume",
      "curriculum vitae",
      config.brand,
      ...config.coreSkills,
      "Roblox",
      "game development",
      "producer",
    ].join(", "),
    creator: "iGottic Resume Site",
  });

  // Banner: center-cropped to fill the top band
  doc.addImage(bannerData, "PNG", 0, 0, PAGE_W, bannerBoxH);

  // Header block fully below the banner (no overlap)
  const pfpX = MARGIN;
  const pfpY = bannerBoxH + 8;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pfpX - 1, pfpY - 1, pfpSize + 2, pfpSize + 2, 1, 1, "F");
  doc.addImage(pfpData, "JPEG", pfpX, pfpY, pfpSize, pfpSize);

  let y = pfpY + pfpSize + 8;
  const textLeft = MARGIN;
  const headerTextX = pfpX + pfpSize + 6;
  const headerTextW = PAGE_W - headerTextX - MARGIN;
  let headerY = pfpY + 7;

  doc.setFont("RockSalt", "normal");
  doc.setFontSize(18);
  doc.setTextColor(19, 24, 27);
  const nameLines = doc.splitTextToSize(name, headerTextW) as string[];
  for (const line of nameLines) {
    doc.text(line, headerTextX, headerY);
    headerY += 8;
  }

  doc.setFont("Metal", "normal");
  doc.setFontSize(11);
  doc.setTextColor(78, 50, 39);
  headerY = wrap(doc, profile.headline, headerTextX, headerY, headerTextW, 5);

  doc.setFont("MavenPro", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  const contactBits = [
    profile.location,
    `Discord ${config.discord}`,
  ]
    .filter(Boolean)
    .join("  ·  ");
  headerY = wrap(doc, contactBits, headerTextX, headerY, headerTextW, 4);
  headerY = wrap(
    doc,
    `${config.email}  ·  ${config.sources.linkedin}`,
    headerTextX,
    headerY,
    headerTextW,
    4,
  );

  y = Math.max(y, headerY + 4);

  doc.setDrawColor(154, 147, 141);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 8;

  // About
  y = sectionTitle(doc, "About", y);
  doc.setFont("MavenPro", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  if (config.tagline) {
    doc.setFont("MavenPro", "bold");
    y = wrap(doc, config.tagline, textLeft, y, CONTENT_W, 5);
    y += 2;
    doc.setFont("MavenPro", "normal");
  }
  y = wrapParagraphs(doc, profile.about, textLeft, y, CONTENT_W, 5);
  y += 6;

  // Skills
  y = sectionTitle(doc, "Core Skills", y);
  doc.setFont("MavenPro", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  y = wrap(doc, config.coreSkills.join("  ·  "), textLeft, y, CONTENT_W, 5);

  // Experience starts on a new page after Core Skills
  doc.addPage();
  y = MARGIN;
  y = sectionTitle(doc, "Experience", y);
  for (const group of companies) {
    y = ensureSpace(doc, y, 24);
    const logoSize = 10;
    const logo = logos.get(group.company);
    if (logo) {
      doc.addImage(logo.data, logo.format, textLeft, y - 3, logoSize, logoSize);
    }
    const companyX = textLeft + (logo ? logoSize + 3 : 0);
    doc.setFont("MavenPro", "bold");
    doc.setFontSize(11);
    doc.setTextColor(19, 24, 27);
    doc.text(group.company, companyX, y);
    y += 5;
    if (group.duration) {
      doc.setFont("MavenPro", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text(group.duration, companyX, y);
      y += 7;
    } else {
      y += 5;
    }

    for (const job of group.roles) {
      y = ensureSpace(doc, y, 18);
      doc.setFont("MavenPro", "bold");
      doc.setFontSize(10);
      doc.setTextColor(19, 24, 27);
      y = wrap(doc, job.title, textLeft, y, CONTENT_W, 4.5);
      doc.setFont("MavenPro", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text(`${job.start} – ${job.end}`, textLeft, y);
      y += 4.5;
      if (job.description) {
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(9.5);
        y = wrapParagraphs(doc, job.description, textLeft, y, CONTENT_W, 4.3);
      }
      y += 3.5;
    }
    y += 2;
  }

  // Projects
  doc.addPage();
  y = MARGIN;
  y = sectionTitle(doc, "Selected Projects", y);
  for (const project of portfolio.projects) {
    y = ensureSpace(doc, y, 16);
    doc.setFont("MavenPro", "bold");
    doc.setFontSize(10);
    doc.setTextColor(19, 24, 27);
    doc.text(project.name, textLeft, y);
    y += 4.5;
    doc.setFont("MavenPro", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    const peak =
      project.peakCcu && project.peakCcu !== "N/A"
        ? ` · Peak ${project.peakCcu} CCU`
        : "";
    y = wrap(
      doc,
      `${project.contributions} · ${project.timeline}${peak}`,
      textLeft,
      y,
      CONTENT_W,
      4,
    );
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    y = wrap(doc, `• ${project.summary}`, textLeft, y, CONTENT_W, 4.2);
    y += 3.5;
  }

  // Links
  y = sectionTitle(doc, "Links", y);
  doc.setFont("MavenPro", "normal");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  for (const social of portfolio.socials) {
    y = ensureSpace(doc, y, 6);
    doc.text(`${social.label}: ${social.url}`, textLeft, y);
    y += 4.5;
  }

  doc.save(config.pdf.filename);
}
