import type {
  PortfolioData,
  ProfileData,
  ResumeBundle,
  SiteConfig,
} from "./types";

async function loadJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Missing ${path}`);
  return res.json() as Promise<T>;
}

/** Load all resume content from local JSON files (manual edits only). */
export async function loadResume(): Promise<ResumeBundle> {
  const [config, profile, portfolio] = await Promise.all([
    loadJson<SiteConfig>("/config.json"),
    loadJson<ProfileData>("/data/linkedin.json"),
    loadJson<PortfolioData>("/data/portfolio.json"),
  ]);

  return { config, profile, portfolio };
}
