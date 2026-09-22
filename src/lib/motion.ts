export function initReveal(root: ParentNode = document): void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));

  if (reduce || !("IntersectionObserver" in window)) {
    nodes.forEach((el) => el.classList.add("is-static"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        observer.unobserve(el);
        el.classList.add("is-in");
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -4% 0px" },
  );

  nodes.forEach((el) => observer.observe(el));

  // Firefox (and some edge cases) can miss the initial intersection pass.
  requestAnimationFrame(() => {
    nodes.forEach((el) => {
      if (el.classList.contains("is-in") || el.classList.contains("is-static")) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh * 0.92 && rect.bottom > 0) {
        el.classList.add("is-in");
        observer.unobserve(el);
      }
    });
  });
}
