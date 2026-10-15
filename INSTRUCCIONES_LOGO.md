# 📋 Instrucciones para Reemplazar el Logo

## 📁 Ubicación del Logo

**Ruta actual:** `public/images/logo.svg`

## 🖼️ Cómo Usar Tu Logo

### Opción 1: Reemplazar el SVG (Recomendado)
1. Descarga tu logo "DC" en formato **SVG** o **PNG**
2. Guárdalo en: `public/images/logo.svg`
3. El sistema se actualizará automáticamente

### Opción 2: Usar una Imagen PNG
1. Guarda tu imagen como: `public/images/logo.png`
2. Abre `public/index.html` y reemplaza:
   ```html
   <img src="images/logo.svg" alt="DC Nexus Pro" class="logo-img">
   ```
   Por:
   ```html
   <img src="images/logo.png" alt="DC Nexus Pro" class="logo-img">
   ```
3. Haz lo mismo en `login.html` y `register.html`

---

## 🎨 Tamaños del Logo en la Plataforma

| Ubicación | Tamaño | Clase CSS |
|-----------|--------|----------|
| Header (Navegación) | 45px × 45px | `.logo-img` |
| Login/Registro | 80px × 80px | `.logo-img-large` |

---

## 💡 Recomendaciones

✅ **Formato ideal:** SVG (escalable, sin pérdida)  
✅ **Formato alternativo:** PNG con fondo transparente  
✅ **Resolución mínima:** 200px × 200px  
✅ **Proporción:** Cuadrado (1:1)  

---

## 📝 Archivos Donde Aparece el Logo

1. **Header (Navegación):** `public/index.html` - Línea 18
2. **Login:** `public/login.html` - Línea 16
3. **Registro:** `public/register.html` - Línea 16

---

## ✨ Colores Compatibles con el Nuevo Diseño

La plataforma ahora usa una **paleta de colores suave y elegante**:

- **Púrpura:** #8B5CF6 (primario)
- **Verde:** #34D399 (éxito)
- **Rojo:** #F87171 (errores)
- **Ámbar:** #FBBF24 (advertencias)

Tu logo lucirá mejor si usa estos tonos suaves en lugar de colores muy fuertes.

---

**¡Tu plataforma está lista!** 🚀

---

## 📝 Datos de Usuario

**Nombre:** Juan Pérez  
**Email:** juan@test.com  
**Contraseña:** 123456
