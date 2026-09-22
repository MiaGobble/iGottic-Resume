export interface SiteConfig {
  name: string;
  brand: string;
  tagline: string;
  email: string;
  discord: string;
  coreSkills: string[];
  sources: {
    portfolio: string;
    linkedin: string;
    blog: string;
    github: string;
  };
  pdf: {
    filename: string;
  };
}

export interface ExperienceItem {
  title: string;
  company: string;
  start: string;
  end: string;
  current: boolean;
  description: string;
}

export interface ProfileData {
  name: string;
  headline: string;
  location: string;
  about: string;
  experience: ExperienceItem[];
}

export interface ProjectItem {
  name: string;
  creator: string;
  peakCcu: string;
  timeline: string;
  contributions: string;
  summary: string;
  url?: string;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface PortfolioData {
  projects: ProjectItem[];
  socials: SocialLink[];
}

export interface ResumeBundle {
  config: SiteConfig;
  profile: ProfileData;
  portfolio: PortfolioData;
}
