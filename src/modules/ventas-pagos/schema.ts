// AF-03 Ventas en línea

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

// Transiciones permitidas (HU-09):
// Envío:  Pendiente → En preparación → Empacado → Enviado
// Retiro: Pendiente → En preparación → Listo para retiro → Retirado
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
  costoEntrega: number; // no está en el modelo (Figuras 13–15)
  modalidadEntrega: ModalidadEntrega;
  direccionEntrega: string | null; // solo para envío a domicilio
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

// Códigos de la Figura 15
export type CodigoEscenario = "APROBADO" | "RECHAZADO";

export type IntentoPagoSimulado = {
  idIntento: number;
  idPedido: number;
  codigoEscenario: CodigoEscenario;
  resultadoSimulacion: "Aprobado" | "Rechazado";
  fechaIntento: string;
};