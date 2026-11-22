export type TipoEvento =
  | "Compra confirmada"
  | "Cambio de estado de pedido"
  | "Inscripción confirmada";

export type NotificacionCorreo = {
  idNotificacion: number;
  idUsuario: number;
  tipoEvento: TipoEvento;
  destinatario: string;
  estadoSolicitud: "Aceptada" | "Rechazada";
  fechaSolicitud: string;
  detalleError: string | null;
  idPedido: number | null;
  idInscripcion: number | null;
};