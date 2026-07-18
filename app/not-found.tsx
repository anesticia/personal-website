import Link from "next/link";
import { ArrowIcon } from "@/components/icons";

export default function NotFound() { return <div className="not-found atlas-not-found section-pad"><p className="atlas-kicker">404 · Boundary condition</p><h1>This path left <em>the domain.</em></h1><p>The page may have moved, or the equation was never defined here.</p><Link className="atlas-action" href="/">Return home <ArrowIcon /></Link></div>; }
