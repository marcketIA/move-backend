# Dirección técnica: migración de infraestructura — Move IA Market

Este documento es la guía exacta para levantar la nueva infraestructura. Escrito para pasarle directo a quien vaya a ejecutarlo (tú, otro desarrollador, u otra IA).

## Resumen de la decisión

Evaluamos una propuesta de migrar todo a Cloudflare Workers + D1. **Se adoptó parcialmente**: las piezas de bajo riesgo y alto valor (base de datos real, video con expiración real, control de dispositivos) se implementaron ya. La migración completa del backend a Workers **se pospuso a propósito** — es una reescritura completa que no se justifica todavía sin ingresos reales que la respalden. Cuando haya tráfico y datos reales de costos, se puede reevaluar.

Nada del frontend (Vite, HTML, CSS, JS) cambió. Nada de la arquitectura de seguridad ya probada (JWT, límite de intentos, honeypot, protección de rutas) cambió — solo se le agregó lo que sigue.

---

## 1. Base de datos: Postgres real (reemplaza el archivo JSON)

**Qué cambió:** `server/src/db.js` ahora habla con Postgres real en vez de un archivo `data/db.json`. Las mismas funciones de siempre, ahora async.

**Qué hacer:**
1. Crear una cuenta gratuita en **uno** de estos (cualquiera sirve, todos tienen plan gratuito suficiente para empezar):
   - [Supabase](https://supabase.com)
   - [Neon](https://neon.tech)
   - [Railway](https://railway.app)
2. Crear un proyecto/base de datos nueva ahí.
3. Copiar el **connection string** que te dan (aparece como "Connection string" o "Database URL", formato `postgresql://usuario:contraseña@host:puerto/basededatos`).
4. Pegarlo en `server/.env` como `DATABASE_URL=...`
5. Correr el contenido de `server/schema.sql` una vez contra esa base — todos estos proveedores tienen un editor SQL en su panel donde pegarlo directo.

**Verificado:** corrí las 8 operaciones reales de `db.js` (crear usuario, buscar, crear código, vincular código a cuenta, listar por usuario, crear/listar/eliminar dispositivo) contra un Postgres real en memoria sembrado con el mismo `schema.sql` — las 8 pasaron sin errores. También confirmé que si la base de datos no está disponible, el servidor sigue vivo y responde con un error controlado (500), no se cae.

---

## 2. Video: Cloudflare Stream (reemplaza Bunny.net)

**Por qué el cambio:** protección de video con tokens firmados nativa, mismo ecosistema que el resto de la infraestructura recomendada, precio bajo ($5 por cada 1000 min. almacenados, $1 por cada 1000 min. vistos).

**Qué hacer:**
1. Crear cuenta en [Cloudflare](https://dash.cloudflare.com) y activar **Stream** (tiene plan de pago desde el inicio, pero es barato — no hay plan gratuito para Stream específicamente, a diferencia de Workers/D1).
2. Subir cada video del curso a Stream (panel o API). Cada video recibe un `uid`.
3. En cada video, activar **"Require signed URLs"**.
4. En **Stream > Settings > Signing Keys**, crear una clave. Te da un `Key ID` y una clave privada (PEM).
5. Copiar tu **Customer Code** (aparece en la URL de reproducción de cualquier video: `customer-XXXXX.cloudflarestream.com`).
6. Llenar en `server/.env`:
   ```
   CF_STREAM_KEY_ID=...
   CF_STREAM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   CF_STREAM_CUSTOMER_CODE=...
   CF_STREAM_MODULE_MAP={"modulo-1":"uid_real_del_video_1","modulo-2":"uid_real_del_video_2"}
   ```
   El mapa se actualiza cada vez que suben un módulo nuevo — no hace falta tocar código.

   **Estado actual:** ya hay 4 videos subidos y con su UID configurado en `server/.env.example`:
   - `modulo-1` → `33a52eac539f0fa15e5376114644eb9f`
   - `modulo-2` → `f111b82960930db3db5a69090a538724`
   - `modulo-3` → `38b64fa6dd85255a8b471940bdcd1173`
   - `modulo-4` → `a6ee243c583776f212511ad808510c43`

   Faltan: `modulo-5`, `modulo-6`, `modulo-7`.

   Falta: activar "Require signed URLs" en cada uno de estos 3 videos dentro del panel de Cloudflare Stream (si no lo has hecho todavía), y completar `CF_STREAM_KEY_ID`, `CF_STREAM_PRIVATE_KEY`, `CF_STREAM_CUSTOMER_CODE` con tus credenciales reales de firma — sin eso, el sistema sabe qué video mostrar pero no puede generar el enlace protegido todavía.

**Verificado:** el nuevo `signedUrl.js` firma un JWT (RS256) con la librería que ya estaba instalada, siguiendo el esquema documentado por Cloudflare. Sin credenciales configuradas, devuelve un marcador de posición claro en vez de fallar silenciosamente — mismo patrón defensivo que ya usábamos con Bunny.net.

---

## 3. Control de dispositivos (nuevo)

**Cómo funciona, y por qué NO es un cierre automático:** cada vez que alguien inicia sesión, se registra su dispositivo (navegador + sistema operativo, deducido del User-Agent — nada invasivo). El alumno ve su lista completa de dispositivos activos en su dashboard y puede cerrar sesión de cualquiera manualmente.

**Decisión deliberada:** la propuesta original sugería cerrar sesión automáticamente si detecta una IP o dispositivo nuevo. Se descartó a propósito — las IPs cambian constantemente con el uso normal (WiFi a datos móviles, por ejemplo), y cerrar sesión automáticamente generaría alumnos que sí pagaron sin poder entrar, exactamente lo que se pidió evitar. En su lugar: información visible + control manual del propio alumno.

Configurable con `MAX_DEVICES_PER_ACCOUNT` en `.env` (default: 2) — al superarlo, se le avisa al alumno en el login, nunca se le bloquea el acceso.

**Verificado:** probé el flujo completo — registro de dispositivo al login, listado, y eliminación — contra el Postgres en memoria, las 3 operaciones funcionaron correctamente.

---

## Lo que NO cambió (y por qué)

- **Todo el frontend** (Vite, componentes, diseño) — cero cambios.
- **JWT, límite de intentos, honeypot, verificación de contraseña con bcrypt** — exactamente igual que antes.
- **Stripe** — sigue siendo Stripe. La propuesta mencionaba PayPal como opción adicional; no se agregó todavía porque duplicaría todo el flujo de checkout/webhook sin necesidad clara hoy — se puede evaluar cuando haya demanda real de alumnos que prefieran PayPal sobre tarjeta.
- **La migración completa a Cloudflare Workers + D1** — pospuesta a propósito. Es una reescritura completa del backend en un runtime distinto (no Node.js), sin equivalentes directos para algunas librerías que usamos hoy. No es la inversión correcta antes de tener ingresos reales que la justifiquen.

## Próximo paso sugerido

Con esto ya no hace falta nada más de infraestructura para lanzar en serio. Lo que sigue es lo de siempre: contenido real de las clases, activar Stripe con claves reales, y subir los videos a Cloudflare Stream. Cuando eso esté, se puede desplegar `server/` (Render, Railway, Fly.io — cualquiera funciona igual de bien con este código) y el frontend (Vercel, Netlify).
