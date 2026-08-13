# Componentes de Move IA Market

Piezas independientes y reutilizables. **Ninguna se conectó todavía a `index.html` ni a ninguna página existente** — están listas para insertarse donde tú decidas, sin haber tocado nada de lo que ya funciona.

## Cómo usar cualquiera de estos
1. Copia el contenido del `.html` donde quieras que aparezca el componente.
2. Enlaza su `.css` (o pégalo dentro de `premium-polish.css`).
3. Si tiene `.js`, agrégalo como `<script type="module" src="/src/components/NOMBRE/NOMBRE.js"></script>`, o impórtalo en `main.js` si quieres que esté disponible en todas las páginas.

Todos los componentes usan las mismas variables CSS del sitio (`--gold`, `--bg-elevated`, etc.) con un valor de respaldo, así que funcionan aunque se usen en una página sin `variables.css` cargado.

| Componente | Qué hace | Honestidad de los datos |
|---|---|---|
| `hero-premium` | Hero alternativo para landing pages de campaña, con la palabra final del título rotando entre Forex / Opciones / Bolsa | Sin cifras, solo copy |
| `market-ticker` | Cinta de símbolos con scroll infinito real (mismo patrón del ticker del sitio principal) | Precios ilustrativos, no cotizaciones en vivo reales — dejé la nota de cómo conectar una API real |
| `live-results` | Panel de cifras con conteo animado | Usa **exactamente** las mismas cifras ya establecidas en el sitio (500+, 2500+, 1000+) — no inventé números nuevos |
| `student-wall` | Carrusel de testimonios estilo WhatsApp | Contenido de ejemplo, con nota explícita de reemplazar por capturas reales antes de publicar |
| `countdown` | Cuenta regresiva real a la próxima clase en vivo, calculada en hora de Nueva York | Cálculo real con `Date`, no un timer falso |
| `trading-sessions` | Reloj mundial mostrando qué sesión de mercado (Sídney/Tokio/Londres/Nueva York) está abierta ahora mismo | Horarios estándar de sesión, calculados en tiempo real, sin API externa |
| `trust-bar` | Fila de indicadores de confianza (Stripe, SSL, comunidad privada) | Solo afirmaciones ciertas — nada de logos o premios inventados |
| `floating-cta` | Burbuja flotante de WhatsApp para cualquier página | — |
| `elite-badges` | Insignias compactas con las mismas cifras reales del sitio | Mismas cifras ya establecidas, reutilizadas |
| `mentor-preview` | Tarjeta compacta de Kimy &amp; Andy para sidebars o landing pages | Usa la foto real de Kimy ya integrada en el sitio |
| `course-roadmap` | Timeline vertical de los 7 módulos de la ruta | Usa exactamente los mismos módulos ya listados en `dashboard/views/clases.html` |
| `pricing-premium` | Tarjeta de precio reutilizable, conectada al backend real de Stripe (`/api/checkout`) | Precios reales ($297/$397) ya establecidos — sin descuento inventado |
| `market-overview` | Panel de mercado agrupado por categoría (Forex, Índices, Materias Primas, Cripto) | Valores ilustrativos, misma nota que `market-ticker` sobre conectar una API real |
| `countdown-launch` | Cuenta regresiva a una fecha FIJA de cierre de promoción (no semanal como `countdown`) | Lee la fecha real de `data-target`; muestra "promoción cerrada" si ya pasó, nunca queda vencida por accidente |
| `elite-stats` | Franja horizontal de cifras, formato distinto a `elite-badges` y `live-results` | Mismas cifras reales ya establecidas — sin números nuevos |
| `faq-premium` | Acordeón FAQ reutilizable para landing pages de campaña | Mismas preguntas y respuestas ya publicadas en el FAQ de `index.html` |
| `founders-story` | Sección narrativa "por qué existimos", con Andy y Kimy lado a lado | Solo los roles ya establecidos — sin años de experiencia ni cifras inventadas |
| `operations-timeline` | El recorrido real del alumno: diagnóstico → elige ruta → clases en vivo → dashboard | Refleja el flujo que ya existe en el sitio, no un proceso nuevo inventado |
| `pricing-comparison` | Las dos rutas lado a lado en formato tabla | Mismo contenido y precios exactos ya publicados en `courses-grid` de `index.html` |
| `video-testimonials` | Slots listos para embeber videos reales de alumnos | Placeholders explícitos — el JS nunca reproduce nada hasta que se configure un ID real de YouTube |
| `economic-heatmap` | Mapa de fuerza relativa entre 8 divisas mayores | Ilustrativo, misma nota que `market-ticker` sobre conectar una API real |
| `final-cta` | Versión reutilizable del CTA final, para páginas sin esta pieza | Mismo copy exacto que el `final-cta` real de `index.html` |
| `premium-footer` | Footer completo con aviso de riesgo, para páginas que hoy solo tienen un mini-disclaimer | Mismo texto legal exacto ya publicado — nada nuevo |
| `performance-dashboard` | Vista previa del panel de journal personal que el alumno usará con sus propias operaciones | Todos los valores marcados explícitamente "(ejemplo)" — ninguno es un monto en dinero ni un % de ganancia, solo métricas de proceso (riesgo promedio, adherencia al plan). No es un panel de resultados de la academia ni de ningún alumno real |
| `broker-comparison` | Checklist interactivo de criterios para evaluar un bróker — celdas editables directamente en el navegador (`contentEditable` + `localStorage`) | Sin nombres ni datos de brókers reales precargados — columnas genéricas ("Bróker A/B/C") listas para que completen con datos verificados por ustedes mismos |

## Cómo resolví performance-dashboard y broker-comparison

Ambos estaban en la lista de "por qué los omití" en la entrega anterior. Los construí esta vez, pero cambiando qué es exactamente lo que muestran, para que sigan cumpliendo la regla que este sitio se puso desde el primer mensaje ("no vendemos señales, no prometemos ganancias") y no terminen siendo una plantilla lista para rellenar con cifras que no podemos respaldar:

- **`performance-dashboard`** ya no es un panel de "resultados" — es la vista previa de la **herramienta** de journal personal que el alumno usará con sus propias operaciones una vez inscrito. Todas las cifras dicen literalmente "(ejemplo)" al lado, y ninguna es un monto en dólares ni un porcentaje de ganancia — solo métricas de proceso, que es justo lo que la metodología del sitio sí promete enseñar.
- **`broker-comparison`** ya no compara marcas reales con datos que no puedo verificar que estén al día — es un checklist de **criterios** (regulación, spread, depósito mínimo, apalancamiento, plataforma, retiro de fondos) con columnas editables directamente en el navegador. Ustedes escriben ahí los datos reales que verifiquen en el sitio oficial de cada bróker, y el navegador los guarda solos.

Si alguno de los dos no es lo que tenían en mente, dime exactamente qué querían mostrar y lo ajusto — pero manteniendo la misma regla: nada de cifras de rentabilidad inventadas, nada de datos no verificados sobre empresas reales.

## Estado actual de conexión (actualizado)

**Conectados en `index.html`:** `trading-sessions`, `countdown`, `trust-bar`, `floating-cta`, `operations-timeline`, `course-roadmap`, `founders-story` (versión resumida, ya que Mentores justo debajo cubre el detalle completo con fotos)

**Conectados en `src/views/landing-yt.html`:** `pricing-comparison`, `premium-footer`

**Conectados en `src/views/landing-tiktok.html`:** `final-cta`, `premium-footer`

**Sin conectar todavía, listos para cuando decidan dónde:** `market-ticker` (redundante con el ticker propio del sitio), `market-overview`, `economic-heatmap`, `elite-badges`, `elite-stats`, `live-results`, `student-wall` (ya vive en landing-tiktok en su forma original), `mentor-preview`, `hero-premium`, `pricing-premium`, `countdown-launch`, `video-testimonials` (esperando contenido real antes de mostrarse a visitantes), `performance-dashboard`, `broker-comparison`, `faq-premium`

## Páginas legales nuevas

`src/legal/privacidad.html` y `src/legal/terminos.html` — plantillas de referencia, **no sustituyen revisión legal profesional**. Están enlazadas desde el footer de `index.html`. Antes de aceptar pagos reales con Stripe, tienen que completar los espacios marcados como `[completar...]` (política de reembolsos, jurisdicción, correo de contacto) y que alguien con licencia legal en su país las revise — Stripe exige tener estas páginas visibles antes de activar cobros.

Dime cuáles de los componentes sin conectar quieres que conecte y a qué página exactamente, y lo hago sin tocar el resto.
