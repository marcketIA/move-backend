import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import checkoutRoute from './routes/checkout.js';
import webhookRoute from './routes/webhook.js';
import authRoute from './routes/auth.js';
import videoRoute from './routes/video.js';
import accountRoute from './routes/account.js';
import checkoutEliteRoute from './routes/checkout-elite.js';
import webhookEliteRoute from './routes/webhook-elite.js';
import premiumRoute from './routes/premium.js';
import adminRoute from './routes/admin.js';
import liveWeekendRoute from './routes/live-weekend.js';
import webhookRefundsRoute from './routes/webhook-refunds.js';
import zoomWebhookRoute from './routes/zoom-webhook.js';
import checkoutStatusRoute from './routes/checkout-status.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Normaliza quitando espacios visibles, caracteres invisibles que a veces
// se cuelan al copiar/pegar (espacios especiales, marcas de formato),
// mayúsculas/minúsculas, y cualquier "/" al final.
const normalizeOrigin = (value) => (value || '')
  .replace(/[\u200B-\u200D\uFEFF\u00A0\u2060]/g, '')
  .trim()
  .replace(/\/+$/, '')
  .toLowerCase();

const configuredOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',').map(normalizeOrigin).filter(Boolean);
const developmentOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const allowedOrigins = process.env.NODE_ENV === 'production' ? configuredOrigins : [...configuredOrigins, ...developmentOrigins];

console.log('[CORS] Orígenes permitidos al arrancar:', allowedOrigins);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!origin || allowedOrigins.includes(normalizedOrigin)) return callback(null, true);
    console.log('[CORS] Rechazado. Origen recibido:', JSON.stringify(origin), '| Permitidos:', allowedOrigins);
    console.log('[CORS] Códigos de caracteres del origen recibido:', Array.from(normalizedOrigin).map((c) => c.codePointAt(0)).join(','));
    allowedOrigins.forEach((o) => console.log('[CORS] Códigos de caracteres de un permitido:', Array.from(o).map((c) => c.codePointAt(0)).join(',')));
    return callback(new Error('Origen no autorizado por CORS.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
};

app.use(cors(corsOptions));

app.use('/api/webhook', express.raw({ type: 'application/json', limit: '1mb' }));
app.use('/api', webhookRoute);

app.use('/api/webhook-elite', express.raw({ type: 'application/json', limit: '1mb' }));
app.use('/api', webhookEliteRoute);

app.use('/api/webhook-refunds', express.raw({ type: 'application/json', limit: '1mb' }));
app.use('/api', webhookRefundsRoute);

app.use('/api/zoom-webhook', express.raw({ type: 'application/json', limit: '1mb' }));
app.use('/api', zoomWebhookRoute);

app.use(express.json({ limit: '64kb' }));

app.use('/api', checkoutRoute);
app.use('/api', authRoute);
app.use('/api', videoRoute);
app.use('/api', accountRoute);
app.use('/api', checkoutEliteRoute);
app.use('/api', premiumRoute);
app.use('/api', adminRoute);
app.use('/api', liveWeekendRoute);
app.use('/api', checkoutStatusRoute);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  if (err.message === 'Origen no autorizado por CORS.') return res.status(403).json({ error: err.message });
  console.error('Error no controlado:', err);
  return res.status(500).json({ error: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Move IA Market API escuchando en el puerto ${PORT}`));
