import { NextResponse } from "next/server"
import { db, sql } from "@/db"

// Tipagem para o resultado esperado do banco
interface TableRow {
    table_name: string;
  }
  
  // Estrutura genérica do resultado da consulta
  interface TableResult {
    command: string;
    rowCount: number;
    oid: null;
    rows: TableRow[];
    fields: Array<{
      name: string;
      tableID: number;
      columnID: number;
      dataTypeID: number;
      dataTypeSize: number;
      dataTypeModifier: number;
      format: string;
    }>;
    [key: string]: unknown;  // Adiciona index signature
  }

export async function GET() {
  try {
    const result = await db.execute<TableResult>(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'rio_da_prata'
    `)

    if (!Array.isArray(result.rows)) {
      throw new Error("Unexpected result structure")
    }

    const tables = result.rows.map((row) => row.table_name)
    return NextResponse.json(tables)
  } catch (error) {
    console.error("Error fetching tables:", error)
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 })
  }
}

