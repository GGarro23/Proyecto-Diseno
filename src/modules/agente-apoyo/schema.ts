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