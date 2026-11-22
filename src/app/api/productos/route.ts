import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const resultado = await db.query(`
      SELECT
        p.id_producto,
        p.codigo,
        p.nombre,
        p.descripcion,
        p.precio,
        p.existencias,
        p.imagen_url,
        c.nombre AS categoria
      FROM producto p
      INNER JOIN categoria c
        ON p.id_categoria = c.id_categoria
      WHERE p.activo = TRUE
      ORDER BY p.id_producto;
    `);

    return NextResponse.json(resultado.rows);
  } catch (error) {
    console.error("Error consultando productos:", error);

    return NextResponse.json(
      { error: "No fue posible consultar los productos" },
      { status: 500 }
    );
  }
}