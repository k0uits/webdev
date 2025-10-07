import express from 'express';
import authRoutes from './routes/authRoutes';

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);

// Healthcheck
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 404
app.use((_req, res) => res.status(404).json({ message: 'Not Found' }));

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

export default app;
