import "./styles/main.css";
import type { ResumeBundle } from "./lib/types";
import { loadResume } from "./lib/data";
import { exportResumePdf } from "./lib/pdf";
import { renderError, renderLoading, renderResume } from "./lib/render";
import { initReveal } from "./lib/motion";

function bindExport(root: HTMLElement, bundle: ResumeBundle): void {
  root.querySelectorAll("#export-pdf").forEach((btn) => {
    btn.addEventListener("click", () => {
      void exportResumePdf(bundle);
    });
  });
}

async function boot(): Promise<void> {
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;

  renderLoading(app);

  try {
    const bundle = await loadResume();
    document.title = `${bundle.profile.name || bundle.config.name} — Resume`;
    renderResume(app, bundle);
    bindExport(app, bundle);
    initReveal(app);
  } catch (err) {
    console.error(err);
    renderError(
      app,
      err instanceof Error ? err.message : "Unknown error while loading resume data.",
    );
  }
}

boot();
