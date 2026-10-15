# ✅ Guía de Prueba - DC Nexus Pro

## 🌐 Acceso a la Plataforma

📍 Abre en tu navegador: **http://localhost:3000**

---

## 🧪 Pruebas a Realizar

### 1️⃣ Página Principal (Home)
- ✅ Deberías ver el hero con "Tramita tus Documentos"
- ✅ 5 documentos disponibles con cards
- ✅ Sección "Documentos Populares" con 6 tarjetas
- ✅ Botón verde de WhatsApp en esquina inferior derecha

**Botones a Probar:**
- ✅ "Comenzar Trámite" (ancla a #documentos)
- ✅ "Consultar por WhatsApp" (abre WhatsApp)
- ✅ "Solicitar" en cada documento (va a formulario)
- ✅ "Ver Todos" (catálogo completo)
- ✅ "Crear Cuenta" (sección CTA)
- ✅ "Hablar con Asesor" (WhatsApp)

---

### 2️⃣ Crear Cuenta (Registro)
1. Haz clic en **"Crear Cuenta"**
2. Serás redirigido a `/register.html`
3. Completa los campos:
   - 👤 **Nombre Completo** (mínimo 3 caracteres)
   - 📧 **Correo Electrónico** (válido)
   - 🔐 **Contraseña** (mínimo 6 caracteres)
4. Haz clic en **"Crear Cuenta"**
5. Si todo es correcto: ✅ Mensaje de éxito
6. Serás redirigido a login en 1.2 segundos

**Datos de Prueba:**
```
Nombre: Juan Pérez
Email: juan@example.com
Contraseña: 123456
```

---

### 3️⃣ Iniciar Sesión (Login)
1. Ve a **"Iniciar Sesión"** (botón en nav)
2. Ingresa tu email y contraseña (que creaste arriba)
3. Haz clic en **"Entrar"**
4. Si funcionan las credenciales: ✅ Te redirige al dashboard

**Links Adicionales en Login:**
- "¿No tienes cuenta?" → `/register.html`
- "¿Olvidaste tu contraseña?" → `/reset-request.html`

---

### 4️⃣ Solicitar Documento
1. Desde home, haz clic en **"Solicitar"** de cualquier documento
2. Verás un formulario con:
   - Información del documento
   - Precio
   - Descripción
   - Campos para completar
3. Completa el formulario
4. Haz clic en **"Enviar Solicitud"**

---

## 🔧 Solução Aplicada

Se corrigieron:
- ✅ Agregados estilos CSS para `.auth-form-subtitle`
- ✅ Agregados estilos CSS para `.form-message`
- ✅ Agregados estilos CSS para `.helper-text`
- ✅ Todos los botones ahora están completamente estilizados
- ✅ Formularios funcionan correctamente
- ✅ Servidor ejecutándose en puerto 3000

---

## ❌ Si algo aún no funciona

1. **Abre DevTools** (F12 o Ctrl+Shift+I)
2. Ve a la pestaña **"Console"**
3. Mira si hay errores rojo
4. Comparteme los errores que veas

---

## 📞 Contacto de Prueba

- **WhatsApp**: +52 (449) 839-4179
- **Email para Reset**: Usa `reset-request.html`

---

## 🚀 Servidor

El servidor está ejecutándose en:
```
http://localhost:3000
```

Si necesitas reiniciar:
```powershell
cd "C:\Users\yahir\Desktop\dc-company"
npm start
```

---

**¡Todo debería funcionar perfectamente ahora!** 🎉
