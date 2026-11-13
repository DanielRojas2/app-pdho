# PDHO — Plataforma Departamental Hotelera de Oruro

Aplicación web del **Observatorio Estadístico Departamental Hotelero (PDHO)** de Oruro. Permite a los establecimientos de hospedaje registrar sus reportes mensuales de estadísticas y ocupación hotelera, y a los administradores departamentales consolidar, monitorear y exportar la información del sector.

---

## Tabla de contenidos

1. [Guía rápida para usuarios no técnicos](#guía-rápida-para-usuarios-no-técnicos)
   - [¿Qué ofrece la plataforma?](#qué-ofrece-la-plataforma)
   - [Perfiles de usuario y pantallas](#perfiles-de-usuario-y-pantallas)
   - [¿Cómo encender y probar la aplicación en tu computadora?](#cómo-encender-y-probar-la-aplicación-en-tu-computadora)
   - [Qué tener en cuenta al probar](#qué-tener-en-cuenta-al-probar)
2. [Guía técnica para desarrolladores](#guía-técnica-para-desarrolladores)
   - [Stack tecnológico](#stack-tecnológico)
   - [Requisitos previos](#requisitos-previos)
   - [Instalación y levantamiento en desarrollo](#instalación-y-levantamiento-en-desarrollo)
   - [Conexión con el Backend (Proxy y Entornos)](#conexión-con-el-backend-proxy-y-entornos)
   - [Pruebas unitarias](#pruebas-unitarias)
   - [Compilación para producción y SSR](#compilación-para-producción-y-ssr)
   - [Despliegue con Docker](#despliegue-con-docker)
   - [Estructura del proyecto](#estructura-del-proyecto)
   - [Documentación adicional](#documentación-adicional)
3. [Solución de problemas frecuentes](#solución-de-problemas-frecuentes)

---

## Guía rápida para usuarios no técnicos

### ¿Qué ofrece la plataforma?

- **Registro digital de formularios hoteleros:** reemplaza planillas manuales permitiendo cargar datos de estadísticas y ocupación hotelera directamente desde el navegador.
- **Panel de control departamental:** centraliza la información de los establecimientos de hospedaje, su nivel de cumplimiento y los indicadores estadísticos del departamento.
- **Exportación de reportes:** permite descargar información en formatos **PDF** y **Excel**.
- **Uso como aplicación instalable (PWA):** puede instalarse en el escritorio o teléfono desde el navegador web.

### Perfiles de usuario y pantallas

Al ingresar a la aplicación, el sistema redirige automáticamente según el rol de la cuenta en `/login`:

- **Administrador Departamental (`ADMIN_DEPARTAMENTAL`)** — acceso bajo `/admin`:
  - **Inicio (`/admin/inicio`):** resumen general del observatorio.
  - **Estadísticas (`/admin/estadisticas`):** consulta de indicadores y estadísticas consolidadas.
  - **Cumplimiento (`/admin/cumplimiento`):** seguimiento de establecimientos que enviaron o tienen pendientes sus reportes.
  - **Establecimientos (`/admin/establecimientos`):** administración del padrón de establecimientos de hospedaje.

- **Operador o Dependiente de Hospedaje (`OPERADOR_HOSPEDAJE` / `DEPENDIENTE_HOSPEDAJE`)** — acceso bajo `/operador`:
  - **Mi Información (`/operador/mi-informacion`):** ficha y datos del establecimiento asignado.
  - **Mis Formularios (`/operador/mis-formularios`):** historial y estado de los formularios presentados.
  - **Formulario 1 (`/operador/formulario-1`):** carga de Estadísticas Hoteleras.
  - **Formulario 2 (`/operador/formulario-2`):** carga de Ocupación Hotelera.

### ¿Cómo encender y probar la aplicación en tu computadora?

Sigue estos pasos para abrir la aplicación en modo local:

1. **Asegúrate de tener instalado Node.js** (versión 20 o 22 recomendada). Si no lo tienes, descárgalo desde [nodejs.org](https://nodejs.org/).
2. **Asegúrate de que el servidor backend esté encendido** (por defecto en `http://localhost:8000`). Sin el backend activo, podrás ver la pantalla de inicio de sesión, pero no podrás iniciar sesión ni cargar datos reales.
3. Abre una terminal (PowerShell, CMD o la terminal de tu editor) dentro de la carpeta del proyecto `app-pdho`.
4. Si es la primera vez que abres el proyecto, instala las dependencias ejecutando:
   ```bash
   npm install
   ```
5. Inicia la aplicación con:
   ```bash
   npm start
   ```
6. Espera unos segundos hasta que aparezca la dirección en pantalla y abre tu navegador en:
   ```text
   http://localhost:4200/
   ```
7. Inicia sesión con un usuario válido en `/login` y navega por las secciones correspondientes a tu perfil.

### Qué tener en cuenta al probar

- Si cierras la terminal donde ejecutaste `npm start`, la aplicación dejará de responder en el navegador.
- Si ves mensajes de error al intentar iniciar sesión o cargar listados, verifica primero que el servicio backend esté corriendo en el puerto `8000`.
- Al editar archivos del código fuente mientras el servidor de desarrollo está corriendo, la página se recargará automáticamente.

---

## Guía técnica para desarrolladores

### Stack tecnológico

- **Framework:** Angular 22 (`@angular/core ^22.1.0`, Standalone Components, Signals)
- **Renderizado / Servidor:** `@angular/ssr ^22.1.8` + Express 5 (`express ^5.1.0`)
- **Lenguaje:** TypeScript `~6.0.2`
- **Exportación de documentos:** `jspdf ^4.2.1`, `jspdf-autotable ^5.0.9`, `xlsx ^0.18.5`
- **Pruebas unitarias:** Vitest `^4.0.8` + `jsdom ^28.0.0` mediante `@angular/build:unit-test`
- **Formateo de código:** Prettier `^3.8.1` (`.prettierrc`)

### Requisitos previos

- **Node.js:** v20.x o v22.x (el `Dockerfile` utiliza `node:22-alpine`).
- **npm:** `11.19.0` (declarado en `packageManager` dentro de `package.json`).
- **Backend PDHO:** API REST compatible con `docs/openapi.yaml` escuchando por defecto en `http://localhost:8000`.

### Instalación y levantamiento en desarrollo

```bash
# Instalar dependencias
npm install
# o para instalación reproducible desde package-lock.json
npm ci

# Levantar servidor de desarrollo (http://localhost:4200) con proxy activo
npm start
```

El script `npm start` ejecuta `ng serve`, que según `angular.json` ya incluye `"proxyConfig": "proxy.conf.json"`.

También puedes compilar en modo observación (*watch*) sin levantar el dev server:

```bash
npm run watch
```

### Conexión con el Backend (Proxy y Entornos)

- **Archivos de entorno:** `src/environments/environment.ts` y `src/environments/environment.development.ts` configuran:
  - `apiUrl: '/api/v1'`
  - `tokenStorageKey: 'pdho_access_token'`
  - `userStorageKey: 'pdho_current_user'`
- **Proxy de desarrollo (`proxy.conf.json`):**
  Redirige toda petición a `/api/*` hacia `http://localhost:8000` (`changeOrigin: true`). Si tu backend corre en otro host o puerto, actualiza `target` en `proxy.conf.json`.

### Pruebas unitarias

El proyecto utiliza Vitest integrado a través de Angular CLI:

```bash
npm test
```

Esto ejecuta `ng test` sobre los archivos `*.spec.ts` (por ejemplo, `src/app/app.spec.ts`).

> **Nota:** No hay un framework de pruebas end-to-end (`ng e2e`) preinstalado en el repositorio.

### Compilación para producción y SSR

Para generar el build de producción (cliente + servidor SSR en `dist/app-pdho/`):

```bash
npm run build
```

Para ejecutar la aplicación compilada con el servidor Node/Express de SSR (`src/server.ts`):

```bash
npm run serve:ssr:app-pdho
```

Por defecto, el servidor SSR escucha en la variable de entorno `PORT` o en `http://localhost:4000`.

### Despliegue con Docker

El archivo `Dockerfile` define una construcción multi-etapa:
1. **Etapa `build` (`node:22-alpine`):** instala dependencias con `npm ci` y ejecuta `npm run build -- --configuration production`.
2. **Etapa `serve` (`nginx:alpine`):** copia la salida `dist/*/browser` a `/usr/share/nginx/html` y expone el puerto `80`.

> **Importante:** El `Dockerfile` referencia `COPY nginx.conf /etc/nginx/conf.d/default.conf`. Asegúrate de proveer un archivo `nginx.conf` en la raíz del proyecto (con soporte para rutas SPA y proxy hacia `/api`) antes de construir la imagen con `docker build`.

### Estructura del proyecto

```text
app-pdho/
├── docs/
│   ├── integracion_angular.md   # Guía de arquitectura e integración con la API
│   └── openapi.yaml             # Especificación OpenAPI del backend PDHO
├── public/                      # Recursos estáticos, logos, íconos PWA, manifest y sw.js
├── src/
│   ├── app/
│   │   ├── core/                # Guards, interceptores HTTP, modelos y servicios base
│   │   ├── domains/
│   │   │   ├── auth/            # Inicio de sesión, guards y servicio de autenticación
│   │   │   ├── admin/           # Módulo Administrador Departamental
│   │   │   └── operador/        # Módulo Operador / Dependiente de Hospedaje
│   │   ├── shared/ui/           # Componentes de interfaz reutilizables
│   │   ├── app.routes.ts        # Rutas principales y control de acceso por rol
│   │   └── app.routes.server.ts # Configuración de renderizado SSR/Prerender
│   ├── environments/            # Variables de entorno (desarrollo / producción)
│   └── server.ts                # Servidor Express para SSR y cabeceras PWA
├── angular.json                 # Configuración de build, serve (proxy) y test
├── DESIGN.md                    # Tokens de diseño (colores y tipografía)
├── Dockerfile                   # Construcción multi-etapa con Node 22 + Nginx
├── package.json                 # Dependencias y scripts npm
└── proxy.conf.json              # Proxy local /api -> http://localhost:8000
```

### Documentación adicional

- Especificación de la API: [`docs/openapi.yaml`](docs/openapi.yaml)
- Guía de integración Angular 22 y contratos: [`docs/integracion_angular.md`](docs/integracion_angular.md)
- Tokens de diseño del observatorio: [`DESIGN.md`](DESIGN.md)

---

## Solución de problemas frecuentes

- **Error de conexión o `404`/`502` en `/api/v1/...` al iniciar sesión:**
  Verifica que el backend esté activo en `http://localhost:8000` o ajusta `target` en `proxy.conf.json` y reinicia `npm start`.
- **Puerto `4200` ya en uso:**
  Ejecuta el servidor en otro puerto con:
  ```bash
  npx ng serve --port 4300
  ```
- **Cambios en la interfaz no se reflejan por caché del Service Worker (`sw.js`):**
  En las herramientas de desarrollo del navegador (*DevTools > Application > Service Workers*), marca *Update on reload* o desregistra el Service Worker y recarga la página.
