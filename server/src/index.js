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
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const developmentOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? configuredOrigins
  : [...new Set([...configuredOrigins, ...developmentOrigins])];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.trim().replace(/\/+$/, '');
    
    if (allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    
    return callback(new Error('No autorizado por CORS.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use('/api/webhook', webhookRoute);

app.use(express.json());

app.use('/api/checkout', checkoutRoute);
app.use('/api/auth', authRoute);
app.use('/api/video', videoRoute);
app.use('/api/account', accountRoute);

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'No autorizado por CORS.' });
  }
  return res.status(500).json({ error: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Move IA Market API escuchando en el puerto ${PORT}`);
});
