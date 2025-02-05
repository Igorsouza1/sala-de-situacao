import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("table");

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ error: "Body is required" }, { status: 400 });
    }

    if (!tableName) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 });
    }

    // 🚀 Criando dinamicamente os campos e valores da query SQL
    let keys = Object.keys(body).map((key) => sql.identifier(key));
    let values = Object.values(body).map((value) => sql`${value}`);

    // 📌 Se existir latitude e longitude, criar `geom` corretamente
    if (body.latitude && body.longitude) {
      // Remove latitude e longitude das colunas e valores para evitar duplicação
      keys = keys.filter((key) => key !== sql.identifier("latitude") && key !== sql.identifier("longitude"));
      values = values.filter((_, index) => !["latitude", "longitude"].includes(Object.keys(body)[index]));

      // Adiciona `geom` como campo e usa `ST_SetSRID(ST_MakePoint(...), 4326)`
      keys.push(sql.identifier("geom"));
      values.push(sql`ST_SetSRID(ST_MakePoint(${body.longitude}, ${body.latitude}), 4326)`);
      
    }

    // 🚀 Verificando se o tamanho dos arrays está correto antes da query
    if (keys.length !== values.length) {
      console.error("Erro: número de colunas e valores não corresponde.");
      return NextResponse.json({ error: "Column-value mismatch" }, { status: 400 });
    }

    console.log("Keys:", keys);
    console.log("Values:", values);

    // 🔥 Executa o INSERT no banco
    const result = await db.execute(sql`
      INSERT INTO rio_da_prata.${sql.identifier(tableName)} (${sql.join(keys, sql`, `)})
      VALUES (${sql.join(values, sql`, `)})
      RETURNING *;
    `);

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error inserting item:", error);
    return NextResponse.json({ error: "Failed to insert item" }, { status: 500 });
  }
}
