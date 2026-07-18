import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowIcon } from "@/components/icons";
import { atlasRecords } from "@/data/atlas";
import { works } from "@/data/site";

const workMap = new Map(works.map((work) => [work.slug, work]));

export function EvidenceRegister({ limit }: { limit?: number }) {
  const rows = typeof limit === "number" ? atlasRecords.slice(0, limit) : atlasRecords;
  return (
    <div className="atlas-register-wrap">
      <table className="atlas-register">
        <thead><tr><th>Project</th><th>Question under test</th><th>Reference or protocol</th><th>Current boundary</th><th>Record</th></tr></thead>
        <tbody>
          {rows.map((record) => {
            const work = workMap.get(record.slug)!;
            return (
              <tr key={record.slug} style={{ "--record-accent": record.accent } as CSSProperties}>
                <th scope="row"><i /><span>{record.code}</span><strong>{work.title}</strong><small>{record.source}</small></th>
                <td data-label="Question">{record.question}</td>
                <td data-label="Reference">{record.reference}</td>
                <td data-label="Boundary">{record.boundary}</td>
                <td data-label="Record"><Link href={`/work/${record.slug}`} aria-label={`Open ${work.title}`}><ArrowIcon /></Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
