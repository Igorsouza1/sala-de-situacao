import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { destinatariosAlertasInMonitoramento } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/api/require-auth";

const REGION_ID = 1;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id: idString } = await params;
  const id = parseInt(idString);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { preferencias } = body;

    const recipient = await db
      .select()
      .from(destinatariosAlertasInMonitoramento)
      .where(and(eq(destinatariosAlertasInMonitoramento.id, id), eq(destinatariosAlertasInMonitoramento.regiaoId, REGION_ID)))
      .limit(1);

    if (recipient.length === 0) {
        return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    const updatedRecipient = await db
      .update(destinatariosAlertasInMonitoramento)
      .set({
        preferencias,
      })
      .where(eq(destinatariosAlertasInMonitoramento.id, id))
      .returning();

    return NextResponse.json(updatedRecipient[0]);
  } catch (error) {
    console.error("Error updating recipient:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id: idString } = await params;
  const id = parseInt(idString);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const result = await db
      .delete(destinatariosAlertasInMonitoramento)
      .where(and(eq(destinatariosAlertasInMonitoramento.id, id), eq(destinatariosAlertasInMonitoramento.regiaoId, REGION_ID)))
      .returning();

    if (result.length === 0) {
        return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Recipient deleted" });
  } catch (error) {
    console.error("Error deleting recipient:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
