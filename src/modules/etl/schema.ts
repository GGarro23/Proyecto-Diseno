// AF-08 ETL

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
  numeroFila: number | null; // null si el error afecta al archivo completo
  campo: string | null;
  motivo: string;
};

// Lo que devuelve la API: la ejecución con el nombre del Administrador responsable
export type EjecucionDetalle = EjecucionETL & { responsable: string };
