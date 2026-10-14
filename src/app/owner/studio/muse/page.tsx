"use client";

import { Suspense } from "react";
import { MuseStudio } from "@/components/muse-studio";

export default function MuseStudioPage() {
  return (
    <Suspense fallback={<p className="font-heading text-3xl">Prepare for Muse AI</p>}>
      <MuseStudio />
    </Suspense>
  );
}
