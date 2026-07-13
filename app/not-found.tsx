import Link from "next/link";
import { ArrowIcon } from "@/components/icons";

export default function NotFound() { return <div className="not-found section-pad"><p className="page-kicker">404 / Boundary condition</p><h1>This path left the domain.</h1><p>The page may have moved, or the equation was never defined here.</p><Link className="button button-dark" href="/">Return home <ArrowIcon /></Link></div>; }
