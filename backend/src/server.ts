import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error';

// Modul marshrutlari
import authRoutes from './modules/auth/routes';
import usersRoutes from './modules/users/routes';
import mahallasRoutes from './modules/mahallas/routes';
import placesRoutes from './modules/places/routes';
import eventsRoutes from './modules/events/routes';
import registrationsRoutes from './modules/registrations/routes';
import statsRoutes from './modules/stats/routes';
import settingsRoutes from './modules/settings/routes';
import uploadsRoutes from './modules/uploads/routes';

const app = express();

// Xavfsizlik va asosiy middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Fayllar uchun statik papka
app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

// API v1 marshrutlari
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, usersRoutes);
app.use(`${API_PREFIX}/mahallas`, mahallasRoutes);
app.use(`${API_PREFIX}/places`, placesRoutes);
app.use(`${API_PREFIX}/events`, eventsRoutes);
app.use(`${API_PREFIX}/registrations`, registrationsRoutes);
app.use(`${API_PREFIX}/stats`, statsRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);
app.use(`${API_PREFIX}/uploads`, uploadsRoutes);

// Salomatlik tekshiruvi (Health check)
app.get(`${API_PREFIX}/health`, (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'yunusobod-birga-backend'
  });
});

// Xatoliklarni ushlab qoluvchi middleware
app.use(errorHandler);

const PORT = parseInt(env.PORT, 10);
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Yunusobod — Birga Backend Server http://0.0.0.0:${PORT} da ishga tushdi`);
  logger.info(`📖 API Prefiksi: ${API_PREFIX}`);
});

export default app;

