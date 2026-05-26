import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { destinatariosAlertasInMonitoramento } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api/require-auth";

const REGION_ID = 1;

export async function GET(req: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

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
  const { response } = await requireAdmin();
  if (response) return response;

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
