import { redirect } from "next/navigation";
import { checkIsSuperadmin } from "@/lib/api/check-admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const superadmin = await checkIsSuperadmin();
  if (!superadmin) redirect("/protected");
  return <>{children}</>;
}
