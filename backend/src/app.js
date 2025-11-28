import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.routes.js';
import notFound from './middlewares/notFound.middleware.js';
import errorHandler from './middlewares/error.middleware.js';
import rateLimit from 'express-rate-limit';
import { iniciarCronRecordatorios } from './cron/recordatorios.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

iniciarCronRecordatorios();
console.log('Sistema de recordatorios iniciado');

app.use(cors());
app.use(limiter);
app.use(express.json());
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
