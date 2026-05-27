import ProtectedPage from "@/app/protected/client-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ regiao_id?: string }>;
}) {
  const { regiao_id } = await searchParams;
  const regiaoId = regiao_id ? parseInt(regiao_id, 10) : undefined;

  return (
    <div className="h-full">
      <ProtectedPage regiaoId={Number.isNaN(regiaoId) ? undefined : regiaoId} />
    </div>
  );
}
