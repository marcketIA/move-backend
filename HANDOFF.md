# Move IA Market — Estado del proyecto (para retomar con ChatGPT)

Contexto: academia de trading (Forex, Opciones, Bolsa) de Kimy & Andy. "If it moves, we trade it."
Este documento resume dónde quedó el proyecto para que puedas seguir trabajándolo con otra herramienta sin perder contexto.

---

## 1. Estructura real del proyecto

```
move-stock-academy/
├── index.html                        Landing principal (rebrandeada, Kimy & Andy)
├── package.json                      Deps del frontend (Vite, Tailwind, PostCSS)
├── vite.config.js                    Config MPA — un input por cada página HTML
├── postcss.config.js
├── tailwind.config.js
├── README.md                         Instrucciones completas de instalación y estado
│
├── public/
│   ├── favicon.svg
│   ├── robots.txt                    Bloquea /src/dashboard/ a los buscadores
│   └── sitemap.xml                   (dominio de ejemplo, hay que cambiarlo)
│
├── src/
│   ├── main.js                       Entry point de Vite — importa CSS + todos los .js
│   │
│   ├── css/
│   │   ├── variables.css             Paleta: dorado, verde, ámbar, rojo (tema "terminal")
│   │   ├── global.css                Layout general (antes style.css)
│   │   ├── quiz.css                  Estilos del quiz de perfil de trader
│   │   ├── animations.css
│   │   ├── responsive.css
│   │   └── main.css                  Une todo + directivas @tailwind
│   │
│   ├── js/
│   │   ├── app.js                    FAQ accordion, ledger rail, glow del glass-card
│   │   ├── particles.js              Fondo animado
│   │   ├── counter.js                Contadores animados (500+, 2500+, etc.)
│   │   ├── animations.js             Scroll reveal
│   │   ├── calculator.js             Calculadora de riesgo/lotaje (REAL, funcional)
│   │   ├── quiz.js                   Quiz de 3 perfiles (conservador/moderado/agresivo)
│   │   ├── auth.js                   Login: intenta backend real, cae a demo si no hay servidor
│   │   ├── gatekeeper.js             Expiración de video por URL (?t=&exp=) — solo demo/UX
│   │   ├── tracking.js               Wrappers seguros para fbq/ttq/gtag (sin IDs reales aún)
│   │   └── mentorAI.js               Stub del Mentor IA (respuesta fija, sin backend de IA)
│   │
│   ├── views/                        Landing pages de campaña
│   │   ├── landing-yt.html           Tráfico de YouTube — form rápido + WhatsApp
│   │   ├── landing-tiktok.html       Tráfico de TikTok — calculadora gratis + prueba social + unlock
│   │   ├── live-temporal.html        Video temporal (usa gatekeeper.js)
│   │   └── error-expirado.html       Página cuando el enlace expiró
│   │
│   └── dashboard/                    Panel de alumnos
│       ├── index.html                Login por código de acceso
│       └── views/
│           ├── clases.html           Catálogo de módulos — pide video real si hay sesión real
│           ├── mentor-premium.html   Chat con el Mentor IA (stub)
│           └── calculadora-pro.html  Calculadora + historial local
│
└── server/                           ⭐ BACKEND REAL (Node/Express) — esto es lo nuevo
    ├── package.json                  express, stripe, jsonwebtoken, cors, dotenv
    ├── .env.example                  Plantilla de variables de entorno
    ├── data/
    │   └── db.json                   "Base de datos" en archivo JSON (temporal, ver estado abajo)
    └── src/
        ├── index.js                  App de Express, monta todas las rutas
        ├── db.js                     Wrapper de lectura/escritura de db.json
        ├── middleware/
        │   └── requireSession.js     Verifica el JWT en cada request protegido
        ├── utils/
        │   ├── accessCode.js         Genera códigos tipo MOVE-FOREX-XXXXXX
        │   └── signedUrl.js          Firma URLs de video (esquema Bunny.net Token Auth)
        └── routes/
            ├── checkout.js           POST /api/checkout      → crea sesión de pago en Stripe
            ├── webhook.js            POST /api/webhook       → Stripe confirma el pago aquí
            ├── auth.js               POST /api/auth/verify   → valida código, emite JWT
            └── video.js              GET  /api/video/:id     → URL de video firmada (requiere JWT)
```

---

## 2. Pruebas de verificación que corrí (y pasaron)

Antes de entregar el backend lo levanté de verdad y probé el flujo completo con `curl`. Esto es lo que se ejecutó, en orden:

```bash
# 1. Servidor arriba
curl http://localhost:8787/api/health
# → {"ok":true}

# 2. Login con código inexistente → debe rechazar
curl -X POST http://localhost:8787/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"code":"NO-EXISTE"}'
# → 401 {"error":"Código no válido."}

# 3. Checkout sin price de Stripe configurado → falla con mensaje claro, no crashea
curl -X POST http://localhost:8787/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"courseId":"forex","email":"test@test.com","phone":"5550001111"}'
# → 400 {"error":"No hay un STRIPE_PRICE configurado para \"forex\"..."}

# 4. Simulé un pago confirmado (lo que haría el webhook real de Stripe)
#    → se generó y guardó un código real: MOVE-FOREX-20D632

# 5. Login con ese código real
curl -X POST http://localhost:8787/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"code":"MOVE-FOREX-20D632"}'
# → 200 { "token": "<JWT>", "courseId": "forex", "expiresAt": 1785996797 }

# 6. Pedir un video CON el token → devuelve URL firmada
curl http://localhost:8787/api/video/modulo-1 \
  -H "Authorization: Bearer <JWT>"
# → 200 { "url": "...", "expiresAt": ..., "configured": false, "moduleId": "modulo-1" }
#   (configured:false porque todavía no hay credenciales reales de Bunny.net)

# 7. Pedir un video SIN token → debe rechazar
curl http://localhost:8787/api/video/modulo-1
# → 401 {"error":"Falta la sesión. Inicia sesión de nuevo."}
```

**Resultado: los 7 pasos se comportaron como se esperaba.** El sistema de pago → código → sesión → video protegido funciona de extremo a extremo con datos reales (no solo en teoría).

También se corrió `npm run build` del frontend (Vite) sin errores — las 9 páginas (landing, dashboard, vistas de campaña) compilan correctamente en modo MPA.

---

## 3. Dónde estamos ahora — estado por pieza

| Pieza | Estado | Detalle |
|---|---|---|
| Landing principal + rebrand | ✅ Completo | Kimy & Andy, "If it moves, we trade it." |
| Quiz de perfil de trader | ✅ Real | 3 perfiles, funcional |
| Calculadora de riesgo | ✅ Real | Funcional en landing pública y en dashboard |
| Estructura MPA con Vite | ✅ Completo y compilando | 9 páginas, build limpio |
| Backend Express (`server/`) | ✅ Real, probado extremo a extremo | Ver pruebas arriba |
| Stripe Checkout | ⚠️ Código listo, **sin claves reales** | Falta crear productos en Stripe Dashboard y poner los `price_id` en `.env` |
| Stripe Webhook | ⚠️ Código listo, **sin probar con Stripe real** | Falta correr `stripe listen` o configurar el webhook en producción |
| Generación de código de acceso | ✅ Real (una vez que el webhook reciba el evento real) | Ya probado con un evento simulado |
| Login con JWT | ✅ Real | Probado |
| Video firmado (Bunny.net) | ⚠️ Código listo, **sin cuenta de Bunny.net conectada** | Falta `BUNNY_PULLZONE_HOST` y `BUNNY_SECURITY_KEY` reales |
| Mentor IA | ⚠️ Stub (respuesta fija) | Falta backend propio conectado a una API de IA |
| Píxeles (FB/TikTok/GA) | ⚠️ Wrappers listos, sin IDs | Falta pegar los snippets oficiales con IDs reales |
| WhatsApp | ⚠️ Número placeholder `10000000000` | Falta el número real de WhatsApp Business |
| Base de datos | ⚠️ Archivo JSON local | Suficiente para probar, **no apto para producción real** (no soporta concurrencia) — hay que migrar a Postgres/Supabase antes de vender de verdad |
| Despliegue | ❌ Pendiente | Todo corre en `localhost` — falta desplegar `server/` (Render/Railway/Fly.io) y el frontend (Vercel/Netlify) |

### Lo próximo más lógico (en orden de impacto)
1. Migrar `server/data/db.json` a una base de datos real antes de tener tráfico de verdad
2. Crear cuenta de Stripe real, productos, y probar un pago real de punta a punta con la Stripe CLI
3. Conectar Bunny.net (o confirmar si prefieren Vimeo, para adaptar `signedUrl.js`)
4. Desplegar `server/` en un hosting real y actualizar `API_BASE_URL` en `src/js/auth.js` y `src/dashboard/views/clases.html`
5. Reemplazar placeholders: número de WhatsApp, IDs de píxeles, capturas de testimonios reales
