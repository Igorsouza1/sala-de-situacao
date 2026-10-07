import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/api/require-auth";

// O mapa decide o que mostrar pela função da pessoa: Administração (superadmin) e Sincronizar Planilha (editor ou acima).
export async function GET() {
  const { user } = await requireAuth();
  const [owner, editor] = await Promise.all([requireRole("owner"), requireRole("editor")]);
  return NextResponse.json({
    isAdmin: owner.response === null,
    canEdit: editor.response === null,
    isSuperadmin: user?.app_metadata?.is_superadmin === true,
  });
}
