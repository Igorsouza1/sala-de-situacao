import { UsersAdmin } from "@/components/admin/users-admin";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org } = await searchParams;

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <UsersAdmin initialOrgId={org} />
      </div>
    </div>
  );
}
