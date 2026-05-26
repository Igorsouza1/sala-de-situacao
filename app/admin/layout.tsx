import { redirect } from "next/navigation";
import { checkIsAdmin } from "@/lib/api/check-admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await checkIsAdmin();
  if (!admin) redirect("/protected");
  return <>{children}</>;
}
