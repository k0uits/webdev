import express from 'express';
import path from 'path';
import authRoutes from './routes/authRoutes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);

app.get('/', (_req, res) => res.render('home'));
app.get('/login', (_req, res) => res.render('login'));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((_req, res) => res.status(404).json({ message: 'Not Found' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

export default app;
