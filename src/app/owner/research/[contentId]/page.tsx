import { ResearchDesk } from "@/components/research-desk";

export default async function ResearchPackagePage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  return <ResearchDesk contentId={contentId} />;
}
