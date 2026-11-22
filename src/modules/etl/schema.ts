export type EjecucionETL = {
  idEjecucion: number;
  idAdministrador: number;
  nombreArchivo: string;
  fechaEjecucion: string;
  estado: "Exitosa" | "Parcialmente Exitosa" | "Fallida";
  filasAceptadas: number;
  filasRechazadas: number;
};

export type ErrorETL = {
  idError: number;
  idEjecucion: number;
  numeroFila: number | null;
  campo: string | null;
  motivo: string;
};

export type EjecucionDetalle = EjecucionETL & { responsable: string };
