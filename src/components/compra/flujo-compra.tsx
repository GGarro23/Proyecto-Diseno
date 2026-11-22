
"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useCarrito } from "@/components/carrito/proveedor-carrito";
import { useSesion } from "@/components/sesion/proveedor-sesion";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Pasos } from "@/components/ui/pasos";
import { Sobretitulo } from "@/components/ui/textos";

import {apiCrearPedido, apiSimularPago,apiConsultarPedido, type ModalidadEntrega, type EscenarioPago,} from "@/lib/api-ventas";
import { ConfirmacionCompra } from "./confirmacion-compra";
import {
  EntregaCompra,
  type DatosEntrega,
} from "./entrega-compra";
import { PagoCompra } from "./pago-compra";
import { RevisionCompra } from "./revision-compra";
import { ResumenCompra } from "./resumen-compra";
import { SelectorPedidosPendientes } from "./selector-pedidos-pendientes";

const TITULOS = [
  "Tu selección",
  "¿Cómo lo recibes?",
  "Pago simulado",
  "Orden confirmada",
];

function clavePedidoPendiente(idUsuario: number) {
  return `intervallum:pedido-pendiente:${idUsuario}`;
}

export function FlujoCompra() {
  const {
    sesion,
    cargando: cargandoSesion,
  } = useSesion();

  const {
    lineas,
    cargando,
    refrescar,
  } = useCarrito();

  const idUsuario = sesion?.usuario.idUsuario;

  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);

  const [entrega, setEntrega] = useState<DatosEntrega>({
    modalidad: null,
    provincia: "San José",
    canton: "",
    direccion: "",
  });

  const [erroresEntrega, setErroresEntrega] = useState<
    Partial<Record<keyof DatosEntrega, string>>
  >({});

  const [idPedido, setIdPedido] = useState<number | null>(
    null
  );

  // Copia temporal de los productos del pedido.
  // Se conserva mientras el usuario realiza el pago.
  const [lineasPedido, setLineasPedido] = useState<
    typeof lineas
  >([]);

  const [codigo, setCodigo] = useState("");
  const [errorPago, setErrorPago] = useState<string>();

  const [procesando, setProcesando] = useState(false);
  const [recuperandoPedido, setRecuperandoPedido] =
    useState(true);

  // Impide operaciones simultáneas dentro de este componente.
  const operacionEnCurso = useRef(false);

  /**
   * Recupera un pedido guardado en sessionStorage.
   *
   * El backend verifica que el pedido pertenezca
   * al usuario autenticado.
   */
  useEffect(() => {
    if (cargandoSesion) return;

    let cancelado = false;

    async function recuperarPedido() {
      await Promise.resolve();

      if (cancelado) return;

      setRecuperandoPedido(true);
      setIdPedido(null);
      setLineasPedido([]);
      setPaso(1);
      setCodigo("");
      setErrorPago(undefined);

      if (idUsuario === undefined) {
        setRecuperandoPedido(false);
        return;
      }

      const clave = clavePedidoPendiente(idUsuario);

      try {
        const valorGuardado =
          sessionStorage.getItem(clave);

        if (!valorGuardado) {
          return;
        }

        const idGuardado = Number(valorGuardado);

        if (
          !Number.isSafeInteger(idGuardado) ||
          idGuardado <= 0
        ) {
          sessionStorage.removeItem(clave);
          return;
        }

        const resultado =
          await apiConsultarPedido(idGuardado);

        if (cancelado) return;

        if (!resultado.ok) {
          setErrorPago(
            "No se pudo recuperar el pedido pendiente. " +
            "Puedes consultarlo nuevamente desde la lista."
          );
          return;
        }

        const pedido = resultado.dato;

        if (pedido.estadoPago === "CONFIRMADO") {
          sessionStorage.removeItem(clave);
          setIdPedido(pedido.idPedido);
          setPaso(4);
          return;
        }

        if (pedido.estadoPago !== "PENDIENTE") {
          sessionStorage.removeItem(clave);
          return;
        }

        setLineasPedido(
          pedido.productos.map((producto) => ({
            idProducto: producto.idProducto,
            nombre: producto.nombre,
            precio: Number(producto.precioUnitario),
            cantidad: producto.cantidad,
          }))
        );

        setEntrega({
          modalidad:
            pedido.modalidadEntrega === "ENVIO"
              ? "Envío a domicilio"
              : "Retiro presencial",
          provincia: "San José",
          canton: "",
          direccion: pedido.direccionEntrega ?? "",
        });

        setIdPedido(pedido.idPedido);
        setErrorPago(undefined);
        setPaso(3);
      } catch (error) {
        if (!cancelado) {
          console.error(
            "Error al recuperar el pedido:",
            error
          );

          setErrorPago(
            "No fue posible consultar el pedido pendiente."
          );
        }
      } finally {
        if (!cancelado) {
          setRecuperandoPedido(false);
        }
      }
    }

    void recuperarPedido();

    return () => {
      cancelado = true;
    };
  }, [idUsuario, cargandoSesion]);

  /**
   * Permite seleccionar un pedido pendiente desde
   * la lista de pedidos del usuario.
   */
  const continuarPedidoPendiente = async (
    pedidoSeleccionado: number
  ) => {
    if (
      !sesion ||
      recuperandoPedido ||
      operacionEnCurso.current
    ) {
      return;
    }

    operacionEnCurso.current = true;
    setProcesando(true);
    setErrorPago(undefined);

    try {
      const resultado =
        await apiConsultarPedido(pedidoSeleccionado);

      if (!resultado.ok) {
        setErrorPago(resultado.error);
        return;
      }

      const pedido = resultado.dato;

      if (pedido.estadoPago !== "PENDIENTE") {
        setErrorPago(
          "Este pedido ya no está pendiente de pago."
        );
        return;
      }

      // Utilizar los precios históricos del pedido.
      setLineasPedido(
        pedido.productos.map((producto) => ({
          idProducto: producto.idProducto,
          nombre: producto.nombre,
          precio: Number(producto.precioUnitario),
          cantidad: producto.cantidad,
        }))
      );

      setEntrega({
        modalidad:
          pedido.modalidadEntrega === "ENVIO"
            ? "Envío a domicilio"
            : "Retiro presencial",
        provincia: "San José",
        canton: "",
        direccion: pedido.direccionEntrega ?? "",
      });

      sessionStorage.setItem(
        clavePedidoPendiente(
          sesion.usuario.idUsuario
        ),
        String(pedido.idPedido)
      );

      setIdPedido(pedido.idPedido);
      setCodigo("");
      setErrorPago(undefined);
      setPaso(3);
    } catch (error) {
      console.error(
        "Error al seleccionar el pedido:",
        error
      );

      setErrorPago(
        "No fue posible recuperar el pedido seleccionado."
      );
    } finally {
      operacionEnCurso.current = false;
      setProcesando(false);
    }
  };

  /**
   * Valida la entrega y crea un pedido pendiente.
   *
   * La creación del pedido ocurre en PostgreSQL.
   */
  const continuarEntrega = async () => {
    if (
      !sesion ||
      recuperandoPedido ||
      operacionEnCurso.current
    ) {
      return;
    }

    const errores: typeof erroresEntrega = {};

    if (!entrega.modalidad) {
      errores.modalidad =
        "Selecciona una modalidad de entrega.";
    }

    if (entrega.modalidad === "Envío a domicilio") {
      if (!entrega.canton.trim()) {
        errores.canton = "Indica el cantón.";
      }

      if (!entrega.direccion.trim()) {
        errores.direccion =
          "Indica la dirección exacta.";
      }
    }

    setErroresEntrega(errores);

    if (
      Object.keys(errores).length > 0 ||
      !entrega.modalidad
    ) {
      return;
    }

    // No crear otro pedido si ya existe uno seleccionado.
    if (idPedido !== null) {
      setPaso(3);
      return;
    }

    const modalidadApi: ModalidadEntrega =
      entrega.modalidad === "Envío a domicilio"
        ? "ENVIO"
        : "RETIRO";

    const direccion =
      modalidadApi === "ENVIO"
        ? `${entrega.provincia}, ${entrega.canton.trim()}. ${entrega.direccion.trim()}`
        : null;

    operacionEnCurso.current = true;
    setProcesando(true);

    try {
      const resultado = await apiCrearPedido(
        modalidadApi,
        direccion
      );

      if (!resultado.ok) {
        setErroresEntrega({
          modalidad: resultado.error,
        });
        return;
      }

      // Guardar el resumen antes de sincronizar el carrito.
      setLineasPedido(
        lineas.map((linea) => ({ ...linea }))
      );

      const nuevoIdPedido = resultado.dato.idPedido;

      setIdPedido(nuevoIdPedido);

      sessionStorage.setItem(
        clavePedidoPendiente(
          sesion.usuario.idUsuario
        ),
        String(nuevoIdPedido)
      );

      setErrorPago(undefined);
      setPaso(3);

      // Actualizar el carrito desde PostgreSQL.
      // Una falla de sincronización no debe crear otro pedido.
      try {
        await refrescar();
      } catch (error) {
        console.error(
          "No se pudo actualizar el carrito:",
          error
        );
      }
    } catch (error) {
      console.error(
        "Error al crear el pedido:",
        error
      );

      setErroresEntrega({
        modalidad:
          "No se pudo verificar la creación del pedido. " +
          "Revisa tus pedidos pendientes antes de intentarlo nuevamente.",
      });
    } finally {
      operacionEnCurso.current = false;
      setProcesando(false);
    }
  };

  /**
   * Realiza el pago simulado de un pedido existente.
   *
   * No crea un pedido nuevo.
   */
  const pagar = async () => {
    if (
      !sesion ||
      !idPedido ||
      operacionEnCurso.current
    ) {
      return;
    }

    const codigoNormalizado =
      codigo.trim().toUpperCase();

    let escenario: EscenarioPago;

    if (
      codigoNormalizado === "APROBADO" ||
      codigoNormalizado === "PAGO_OK"
    ) {
      escenario = "PAGO_OK";
    } else if (
      codigoNormalizado === "RECHAZADO" ||
      codigoNormalizado === "PAGO_RECHAZADO"
    ) {
      escenario = "PAGO_RECHAZADO";
    } else {
      setErrorPago(
        "Introduce APROBADO o RECHAZADO para simular el resultado."
      );
      return;
    }

    operacionEnCurso.current = true;
    setProcesando(true);
    setErrorPago(undefined);

    try {
      const resultado = await apiSimularPago(
        idPedido,
        escenario
      );

      if (!resultado.ok) {
        setErrorPago(resultado.error);
        return;
      }

      // HTTP 200 no garantiza que el pago fue confirmado.
      if (
        resultado.dato.resultadoConfirmacion !==
        "CONFIRMADO"
      ) {
        setErrorPago(
          resultado.dato.mensaje ||
          "El pago no fue confirmado. Puedes intentarlo nuevamente."
        );
        return;
      }

      // El pago quedó confirmado por PostgreSQL.
      sessionStorage.removeItem(
        clavePedidoPendiente(
          sesion.usuario.idUsuario
        )
      );

      // No vaciamos el carrito aquí.
      // Podría contener productos agregados después
      // de crear este pedido.
      setPaso(4);
    } catch (error) {
      console.error(
        "Error al verificar el pago:",
        error
      );

      setErrorPago(
        "No se pudo verificar el pago. " +
        "Consulta el estado del pedido antes de reintentarlo."
      );
    } finally {
      operacionEnCurso.current = false;
      setProcesando(false);
    }
  };

  const encabezado = (
    <div className="mb-10 flex flex-col items-center gap-3 text-center">
      <Sobretitulo>
        Compra segura · Simulación académica
      </Sobretitulo>

      <h1 className="font-serif text-5xl">
        {TITULOS[paso - 1]}
      </h1>

      <div className="mt-6 w-full">
        <Pasos actual={paso} />
      </div>
    </div>
  );

  // Evitar mostrar información de una sesión anterior.
  if (cargandoSesion || recuperandoPedido) {
    return (
      <Mensaje
        encabezado={encabezado}
        texto="Recuperando tu sesión y tus pedidos..."
      >
        <span className="text-sm text-gris">
          Consultando información.
        </span>
      </Mensaje>
    );
  }

  if (!sesion) {
    return (
      <Mensaje
        encabezado={encabezado}
        texto="Inicia sesión para revisar tu carrito y completar la compra."
      >
        <BotonEnlace href="/iniciar-sesion?volver=/carrito">
          Iniciar sesión
        </BotonEnlace>
      </Mensaje>
    );
  }

  // Confirmación visible únicamente después de
  // comprobar que el pedido fue confirmado.
  if (paso === 4 && idPedido !== null) {
    return (
      <div>
        {encabezado}

        <div className="mx-auto max-w-3xl">
          <ConfirmacionCompra
            idPedido={idPedido}
            correo={sesion.usuario.correo}
          />
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <Mensaje
        encabezado={encabezado}
        texto="Cargando tu carrito..."
      >
        <span className="text-sm text-gris">
          Consultando productos.
        </span>
      </Mensaje>
    );
  }

  // Carrito vacío: permitir recuperar pedidos pendientes.
  if (lineas.length === 0 && idPedido === null) {
    return (
      <div>
        <Mensaje
          encabezado={encabezado}
          texto="Tu carrito está vacío. Puedes explorar productos o continuar el pago de un pedido pendiente."
        >
          <BotonEnlace href="/catalogo">
            Explorar instrumentos
          </BotonEnlace>
        </Mensaje>

        <div className="mx-auto mt-8 max-w-3xl">
          <SelectorPedidosPendientes
            alSeleccionar={continuarPedidoPendiente}
          />

          {errorPago && (
            <p
              role="alert"
              className="mt-4 text-sm text-red-600"
            >
              {errorPago}
            </p>
          )}
        </div>
      </div>
    );
  }

  const costoEntrega =
  entrega.modalidad && paso > 1
    ? 0
    : null;

  return (
    <div>
      {encabezado}

      {/* Permitir recuperar pedidos sin crear otro. */}
      {paso === 1 && (
        <div className="mb-8">
          <SelectorPedidosPendientes
            alSeleccionar={continuarPedidoPendiente}
          />

          {errorPago && (
            <p
              role="alert"
              className="mt-4 text-sm text-red-600"
            >
              {errorPago}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <section className="border border-borde bg-papel p-7">
          {paso === 1 && <RevisionCompra />}

          {paso === 2 && (
            <EntregaCompra
              datos={entrega}
              errores={erroresEntrega}
              alCambiar={setEntrega}
            />
          )}

          {paso === 3 && (
            <PagoCompra
              codigo={codigo}
              error={errorPago}
              alCambiar={setCodigo}
            />
          )}
        </section>

        <ResumenCompra
          lineas={
            idPedido !== null
              ? lineasPedido
              : lineas
          }
          costoEntrega={costoEntrega}
        >
          {paso === 1 && (
            <Boton
              disabled={procesando}
              onClick={() => setPaso(2)}
            >
              Continuar
            </Boton>
          )}

          {paso === 2 && (
            <Boton
              disabled={procesando}
              onClick={continuarEntrega}
            >
              {procesando
                ? "Creando pedido..."
                : "Continuar"}
            </Boton>
          )}

          {paso === 3 && (
            <Boton
              disabled={procesando}
              onClick={pagar}
            >
              {procesando
                ? "Procesando..."
                : "Simular pago"}
            </Boton>
          )}

          {paso > 1 && idPedido === null && (
            <button
              type="button"
              disabled={procesando}
              onClick={() => setPaso(1)}
              className="text-sm text-gris hover:text-naranja disabled:opacity-50"
            >
              Volver al carrito
            </button>
          )}
        </ResumenCompra>
      </div>
    </div>
  );
}

function Mensaje({
  encabezado,
  texto,
  children,
}: {
  encabezado: ReactNode;
  texto: string;
  children: ReactNode;
}) {
  return (
    <div>
      {encabezado}

      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 border border-borde bg-papel p-12 text-center">
        <p className="text-gris">{texto}</p>
        {children}
      </div>
    </div>
  );
}
