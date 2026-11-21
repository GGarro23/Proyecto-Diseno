import type { Producto } from "@/modules/catalogo-inventario/schema";

// Nombres, precios y existencias de la Figura 10. Códigos y descripciones son de prueba.
export const productos: Producto[] = [
  {
    idProducto: 1,
    idCategoria: 1,
    codigo: "CUE-001",
    nombre: "Violín Atelier V-80",
    descripcion: "Violín de estudio avanzado con tapa de abeto macizo.",
    precio: 189000,
    activo: true,
    existencias: 4,
    imagenUrl: "/img/productos/violin-atelier-v80.jpg",
  },
  {
    idProducto: 2,
    idCategoria: 2,
    codigo: "TEC-001",
    nombre: "Piano Digital Aureum",
    descripcion: "Piano digital de 88 teclas con acción contrapesada.",
    precio: 489000,
    activo: true,
    existencias: 7,
    imagenUrl: "/img/productos/piano-digital-aureum.jpg",
  },
  {
    idProducto: 3,
    idCategoria: 4,
    codigo: "ACC-001",
    nombre: "Arco Ébano Concert",
    descripcion: "Arco para violín con talón de ébano.",
    precio: 48000,
    activo: true,
    existencias: 12,
    imagenUrl: "/img/productos/arco-ebano-concert.jpg",
  },
  {
    idProducto: 4,
    idCategoria: 1,
    codigo: "CUE-002",
    nombre: "Violín Estudio V-40",
    descripcion: "Violín para principiantes con estuche y arco.",
    precio: 128000,
    activo: true,
    existencias: 0,
    imagenUrl: "/img/productos/violin-estudio-v40.jpg",
  },
];