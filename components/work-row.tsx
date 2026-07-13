import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import type { Work } from "@/data/site";

export function WorkRow({ work, index }: { work: Work; index: number }) {
  return (
    <Link className="work-row" href={`/work/${work.slug}`}>
      <span className="work-index">{String(index + 1).padStart(2, "0")}</span>
      <div className="work-copy">
        <p className="eyebrow">{work.eyebrow}</p>
        <h3>{work.title}</h3>
        <p>{work.summary}</p>
      </div>
      {work.image ? <div className="work-thumb"><Image src={work.image} alt="" fill sizes="(max-width: 800px) 30vw, 220px" /></div> : <div className="work-glyph" aria-hidden="true">{work.title.slice(0, 2).toUpperCase()}</div>}
      <span className="work-arrow"><ArrowIcon /></span>
    </Link>
  );
}
