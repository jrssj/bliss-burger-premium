# Bliss Burger Co. — Sitio web premium

Sitio estático responsive con carta completa y pedidos por WhatsApp.

## Qué trae

- 43 referencias de la carta compartida: 9 hamburguesas, 3 perros calientes, 1 picada, 6 opciones de papas, 11 adicionales y 13 bebidas.
- Precios, descripciones y notas de inclusión (pan brioche y papas francesas en hamburguesas y perros) tomados de las capturas de WhatsApp Business entregadas el 23-10-2026.
- Buscador, filtros por categoría y detalle de cada producto.
- Carrito con cantidades, notas por producto y subtotal de referencia.
- Formulario de domicilio o recogida en el local, nombre, contacto y forma de pago.
- Envío del detalle del pedido a **WhatsApp 316 519 6128** mediante un enlace `wa.me`.
- Sección de pagos Bre-B con QR aportado por el negocio, beneficiario BLISS BURGER CO y llave `0090503048`.
- Dirección, horarios, enlace a Maps, Instagram y TikTok.
- Dos capturas fuente de la carta para que el usuario pueda contrastar los precios.
- Fotografías **ilustrativas**, que no necesariamente representan el producto exacto.

## Abrirlo en tu computador

1. Descarga y descomprime el archivo ZIP.
2. Abre `index.html` o haz doble clic en `abrir-web.bat` en Windows.
3. Para probarlo con un servidor local (recomendado), abre la terminal dentro de la carpeta y ejecuta:

   ```bash
   py -m http.server 8000
   ```

   Luego visita `http://localhost:8000` en tu navegador. También funciona `python -m http.server 8000` si `py` no está instalado.

4. Para continuar desde tu directorio anterior de Codex, **haz una copia de seguridad de lo que haya allí** y copia el contenido de esta carpeta a:

   ```text
   C:\Users\jr846\Documents\Codex\2026-10-23\https-www-instagram-com-blissburger-co
   ```

   No es necesario cambiar la estructura de carpetas; `index.html` debe quedar en la raíz y tener al lado `css`, `js` y `assets`.

## Editar productos y precios

Edita el archivo `js/catalogo.js`: `BLISS_MENU` contiene los 43 productos, y `BLISS_CONFIG` incluye WhatsApp, dirección, horario y llave Bre-B. Revisa los cambios y vuelve a publicar. Los precios se muestran como **referencia** y el restaurante confirma el monto final.

## Publicación

Al ser un sitio HTML/CSS/JS sin backend, puede alojarse en cualquier hosting de archivos estáticos, como Vercel, Netlify o GitHub Pages. No requiere configuración de API.

## Cómo funciona el pago

La web **NO procesa, valida ni confirma pagos**. Únicamente permite consultar el QR y copiar la llave Bre-B proporcionados por el negocio. El cliente debe esperar la confirmación del restaurante por WhatsApp antes de transferir y enviar allí el comprobante. El código QR es una imagen compartida por el negocio, no una integración bancaria certificada: verifica que se pueda escanear antes de publicar.

## Limitaciones

- El mensaje de WhatsApp se **prepara**, pero el cliente debe enviarlo manualmente desde WhatsApp.
- No hay backend para administración remota, inventario, automatización de pedidos ni pagos en línea.
- El costo de domicilio y la disponibilidad se confirman por WhatsApp.
- El carrito usa almacenamiento local en el navegador en contextos donde esté permitido; no sincroniza con otros dispositivos.

## Estructura

```text
index.html         Página principal
css/styles.css     Diseño responsive
js/catalogo.js     Carta, datos del negocio y precios
js/app.js          Carrito, filtros, checkout y WhatsApp
assets/            Logo, fotos ilustrativas, cartas originales y QR de pago
abrir-web.bat      Abre index.html en Windows
```
