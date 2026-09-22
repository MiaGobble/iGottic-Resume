export function initReveal(root: ParentNode = document): void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));

  if (reduce || !("IntersectionObserver" in window) || !("animate" in Element.prototype)) {
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
        el.animate(
          [
            { opacity: 0, transform: "translateY(1.5rem)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 700, easing: "ease", fill: "forwards" },
        );
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );

  nodes.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(1.5rem)";
    observer.observe(el);
  });
}
