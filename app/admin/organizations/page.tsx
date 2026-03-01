import { OrganizationsAdmin } from "@/components/admin/organizations-admin";

export default function OrganizationsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <OrganizationsAdmin />
      </div>
    </div>
  );
}
