import { NextResponse } from "next/server";
import { obtenerOfertaAcademica } from "@/modules/academia/consultas";

export async function GET() {
  try {
    const cursos = await obtenerOfertaAcademica();
    return NextResponse.json(cursos);
  } catch (error) {
    console.error(
      "Error consultando la oferta académica:",
      error
    );

    return NextResponse.json(
      { error: "No fue posible consultar los cursos" },
      { status: 500 }
    );
  }
}
