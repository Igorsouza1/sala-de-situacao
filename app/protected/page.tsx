import ProtectedPage from "@/app/protected/client-page";
import { parseRegionIdInput } from "@/lib/api/region-id";
import { resolveScope } from "@/lib/api/scope";
import { notFound, redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ regiao_id?: string | string[] }>;
}) {
  const { regiao_id } = await searchParams;
  const requested = parseRegionIdInput(regiao_id);
  if (!requested.ok) notFound();

  const scope = await resolveScope({ regiaoId: requested.id });
  if (scope.response?.status === 401) redirect("/sign-in");
  if (scope.response) notFound();

  return (
    <div className="h-full">
      <ProtectedPage regiaoId={requested.id ?? undefined} />
    </div>
  );
}
