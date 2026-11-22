export type Recomendacion = {
  idRecomendacion: number;
  tipo: "Reabastecimiento" | "Promoción académica";
  idProducto: number | null;
  idCurso: number | null;
  motivo: string;
  fechaGeneracion: string;
  estado: "Pendiente" | "Revisada";
  fechaRevision: string | null;
  idRevisor: number | null;
};

export type RecomendacionDetalle = Recomendacion & {
  elemento: string;
  revisor: string | null;
};
