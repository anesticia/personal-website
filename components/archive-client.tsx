"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { WorkRow } from "@/components/work-row";
import type { Work, WorkKind } from "@/data/site";

const filters: { label: string; value: "all" | WorkKind }[] = [
  { label: "All", value: "all" },
  { label: "Research", value: "research" },
  { label: "Software", value: "software" },
  { label: "Experiments", value: "experiment" },
  { label: "Forks", value: "fork" },
];

export function ArchiveClient({ works }: { works: Work[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | WorkKind>("all");
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return works.filter((work) => {
      const matchesFilter = filter === "all" || work.kind === filter;
      const haystack = [work.title, work.summary, work.kind, work.status, ...work.topics, ...work.technologies].join(" ").toLowerCase();
      return matchesFilter && (!needle || haystack.includes(needle));
    });
  }, [filter, query, works]);

  return (
    <div className="archive-browser">
      <div className="archive-tools">
        <label className="search-field"><SearchIcon /><span className="sr-only">Search the archive</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search methods, topics, or tools" /></label>
        <p className="result-count" aria-live="polite">{results.length} {results.length === 1 ? "entry" : "entries"}</p>
        <div className="filter-list" aria-label="Filter archive">
          {filters.map((item) => <button type="button" key={item.value} className={filter === item.value ? "active" : ""} onClick={() => setFilter(item.value)}>{item.label}</button>)}
        </div>
      </div>
      <div className="work-list">
        {results.map((work, index) => <WorkRow key={work.slug} work={work} index={index} />)}
      </div>
      {results.length === 0 && <div className="empty-state"><p>No work matches this search.</p><button type="button" onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</button></div>}
    </div>
  );
}
