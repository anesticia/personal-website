"use client";

import { useEffect, useRef, useState } from "react";

export type DossierChapter = { id: string; label: string; index: string };

export function DossierRail({ chapters }: { chapters: DossierChapter[] }) {
  const [active, setActive] = useState(chapters[0]?.id ?? "");
  const progressLabel = useRef<HTMLElement>(null);
  const progressBar = useRef<HTMLElement>(null);

  useEffect(() => {
    const sections = chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((section): section is HTMLElement => Boolean(section));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.12, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    const updateProgress = () => {
      const root = document.documentElement;
      const maximum = root.scrollHeight - window.innerHeight;
      const progress = maximum > 0 ? Math.min(1, window.scrollY / maximum) : 0;
      const label = `${Math.round(progress * 100).toString().padStart(2, "0")}%`;
      // Scrolling changes only these two values, not the chapter navigation.
      if (progressLabel.current && progressLabel.current.textContent !== label) progressLabel.current.textContent = label;
      if (progressBar.current) progressBar.current.style.transform = `scaleY(${progress})`;
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateProgress);
    };
  }, [chapters]);

  return (
    <aside className="dossier-rail" aria-label="Research dossier chapters">
      <header>
        <span>Field index</span>
        <b ref={progressLabel}>00%</b>
      </header>
      <div className="dossier-rail-progress" aria-hidden="true"><i ref={progressBar} style={{ transform: "scaleY(0)" }} /></div>
      <nav aria-label="Research dossier chapters">
        {chapters.map((chapter) => (
          <a key={chapter.id} href={`#${chapter.id}`} aria-current={active === chapter.id ? "location" : undefined}>
            <span>{chapter.index}</span>
            <strong>{chapter.label}</strong>
          </a>
        ))}
      </nav>
    </aside>
  );
}
