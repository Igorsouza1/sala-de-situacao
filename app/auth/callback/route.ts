import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Session } from "@supabase/supabase-js";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (redirectTo) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }

    const user = data?.user;

    if (user?.app_metadata?.is_superadmin === true) {
      return NextResponse.redirect(`${origin}/admin`);
    }

    const regionRow = await db.execute<{ region_id: number }>(sql`
      SELECT region_id FROM monitoramento.roles
      WHERE user_id = ${user?.id}::uuid AND region_id IS NOT NULL
      ORDER BY id ASC LIMIT 1
    `);
    const regionId = regionRow.rows[0]?.region_id;

    return NextResponse.redirect(
      `${origin}${regionId ? `/protected?regiao_id=${regionId}` : "/protected"}`
    );
  }

  return NextResponse.redirect(`${origin}/protected`);
}


export async function POST(request: Request) {
  const supabase = await createClient();
  const { event, session } = (await request.json()) as {
    event: string;
    session: Session | null;
  };

  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    if (session) await supabase.auth.setSession(session);
  }

  if (event === "SIGNED_OUT") {
    await supabase.auth.signOut();
  }

  return NextResponse.json({ ok: true });
}
