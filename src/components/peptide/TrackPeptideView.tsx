"use client";

import { useEffect } from "react";
import { trackPeptideView } from "@/lib/analytics";

export default function TrackPeptideView({ name, slug }: { name: string; slug: string }) {
  useEffect(() => {
    trackPeptideView(name, slug);
  }, [name, slug]);
  return null;
}
