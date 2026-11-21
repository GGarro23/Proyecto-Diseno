## Estructura del proyecto


Proyecto-Diseno/
├─ docs/                      Documentación: ADR y sinopsis de cambios
├─ public/
│  └─ img/                    Imágenes del sitio (inicio y productos)
├─ src/
│  ├─ app/                    Rutas del sitio (cada carpeta es una dirección)
│  │  ├─ layout.tsx           Marco común: fuentes, encabezado y carrito
│  │  ├─ page.tsx             Página de inicio
│  │  ├─ not-found.tsx        
│  │  ├─ globals.css          
│  │  └─ catalogo/
│  │     ├─ page.tsx          Catálogo de productos (/catalogo)
│  │     └─ [idProducto]/
│  │        └─ page.tsx       Detalle de producto (/catalogo/1, /catalogo/2…)
│  │
│  ├─ components/             Componentes visuales reutilizables
│  │  ├─ ui/                  Piezas base: boton, campo, carrusel, foto, icono,
│  │  │                       pasos, tarjeta, textos
│  │  ├─ layout/              Estructura común: encabezado
│  │  ├─ catalogo/            Tarjeta de producto, listado y compra desde el detalle
│  │  └─ carrito/             Estado del carrito y botones para agregar productos
│  │
│  ├─ modules/                Lógica del sistema, un módulo por componente del C4
│  │  ├─ autenticacion-usuarios/   AF-01 Gestión de usuarios y acceso
│  │  ├─ catalogo-inventario/      AF-02 Catálogo e inventario
│  │  ├─ ventas-pagos/             AF-03 Ventas en línea y pago simulado
│  │  ├─ gestion-pedidos/          AF-04 Gestión de pedidos
│  │  ├─ academia/                 AF-05 Academia
│  │  ├─ reportes/                 AF-06 Reportes
│  │  ├─ agente-apoyo/             AF-07 Agente de apoyo a la gestión
│  │  ├─ etl/                      AF-08 ETL
│  │  └─ notificaciones/           RF-29 Notificaciones por correo
│  │
│  ├─ lib/                    Utilidades compartidas
│  │  ├─ db.ts                Conexión a PostgreSQL
│  │  └─ formato.ts           Formato de precios en colones
│  │
│  └─ mocks/                  Datos de prueba temporales (se eliminan al conectar la API)
│     ├─ categorias.ts
│     ├─ productos.ts
│     └─ sesion.ts            Sesión simulada mientras no exista autenticación
│
└─ AGENTS.md                  Instrucciones del proyecto para herramientas de IA