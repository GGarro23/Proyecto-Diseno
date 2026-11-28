# Intervallum

Sistema web de una tienda y academia musical: catálogo y compra en línea con pago simulado, gestión de pedidos, inventario, oferta académica con inscripciones y asistencias, reportes, agente de recomendaciones y carga ETL de productos.

Proyecto del curso IC6821 Diseño de Software, Instituto Tecnológico de Costa Rica.

## Tecnologías

- Next.js 16 (App Router y rutas API), React 19, TypeScript y Tailwind CSS 4
- PostgreSQL alojado en Supabase, con la biblioteca `pg`
- `bcryptjs` para las contraseñas y `nodemailer` para los correos (SMTP de Gmail)

## Arquitectura

Monolito modular (ADR-1). Cada área funcional es un módulo en `src/modules/` con sus capas:

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Tipos | `schema.ts` | Tipos de datos del módulo |
| Datos | `repository.ts` / `consultas.ts` | Consultas SQL a PostgreSQL |
| Negocio | `service.ts` | Reglas, permisos y transacciones |
| Reglas y validaciones | `reglas.ts`, `validaciones.ts` | Funciones puras compartidas con el frontend |

Las rutas de `src/app/api/` reciben las solicitudes y llaman al servicio correspondiente. Las pantallas de `src/components/` consumen esas rutas. El acceso a la base de datos ocurre solo en el servidor (ADR-2 y ADR-4).

## Requisitos

- Node.js 20 o superior
- Una base de datos PostgreSQL (el equipo usa un proyecto de Supabase)

## Instalación

1. Clonar el repositorio e instalar las dependencias:

   ```bash
   git clone https://github.com/GGarro23/Proyecto-Diseno.git
   cd Proyecto-Diseno
   npm install
   ```

2. Crear el archivo `.env` en la raíz del proyecto (ver la sección siguiente).

3. Preparar la base de datos (ver "Base de datos").

4. Iniciar el proyecto y abrir http://localhost:3000:

   ```bash
   npm run dev
   ```

## Variables de entorno (`.env`)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión de PostgreSQL. En Supabase: Connect → Session pooler. La contraseña va sin corchetes. |
| `SESION_SECRETO` | Sí | Clave de al menos 32 caracteres para firmar la cookie de sesión. |
| `SMTP_HOST` | Para correos | Servidor SMTP, por ejemplo `smtp.gmail.com`. |
| `SMTP_PORT` | Para correos | Puerto SMTP, por ejemplo `465`. |
| `SMTP_USUARIO` | Para correos | Cuenta que envía los correos. |
| `SMTP_CLAVE` | Para correos | Contraseña de aplicación de esa cuenta. |
| `CORREO_REMITENTE` | Para correos | Remitente que verá el destinatario. |

Ejemplo:

```env
DATABASE_URL=postgresql://postgres.xxxxx:CONTRASENA@aws-0-us-east-1.pooler.supabase.com:5432/postgres
SESION_SECRETO=una-clave-larga-y-aleatoria-de-al-menos-32-caracteres
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USUARIO=correo@gmail.com
SMTP_CLAVE=contrasena-de-aplicacion
CORREO_REMITENTE=Intervallum <correo@gmail.com>
```

Para generar `SESION_SECRETO`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

El archivo `.env` no se sube al repositorio y sus variables no deben llevar el prefijo `NEXT_PUBLIC_`. Si faltan las variables SMTP, el sistema funciona igual y registra el correo como no enviado.

## Base de datos

Los scripts están en `DataBase/` y se ejecutan en orden:

| Script | Contenido |
|---|---|
| `00_crear_base_datos.sql` | Crea la base `intervallum` (solo en un PostgreSQL local; en Supabase se omite) |
| `01` a `08` | Tablas de cada área funcional (AF-01 a AF-08) y vistas de reportes |
| `09_integridad_cruzada_y_operaciones.sql` | Claves foráneas entre áreas y funciones de operaciones críticas |
| `10_datos_prueba_sin_usuarios.sql` | Categorías, productos, cursos y horarios de prueba |
| `11_verificacion_basica.sql` | Consultas de verificación |
| `12_ajustes_frontend.sql` | Teléfono, provincia y fecha de registro del usuario |
| `13_datos_prueba.sql` | Usuarios, roles, permisos, inscripciones, asistencias, pedidos y recomendaciones de prueba |
| `14_vaciar_carrito_al_crear_pedido.sql` | Vacía el carrito al registrar un pedido |
| `15_categorias_y_validaciones.sql` | Descripción y símbolo de las categorías, normalización de correos y teléfonos, y restricciones de validación |

En Supabase, ejecutar del `01` al `15` en el SQL Editor y activar RLS en las tablas para bloquear el acceso directo desde la API pública de Supabase. Más detalle en `DataBase/README.md`.

## Cuentas de prueba

Todas usan la contraseña `Intervallum1`.

| Rol | Correo |
|---|---|
| Cliente y Estudiante | ana@intervallum.cr, carlos@intervallum.cr |
| Otros estudiantes | valeria@correo.cr, sebastian@correo.cr, daniela@correo.cr, mateo@correo.cr, camila@correo.cr |
| Profesor | mariana@intervallum.cr, andres@intervallum.cr, lucia@intervallum.cr |
| Encargado de pedidos | pedidos@intervallum.cr |
| Administrador | admin@intervallum.cr |
| Administrador del sistema | sistema@intervallum.cr |
| Cuenta desactivada | inactivo@intervallum.cr |

## Estructura del proyecto

```
Proyecto-Diseno/
├─ DataBase/              Scripts SQL de PostgreSQL
├─ docs/                  ADR, minutas y sinopsis de cambios
├─ public/imagenes/       Imágenes de cursos y productos
└─ src/
   ├─ app/                Páginas del sitio y rutas API (app/api)
   ├─ components/         Pantallas y componentes por área
   │  └─ ui/              Componentes reutilizables
   ├─ lib/                Conexión a la BD, sesión, respuestas de la API, correo y utilidades
   └─ modules/            Lógica por área funcional
      ├─ autenticacion-usuarios/   AF-01 Gestión de usuarios y acceso
      ├─ catalogo-inventario/      AF-02 Catálogo e inventario
      ├─ ventas-pagos/             AF-03 Ventas en línea y pago simulado
      ├─ gestion-pedidos/          AF-04 Gestión de pedidos
      ├─ academia/                 AF-05 Academia
      ├─ reportes/                 AF-06 Reportes
      ├─ agente-apoyo/             AF-07 Agente de apoyo a la gestión
      ├─ etl/                      AF-08 ETL
      └─ notificaciones/           RF-29 Notificaciones por correo
```

## API

Todas las respuestas tienen la forma `{ "ok": true, "dato": ... }` o `{ "ok": false, "error": "..." }`. La sesión se envía en una cookie `httpOnly` firmada. Los permisos se validan en el servidor en cada solicitud.

| Ruta | Métodos | Acceso |
|---|---|---|
| `/api/autenticacion/sesion` | GET, POST, DELETE | Público (consultar, iniciar y cerrar sesión) |
| `/api/autenticacion/registro` | POST | Público |
| `/api/autenticacion/perfil` | PUT | Sesión iniciada |
| `/api/cuentas` | GET, POST | Administrador del sistema |
| `/api/cuentas/[idUsuario]` | PUT | Administrador del sistema |
| `/api/cuentas/[idUsuario]/desactivacion` | POST | Administrador del sistema |
| `/api/permisos` | GET, PUT | Administrador del sistema |
| `/api/productos` | GET / POST, PUT, PATCH | Público / permiso `catalogo.administrar` |
| `/api/categorias` | GET / POST, PUT | Público / permiso `catalogo.administrar` |
| `/api/inventario` | GET, POST | Permiso `catalogo.administrar` |
| `/api/imagenes-productos` | GET, POST | Permiso `catalogo.administrar` |
| `/api/carrito` | GET, POST, PATCH, DELETE | Sesión iniciada |
| `/api/pedidos` | GET, POST | Sesión iniciada (`?mios=true` para los propios); todos: Encargado de pedidos y Administrador |
| `/api/pedidos/[idPedido]` | GET / PATCH | Dueño, Encargado de pedidos o Administrador / Encargado de pedidos |
| `/api/pedidos/[idPedido]/pago` | POST | Dueño del pedido |
| `/api/pedidos/[idPedido]/notificaciones` | GET | Sesión iniciada |
| `/api/notificaciones` | GET | Sesión iniciada |
| `/api/cursos` | GET / POST, PUT | Público / permiso `academia.administrar` |
| `/api/horarios` | POST, PUT | Permiso `academia.administrar` |
| `/api/profesores-cursos` | GET, PUT | Permiso `academia.administrar` |
| `/api/inscripciones` | GET, POST | Sesión iniciada |
| `/api/asistencias` | GET, POST | Sesión iniciada / permiso `asistencias.registrar` |
| `/api/reportes/ventas` | GET | Administrador |
| `/api/reportes/inventario` | GET | Administrador |
| `/api/reportes/academia` | GET | Administrador |
| `/api/recomendaciones` | GET, POST | Permiso `agente.usar` |
| `/api/recomendaciones/[idRecomendacion]/revision` | POST | Permiso `agente.usar` |
| `/api/etl` | GET, POST | Permiso `etl.ejecutar` |

## Agente de apoyo

Genera recomendaciones con criterios predefinidos:

- **Reabastecimiento:** productos activos con 3 unidades o menos.
- **Promoción académica:** cursos abiertos, con cupo y con ocupación menor al 50 %.

No se repiten recomendaciones pendientes del mismo producto o curso. El Administrador las marca como revisadas.

## Carga ETL

Carga productos desde un archivo CSV de hasta 10 MB, en UTF-8 o Windows-1252, separado por `;` o `,`.

- Columnas obligatorias: `codigo`, `nombre`, `categoria`, `precio`, `existencias`.
- Columnas opcionales: `descripcion`, `imagen`.

Cada fila se valida y se carga por separado. Las filas con error se registran sin detener la carga. La ejecución queda como Exitosa, Parcialmente exitosa o Fallida. La pantalla de importación permite descargar una plantilla.

## Scripts

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run start` | Ejecutar la compilación de producción |
| `npm run lint` | Análisis estático con ESLint |
