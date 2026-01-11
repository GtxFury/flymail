import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { domainsRouter } from './routes/domains.js';
import { addressesRouter } from './routes/addresses.js';
import { emailsRouter } from './routes/emails.js';
import { startSmtpServer } from './smtp/server.js';
import { errorHandler } from './middleware/error.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/domains', domainsRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/emails', emailsRouter);

// Error handler
app.use(errorHandler);

// Start servers
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

// Start SMTP server
startSmtpServer();
