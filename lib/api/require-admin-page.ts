import { checkIsSuperadmin } from "@/lib/api/check-admin";
import { redirect } from "next/navigation";

/** Guard server-rendered admin data before any repository call. */
export async function requireSuperadminPage() {
  if (!(await checkIsSuperadmin())) redirect("/protected");
}
