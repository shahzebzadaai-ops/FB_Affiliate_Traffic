"use client";

import { useParams } from "next/navigation";
import { PublishDesk } from "@/components/publish-desk";

export default function StaffTaskPage() {
  const params = useParams<{ contentId: string }>();
  return <PublishDesk contentId={params.contentId} />;
}
