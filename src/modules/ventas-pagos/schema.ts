export type Carrito = {
  idCarrito: number;
  idUsuario: number;
};

export type LineaCarrito = {
  idCarrito: number;
  idProducto: number;
  cantidad: number;
};

export type ModalidadEntrega = "Envío a domicilio" | "Retiro presencial";

export type EstadoPago = "Pendiente" | "Aprobado" | "Rechazado";

export type EstadoOperativo =
  | "Pendiente"
  | "En preparación"
  | "Empacado"
  | "Enviado"
  | "Listo para retiro"
  | "Retirado";

export type Pedido = {
  idPedido: number;
  idUsuario: number;
  fechaCreacion: string;
  total: number;
  costoEntrega: number;
  modalidadEntrega: ModalidadEntrega;
  direccionEntrega: string | null;
  estadoPago: EstadoPago;
  estadoOperativo: EstadoOperativo;
  fechaConfirmacion: string | null;
};

export type DetallePedido = {
  idPedido: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
};

export type CodigoEscenario = "APROBADO" | "RECHAZADO";

export type IntentoPagoSimulado = {
  idIntento: number;
  idPedido: number;
  codigoEscenario: CodigoEscenario;
  resultadoSimulacion: "Aprobado" | "Rechazado";
  fechaIntento: string;
};