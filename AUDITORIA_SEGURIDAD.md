# Auditoría de seguridad — endurecimiento del backend

Resumen de qué se revisó, qué se adoptó, qué se corrigió encima, y qué falta configurar con datos reales.

## Contexto

Se recibió una revisión de seguridad hecha por otras herramientas (ChatGPT/Gemini) sobre este mismo proyecto. Se auditó **cada cambio propuesto línea por línea** contra el código real antes de aceptar nada — nueve cambios se confirmaron como correctos y se adoptaron; en el proceso de verificarlos con pruebas reales (no solo leyendo el código) se encontró **un error nuevo y grave** que ni esa revisión ni la implementación original habían detectado, y se corrigió.

## Cambios adoptados (verificados uno por uno)

1. **URL firmada de Cloudflare Stream corregida** — el token ahora incluye `sub: videoUid`, y se usa reemplazando el ID del video en la ruta de reproducción (`/TOKEN/manifest/video.m3u8`), tal como exige la documentación oficial de Cloudflare. La versión anterior tenía el token como parámetro `?token=` suelto, que no es el formato que Cloudflare espera — no habría funcionado en producción.
2. **Revalidación de matrícula en cada petición de video** — antes, una vez que el JWT era válido, se confiaba en él hasta que expirara. Ahora, cada vez que alguien pide ver un módulo, se vuelve a consultar la base de datos: si el curso ya venció, se reembolsó, o el módulo no está incluido en la ruta que compró, se bloquea en el momento — no hay que esperar a que expire el token.
3. **`COURSE_MODULE_MAP` con bloqueo por defecto** — si un módulo no está explícitamente listado como parte de un curso, se bloquea. Nunca se concede acceso "por si acaso".
4. **CORS restringido a un dominio explícito** (`FRONTEND_ORIGIN`) — antes cualquier sitio web podía llamar a la API desde el navegador de un visitante. Ahora solo el dominio real configurado.
5. **Cabeceras de seguridad estándar** (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) y límite de tamaño en el cuerpo de las peticiones, para reducir superficie de ataque.
6. **Webhook de Stripe idempotente** — Stripe puede notificar el mismo pago más de una vez (reintentos de red). Ahora se verifica primero si ya existe un código para esa sesión de pago antes de crear uno nuevo, **y además** la base de datos tiene una restricción `UNIQUE` que lo impediría aunque el código fallara. Verificado con una prueba real: un segundo intento de insertar el mismo `stripe_session_id` es rechazado por la base de datos.
7. **`VITE_API_URL` configurable** — la URL del backend ya no está escrita a mano (`localhost:8787`) dentro del código; ahora se lee de una variable de entorno, necesario para que el sitio funcione una vez desplegado en un dominio real.
8. **Se eliminó el acceso de demostración sin backend** — antes, si el servidor no respondía, el login aceptaba credenciales de prueba fijas como respaldo. Esto era útil para ver el diseño sin levantar el servidor, pero significa que la autorización vivía parcialmente en el navegador. Ahora la autorización existe **solo** en la API: si el servidor no responde, nadie entra, sin excepción. Esto es justo lo que se pidió ("que sea 1000% comprobado").
9. **`isLoggedIn()` ahora exige un token real**, no solo una bandera en `localStorage`.

## Lo que se encontró y se corrigió además, durante la verificación

**Bug de disponibilidad grave: si la base de datos no respondía, todo el servidor se caía — no solo esa petición.** Se reprodujo el problema en vivo: una sola petición con la base de datos inalcanzable tumbaba el proceso completo de Node, dejando a **todos** los usuarios sin poder entrar (incluidos los que sí pagaron), hasta reiniciar el servidor manualmente. Esto contradice directamente el objetivo central: "que la gente que pagó pueda entrar sin estrés."

Causa: varias rutas (`/auth/verify`, y tres rutas nuevas de cuenta/dispositivos) llamaban a la base de datos sin `try/catch`, y Node moderno termina el proceso ante una promesa rechazada sin capturar. Se corrigió:
- Se envolvió cada llamada a la base de datos en las rutas afectadas con manejo de errores, devolviendo un error controlado (500) en vez de crashear.
- Se agregó un manejador de errores a nivel del pool de conexión de Postgres (`pool.on('error', ...)`), que es la corrección documentada por la propia librería `pg` para este tipo de fallo.

**Verificado en vivo:** se repitió exactamente la misma petición que antes tumbaba el servidor. Ahora responde con un error limpio y el servidor sigue funcionando con normalidad para la siguiente petición.

## Lo que NO cambió

- Backend Express, JWT, límite de intentos de login, honeypot anti-bots, bcrypt para contraseñas, protección de rutas de video — la lógica central sigue siendo la misma que ya estaba probada.
- Ningún componente visual, ninguna de las 25+ piezas de marketing, ningún archivo del frontend fuera de las URLs de API — se confirmó con una comparación completa de la lista de archivos antes y después: nada se perdió.
- La corrección de seguridad de `requireSession.js` (que un token de cuenta gratuita no pueda usarse para ver video) — intacta.

## Pendiente con datos reales de ustedes

- `DATABASE_URL` de Postgres real (ver `INFRAESTRUCTURA.md`)
- `CF_STREAM_*` de Cloudflare Stream real, y el UID de cada video una vez grabado
- `FRONTEND_ORIGIN` con el dominio real una vez desplegado
- Productos y `price_id` de Stripe reales
- Un pago de prueba completo de extremo a extremo antes de abrir ventas al público
