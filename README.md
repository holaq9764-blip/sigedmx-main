# 🏢 DC Nexus - Orientación y gestión documental

Un sitio web para explorar servicios de orientación documental, enviar solicitudes y consultar su estado desde una cuenta.

## ✨ Características

- **🎨 Interfaz adaptable**: Catálogo, búsqueda y filtros de documentos en móvil y escritorio
- **🔐 Cuentas**: Registro, inicio de sesión y recuperación de contraseña
- **📱 Mobile-First**: Funciona perfectamente en celular, tablet y escritorio
- **💬 Soporte WhatsApp**: Contacto directo con asesor especializado
- **📊 Panel de seguimiento**: Consulta solicitudes y estados
- **🧾 Comprobantes**: Carga y revisión de recibos por el administrador
- **📦 5+ Tipos de Documentos**:
  - 🎖️ Acta de Nacimiento (gestión desde $299)
  - 🆔 CURP (gestión desde $199)
  - ⚖️ Certificado de Defunción (gestión desde $399)
  - ⚔️ Antecedentes Penales (gestión desde $349)
  - 📄 Otros Documentos (precio por confirmar)

## 🚀 Inicio Rápido (Windows)

### Requisitos
- Node.js 20+ ([Descargar](https://nodejs.org))
- npm (viene incluido)

### Instalación
```powershell
cd "C:\ruta\al\proyecto"
npm.cmd install
npm.cmd start
```

Luego abre en tu navegador: **http://localhost:3000**

## 📚 Uso

### Acceso
1. **Página principal**: `http://localhost:3000`
2. **Crear cuenta**: Haz clic en "Crear Cuenta" o ve a `/register.html`
3. **Iniciar sesión**: Va a `/login.html`
4. **Panel**: Accesible después de iniciar sesión
5. **Solicitar un documento**: Elige un elemento del catálogo y completa el formulario

### Funciones Principales
- ✅ Registro e inicio de sesión
- ✅ Buscar y filtrar el catálogo
- ✅ Crear solicitudes y guardar su folio
- ✅ Ver estado de solicitudes
- ✅ Cargar comprobantes
- ✅ Revisión de comprobantes por administrador

## 🎯 Endpoints API

En las rutas protegidas, envía el token recibido al iniciar sesión en el encabezado `Authorization: Bearer <token>`.

```
POST   /api/register              - Crear cuenta
POST   /api/login                 - Iniciar sesión
POST   /api/password-reset-request - Solicitar reset
POST   /api/password-reset        - Restablecer contraseña
POST   /api/orders                - Crear solicitud
GET    /api/orders                - Listar solicitudes (Auth: Bearer <token>)
POST   /api/orders/:id/upload     - Cargar archivo
POST   /api/orders/:id/validate   - Aprobar/Rechazar (Auth admin)
GET    /health                    - Estado del servidor
```

Autenticación:
- `POST /api/login` devuelve `{ user, token }` firmado con `JWT_SECRET`.
- `POST /api/orders` acepta creación pública; si envías `Authorization: Bearer <token>`, el servidor asocia automáticamente la orden al usuario autenticado.
- `GET /api/orders` exige `Authorization: Bearer <token>` y devuelve solo las órdenes del usuario (o todas si el email coincide con `ADMIN_EMAIL`).
- `POST /api/orders/:id/upload` permite carga por dueño/admin autenticado o con `X-Upload-Token` devuelto al crear la orden.
- `POST /api/orders/:id/validate` solo se permite al admin (`ADMIN_EMAIL` + token válido).

## 🔧 Estructura

```
sigedmx-main/
├── public/                       # Sitio web
│   ├── index.html               # Catálogo, buscador y preguntas frecuentes
│   ├── login.html               # Inicio de sesión
│   ├── register.html            # Registro
│   ├── dashboard.html           # Panel y revisión de solicitudes
│   ├── solicitar.html           # Formulario dinámico de solicitud
│   ├── reset-request.html       # Solicitar recuperación de contraseña
│   ├── reset-password.html      # Guardar contraseña nueva
│   ├── css/style.css            # Estilos responsive
│   ├── js/app.js                # Interacciones y conexión con API
├── storage/
│   └── uploads/                 # Comprobantes privados (no se sirven como archivos públicos)
├── database/                    # Base datos JSON
│   ├── users.json               # Se crea al iniciar; no subir a Git
│   └── orders.json              # Se crea al iniciar; no subir a Git
├── server.js                    # Servidor Node/Express
└── package.json                 # Dependencias
```

## ⚙️ Configuración

### Variables de Entorno
Copia `.env.example` a `.env`:
```bash
PORT=3000
NODE_ENV=production
JWT_SECRET=reemplaza_con_un_secreto_aleatorio_de_32_caracteres_o_mas
ADMIN_EMAIL=admin@tudominio.com
DATA_DIR=/var/data
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

Usa Node.js 20 o posterior. En producción, configura `JWT_SECRET` (al menos 32 bytes aleatorios), `ADMIN_EMAIL` con el mismo correo que usarás para la cuenta administradora y `NODE_ENV=production`; el servidor rechazará iniciar si el secreto JWT falta o es demasiado corto. `DATA_DIR` es opcional en local; en Render debe coincidir con el punto de montaje del disco persistente. Sin SMTP, la recuperación devuelve un token solo en desarrollo; en producción la ruta queda deshabilitada hasta configurar el correo.

Las bases de datos JSON y los comprobantes se guardan bajo `DATA_DIR`. Los comprobantes se descargan mediante una ruta autenticada; no los guardes dentro de `public`.

### Marca y contacto
- Logo: `public/images/logo-dc-company.jpg`
- WhatsApp: [+52 449 826 8388](https://wa.me/524498268388)

## 🐛 Solución de Problemas

**"Puerto 3000 en uso"**
```powershell
$env:PORT = "3001"
npm.cmd start
```

**"Módulo no encontrado"**
```powershell
npm.cmd install
```

**"No carga el servidor"**
- Verifica: `node -v` (debe ser 20+)
- Revisa console.log en `server.js`
- Accede a `http://localhost:3000/health`

## 📊 Base de Datos

- Usuarios guardados en `database/users.json`
- Solicitudes en `database/orders.json`
- Se crean automáticamente al iniciar

## 🔒 Seguridad

✅ Contraseñas con hash (bcrypt)  
✅ Validación de datos  
✅ Autenticación por tokens  
✅ Límite 10MB en uploads  
✅ Solo archivos: JPEG, PNG, PDF  

La plataforma ofrece orientación y gestión independiente: no es una entidad gubernamental ni garantiza la emisión de documentos. Confirma requisitos y costos oficiales antes de realizar pagos. No publiques el sitio con datos reales hasta configurar correctamente secretos, correo, almacenamiento privado y HTTPS.

## 📧 Soporte

- 📱 WhatsApp: [Contactar](https://wa.me/524498268388)
- 🐛 Issues: Reporta en el servidor

## 📝 Licencia

© 2026 DC Nexus. Todos los derechos reservados.

---

**v1.0.0** | Actualizado el 14 de octubre de 2026.

## Publicar en línea con Render

Este proyecto necesita un servidor Node.js y almacenamiento persistente. En Render, los discos persistentes requieren un servicio de pago; sin disco, las cuentas, solicitudes y comprobantes guardados en archivos pueden perderse al reiniciar o volver a desplegar.

1. Crea un repositorio privado en GitHub para el proyecto. Puedes usar GitHub Desktop para publicar la carpeta. Revisa que `.env`, `database/*.json`, `storage/uploads/` y `node_modules/` no se suban; `.gitignore` ya excluye esos datos.
2. En [Render](https://dashboard.render.com), crea un **New Web Service** y conecta el repositorio.
3. Configura **Build Command** como `npm install` y **Start Command** como `npm start`.
4. En **Environment**, agrega `NODE_ENV=production`, `ADMIN_EMAIL` (el correo que usarás para administrar), `JWT_SECRET` (genera uno con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`), y `DATA_DIR=/var/data`.
5. En **Disks**, crea un disco persistente cuyo **Mount Path** sea `/var/data`. El valor de `DATA_DIR` debe coincidir exactamente con ese punto de montaje.
6. Configura `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y, si aplica, `FROM_EMAIL` para que funcione la recuperación de contraseña en producción.
7. Despliega. En la URL HTTPS que Render te asigne, abre `/register.html` y crea la cuenta con el mismo correo de `ADMIN_EMAIL`; luego inicia sesión y comprueba el panel. Visita `/health` para confirmar que el servidor está activo.

El alojamiento crea una instalación nueva: los usuarios, solicitudes y comprobantes locales no se trasladan automáticamente. No los subas a GitHub; si necesitas conservar datos reales, transfiérelos por un método privado. Consulta la [guía de Render para Node/Express](https://render.com/docs/deploy-node-express-app) y la [documentación de discos persistentes](https://render.com/docs/disks).