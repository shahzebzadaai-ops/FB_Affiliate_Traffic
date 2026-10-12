"use client";

import { useParams } from "next/navigation";
import { BrandBible } from "@/components/brand-pages";

export default function StaffBrandPage() {
  const params = useParams<{ code: string }>();
  return <BrandBible code={params.code} mode="staff" />;
}
