import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import checkoutRoute from './routes/checkout.js';
import webhookRoute from './routes/webhook.js';
import authRoute from './routes/auth.js';
import videoRoute from './routes/video.js';
import accountRoute from './routes/account.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const configuredOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
const developmentOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const allowedOrigins = process.env.NODE_ENV === 'production' ? configuredOrigins : [...configuredOrigins, ...developmentOrigins];

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use(cors({
  origin(origin, callback) {
    // Stripe y herramientas de monitoreo no siempre mandan Origin.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origen no autorizado por CORS.'));
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Stripe necesita el cuerpo crudo para validar su firma.
app.use('/api/webhook', express.raw({ type: 'application/json', limit: '1mb' }));
app.use('/api', webhookRoute);
app.use(express.json({ limit: '64kb' }));

app.use('/api', checkoutRoute);
app.use('/api', authRoute);
app.use('/api', videoRoute);
app.use('/api', accountRoute);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  if (err.message === 'Origen no autorizado por CORS.') return res.status(403).json({ error: err.message });
  console.error('Error no controlado:', err);
  return res.status(500).json({ error: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Move IA Market API escuchando en el puerto ${PORT}`));
