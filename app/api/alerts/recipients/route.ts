import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { destinatariosAlertasInMonitoramento } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

const REGION_ID = 1;

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return false;
  }

  const { data: profile } = await supabase
    .schema("public")
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "Admin";
}

export async function GET(req: NextRequest) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const recipients = await db
      .select()
      .from(destinatariosAlertasInMonitoramento)
      .where(eq(destinatariosAlertasInMonitoramento.regiaoId, REGION_ID));

    return NextResponse.json(recipients);
  } catch (error) {
    console.error("Error fetching recipients:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, preferencias } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const defaultPreferences = {
      fogo: true,
      desmatamento: true,
      chuva: true,
      nivel_rio: true
    };

    const newRecipient = await db
      .insert(destinatariosAlertasInMonitoramento)
      .values({
        email,
        regiaoId: REGION_ID,
        preferencias: preferencias || defaultPreferences,
        ativo: true,
      })
      .returning();

    return NextResponse.json(newRecipient[0]);
  } catch (error) {
    console.error("Error creating recipient:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
