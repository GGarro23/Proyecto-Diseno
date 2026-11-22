// AF-07 Agente de apoyo a la gestión

export type Recomendacion = {
  idRecomendacion: number;
  tipo: "Reabastecimiento" | "Promoción académica";
  idProducto: number | null; // solo en reabastecimiento (RI-15)
  idCurso: number | null;    // solo en promoción académica (RI-15)
  motivo: string;
  fechaGeneracion: string;
  estado: "Pendiente" | "Revisada";
  fechaRevision: string | null;
  idRevisor: number | null;
};

// Lo que devuelve la API: la recomendación con el nombre del producto o curso y de quien la revisó
export type RecomendacionDetalle = Recomendacion & {
  elemento: string;
  revisor: string | null;
};
