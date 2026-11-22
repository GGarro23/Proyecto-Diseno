import { NextResponse } from "next/server";
import { consulta } from "@/lib/db";
import { ErrorApi, exito, leerCuerpo, manejar } from "@/lib/respuesta";
import { requerirPermiso } from "@/modules/autenticacion-usuarios/service";
import { obtenerCategorias, obtenerProductos } from "@/modules/catalogo-inventario/consultas";
import { validarProducto, type DatosProducto } from "@/modules/catalogo-inventario/validaciones";
import type { Producto } from "@/modules/catalogo-inventario/schema";

// El GET público conserva el formato usado por la tienda.
export async function GET() {
  try {
    const productos = await consulta(`
      SELECT p.id_producto, p.codigo, p.nombre, p.descripcion, p.precio,
             p.existencias, p.imagen_url, c.nombre AS categoria
      FROM producto p
      INNER JOIN categoria c ON p.id_categoria = c.id_categoria
      WHERE p.activo = TRUE
      ORDER BY p.id_producto
    `);
    return NextResponse.json(productos);
  } catch (error) {
    console.error("Error consultando productos:", error);
    return NextResponse.json({ error: "No fue posible consultar los productos" }, { status: 500 });
  }
}

function datosValidos(valor: unknown): DatosProducto {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    throw new ErrorApi(400, "Indica los datos del producto.");
  }
  const objeto = valor as Record<string, unknown>;
  const campos = ["codigo", "nombre", "idCategoria", "precio", "descripcion", "imagenUrl"] as const;
  const datos = {} as DatosProducto;
  for (const campo of campos) {
    const dato = objeto[campo];
    if (typeof dato !== "string") {
      // idCategoria y precio pueden llegar como números en integraciones externas.
      if ((campo === "idCategoria" || campo === "precio") && typeof dato === "number" && Number.isFinite(dato)) {
        datos[campo] = String(dato);
      } else if ((campo === "descripcion" || campo === "imagenUrl") && (dato == null)) {
        datos[campo] = "";
      } else {
        throw new ErrorApi(400, "Revisa los datos del producto.", { [campo]: "Valor inválido." });
      }
    } else {
      datos[campo] = dato.trim();
    }
  }
  if (datos.codigo.length > 60 || datos.nombre.length > 180 || datos.imagenUrl.length > 500) {
    throw new ErrorApi(400, "Uno de los campos supera el tamaño permitido.");
  }
  return datos;
}

function idValido(valor: unknown): number {
  const id = Number(valor);
  if (!Number.isSafeInteger(id) || id <= 0) throw new ErrorApi(400, "Identificador de producto inválido.");
  return id;
}

function errorBaseDatos(error: unknown): never {
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "23505") throw new ErrorApi(409, "Ya existe un producto con ese código.", { codigo: "Código duplicado." });
    if (error.code === "23503") throw new ErrorApi(400, "La categoría seleccionada no existe.", { idCategoria: "Categoría inexistente." });
    if (error.code === "23514" || error.code === "22001" || error.code === "22003") {
      throw new ErrorApi(400, "Los datos del producto no cumplen las restricciones de la base de datos.");
    }
  }
  throw error;
}

async function comprobar(datos: DatosProducto, idProducto?: number) {
  const [productos, categorias] = await Promise.all([obtenerProductos(), obtenerCategorias()]);
  const errores = validarProducto(datos, productos, categorias, idProducto);
  // El esquema SQL permite descripción opcional; evitamos exigirla solo en la API.
  delete errores.descripcion;
  if (Object.keys(errores).length) throw new ErrorApi(400, "Revisa los datos marcados.", errores);
  if (!Number.isSafeInteger(Number(datos.idCategoria)) || Number(datos.idCategoria) <= 0) {
    throw new ErrorApi(400, "Categoría inválida.", { idCategoria: "Selecciona una categoría existente." });
  }
}

// RF-13: registrar producto con cero existencias, sin crear movimientos.
export function POST(peticion: Request) {
  return manejar(async () => {
    await requerirPermiso("catalogo.administrar");
    const datos = datosValidos(await leerCuerpo<unknown>(peticion));
    await comprobar(datos);
    try {
      const filas = await consulta<Producto>(`
        INSERT INTO producto (id_categoria, codigo, nombre, descripcion, precio, imagen_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id_producto AS "idProducto", id_categoria AS "idCategoria",
                  codigo, nombre, COALESCE(descripcion, '') AS descripcion,
                  precio, activo, existencias, COALESCE(imagen_url, '') AS "imagenUrl"
      `, [Number(datos.idCategoria), datos.codigo, datos.nombre, datos.descripcion || null,
          Number(datos.precio), datos.imagenUrl || null]);
      return exito(filas[0], 201);
    } catch (error) { errorBaseDatos(error); }
  });
}

// RF-14: editar datos descriptivos; no modificar existencias ni historial.
export function PUT(peticion: Request) {
  return manejar(async () => {
    await requerirPermiso("catalogo.administrar");
    const cuerpo = await leerCuerpo<Record<string, unknown>>(peticion);
    const id = idValido(cuerpo?.idProducto);
    const datos = datosValidos(cuerpo);
    const existentes = await consulta<{ idProducto: number }>(
      'SELECT id_producto AS "idProducto" FROM producto WHERE id_producto = $1 AND activo = TRUE', [id]);
    if (!existentes.length) throw new ErrorApi(404, "El producto no existe o está desactivado.");
    await comprobar(datos, id);
    try {
      const filas = await consulta<Producto>(`
        UPDATE producto SET id_categoria = $2, codigo = $3, nombre = $4,
                            descripcion = $5, precio = $6, imagen_url = $7
        WHERE id_producto = $1 AND activo = TRUE
        RETURNING id_producto AS "idProducto", id_categoria AS "idCategoria",
                  codigo, nombre, COALESCE(descripcion, '') AS descripcion,
                  precio, activo, existencias, COALESCE(imagen_url, '') AS "imagenUrl"
      `, [id, Number(datos.idCategoria), datos.codigo, datos.nombre,
          datos.descripcion || null, Number(datos.precio), datos.imagenUrl || null]);
      if (!filas.length) throw new ErrorApi(404, "El producto no existe.");
      return exito(filas[0]);
    } catch (error) { errorBaseDatos(error); }
  });
}

// RF-15: baja lógica; conserva historial y pedidos.
export function PATCH(peticion: Request) {
  return manejar(async () => {
    await requerirPermiso("catalogo.administrar");
    const cuerpo = await leerCuerpo<Record<string, unknown>>(peticion);
    const id = idValido(cuerpo?.idProducto);
    const filas = await consulta<Producto>(`
      UPDATE producto SET activo = FALSE
      WHERE id_producto = $1 AND activo = TRUE
      RETURNING id_producto AS "idProducto", id_categoria AS "idCategoria",
                codigo, nombre, COALESCE(descripcion, '') AS descripcion,
                precio, activo, existencias, COALESCE(imagen_url, '') AS "imagenUrl"
    `, [id]);
    if (!filas.length) throw new ErrorApi(404, "El producto no existe o ya está desactivado.");
    return exito(filas[0]);
  });
}
