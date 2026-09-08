<p align="center">
  <img src="https://raw.githubusercontent.com/Devmillerr/Devmillerr/main/assets/proyecto-02-billing-api.svg" alt="Billing & Services API" width="620">
</p>

<h1 align="center">Billing & Services API</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Express-4.19-7C3AED?style=flat-square&logo=express&logoColor=C4B5FD&labelColor=150F26" alt="Express">
  <img src="https://img.shields.io/badge/TypeScript-5.4-7C3AED?style=flat-square&logo=typescript&logoColor=C4B5FD&labelColor=150F26" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-5.16-6D28D9?style=flat-square&logo=prisma&logoColor=C4B5FD&labelColor=150F26" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-6D28D9?style=flat-square&logo=postgresql&logoColor=C4B5FD&labelColor=150F26" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Jest-8B5CF6?style=flat-square&logo=jest&logoColor=C4B5FD&labelColor=150F26" alt="Jest">
</p>

API REST para la gestión comercial de una empresa de servicios digitales: catálogo de productos y servicios, presupuestos, contratos, compras y facturación, con control de permisos por usuario y generación de documentos en PDF.

## El problema

Una empresa que vende productos y servicios digitales necesita algo más que un CRUD de clientes: tiene que cotizar antes de vender, dejar constancia de lo cotizado, asociar contratos de servicio a un equipo de trabajo, y emitir facturas y recibos con impuestos y descuentos aplicados. Hacerlo en hojas de cálculo hace que se pierdan versiones de las cotizaciones y que la facturación no coincida con lo pactado.

## La solución

Una API REST con el dominio modelado explícitamente — presupuesto, contrato, compra y factura son entidades distintas y relacionadas, no estados de una misma tabla — y con tres decisiones que sostienen el resto:

- **Validación en el borde.** Cada ruta declara su esquema Joi y lo aplica con un `validatorHandler` antes de llegar al controlador, así ninguna regla de negocio recibe datos sin verificar.
- **Permisos granulares.** 30 permisos nombrados (`CREATE_INVOICE`, `VIEW_REPORTS`, `ASSIGN_ROLE`…) sobre cuatro roles, en una tabla intermedia usuario–permiso. El control es por acción, no por rol.
- **Capas separadas.** Router → controlador → servicio de base de datos. La lógica de acceso a datos no vive en las rutas.

## Funcionalidades

- **Usuarios y perfiles** — registro con contraseña cifrada (bcrypt), datos de contacto y consulta de compras y presupuestos por usuario.
- **Autenticación** — inicio de sesión con Passport (estrategia local) y sesión persistida en servidor.
- **Catálogo** — productos con tipo (`WEB`, `FIVEM`, `DISCORD_BOT`) y servicios con precio.
- **Presupuestos** — cotizaciones con líneas propias que pueden referenciar productos del catálogo o describir ítems a medida.
- **Contratos de servicio** — con estado, fechas de inicio y fin, notas, y asignación de miembros del equipo al contrato.
- **Compras y facturación** — método y estado de pago, referencia de transacción, vencimiento, y cargos de tipo impuesto o descuento por factura.
- **Documentos PDF** — factura, cotización y recibo de pago generados con pdfMake, con el logotipo de la empresa.

## Arquitectura

```
src/
├── api/                  routers Express: define rutas y aplica validación
├── controllers/          orquestan la petición y la respuesta
├── services/
│   ├── database/         acceso a datos vía Prisma
│   ├── strategies/       estrategia local de Passport
│   └── pdf.ts            plantillas de factura, cotización y recibo
├── middleware/           validatorHandler (Joi)
├── middlewares.ts        notFound y errorHandler
├── utils/schema/         esquemas Joi por recurso
├── interfaces/           tipos de permisos, PDF y respuestas
└── app.ts                composición de la app Express
```

Flujo de una petición:

```
POST /api/v1/budgets
  → router          valida el body contra su esquema Joi
  → controller      resuelve el caso de uso
  → db service      persiste con Prisma
  → PostgreSQL
```

## Modelo de datos

| Entidad | Rol en el dominio |
| --- | --- |
| `users` / `userDetails` | Cuenta y datos de contacto. Rol `USER`, `TEAM`, `ADMIN` u `OWN` |
| `permissions` / `user_permissions` | Permisos nombrados asignados por usuario |
| `products` / `services` | Catálogo de lo que se vende |
| `budgets` / `budget_products` | Presupuesto y sus líneas |
| `service_contracts` / `services_worke` | Contrato de servicio y equipo asignado |
| `purchases` / `purchases_products` | Compra confirmada y sus productos |
| `invoices` / `invoices_products` / `invoices_charges` | Factura, líneas facturadas e impuestos o descuentos |

## Stack

| Tecnología | Para qué se usa |
| --- | --- |
| Express + TypeScript | Servidor HTTP y tipado del dominio |
| Prisma ORM | Modelado, migraciones y consultas |
| PostgreSQL | Persistencia relacional |
| Passport (local) + express-session | Autenticación y sesión |
| Joi | Validación de body y params por ruta |
| bcrypt | Cifrado de contraseñas |
| pdfMake | Facturas, cotizaciones y recibos |
| @hapi/boom | Errores HTTP consistentes |
| Jest + Supertest | Testing |
| ESLint, Prettier, Husky | Calidad de código y hooks de pre-commit |

## Instalación

Requisitos: Node.js 18+, PostgreSQL 14+.

```bash
git clone https://github.com/Devmillerr/nestjs-finance-api.git
cd nestjs-finance-api
npm install
cp .env.example .env        # completar DATABASE_URL
npx prisma migrate dev
npx prisma db seed          # opcional: datos de ejemplo
npm run dev
```

La API queda disponible en `http://localhost:5000/api/v1`.

## Variables de entorno

| Variable | Descripción | Obligatoria |
| --- | --- | --- |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | Sí |
| `PORT` | Puerto del servidor (por defecto 5000) | No |
| `SESSION_SECRET` | Secreto de firma de la sesión | Sí |
| `COOKIE_SECRET` | Secreto de firma de cookies | Sí |

## Endpoints

Prefijo: `/api/v1`

**Autenticación**

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/auth/register` | Registro de usuario |
| `POST` | `/auth/login` | Inicio de sesión |
| `GET` | `/auth/status` | Sesión actual |

**Usuarios**

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/users/all` | Listado |
| `GET` | `/users/:id/u` | Detalle |
| `GET` | `/users/:id/p` | Compras del usuario |
| `GET` | `/users/:id/g` | Presupuestos del usuario |
| `POST` | `/users` | Crear |
| `PUT` | `/users/:id` | Actualizar |
| `PUT` | `/users/:id/details` | Actualizar datos de contacto |
| `DELETE` | `/users/:id` | Eliminar |

**Catálogo, presupuestos y compras**

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET POST PUT DELETE` | `/products` | Productos |
| `GET POST PUT DELETE` | `/budgets` | Presupuestos |
| `GET POST PUT DELETE` | `/purchases` | Compras |

**Servicios y contratos**

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET POST PUT DELETE` | `/services` | Servicios |
| `GET POST PUT DELETE` | `/services/contracts` | Contratos de servicio |
| `GET POST PUT DELETE` | `/services/worke` | Asignación de equipo |

**Documentos**

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/reports/invoice` | Genera una factura en PDF |
| `POST` | `/reports/quotation` | Genera una cotización en PDF |
| `POST` | `/reports/payment` | Genera un recibo de pago en PDF |

## Testing

```bash
npm run test        # suite Jest
npm run lint        # ESLint con corrección automática
npm run typecheck   # verificación de tipos sin emitir
```

Husky ejecuta Prettier sobre los archivos en stage antes de cada commit.

## Autor

**Miler Castro Martínez** — Backend Developer · Analista de Implementación de Software

[Portfolio](https://portfolio-delta-fawn-41.vercel.app/) · [LinkedIn](https://www.linkedin.com/in/devmillerr/) · castrojordy378@gmail.com

## Licencia

MIT
