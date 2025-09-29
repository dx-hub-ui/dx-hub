import { MicrositePublicClient } from "./MicrositePublicClient";

export default async function MicrositePublicPage({
  params,
}: {
  params: Promise<{ orgId: string; slug: string }>;
}) {
  const { orgId, slug } = await params;

  return <MicrositePublicClient orgId={orgId} slug={slug} />;
}
