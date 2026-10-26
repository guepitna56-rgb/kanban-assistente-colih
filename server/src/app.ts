import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { workspaceRoutes } from './modules/workspaces/workspace.routes.js';
import { memberRoutes } from './modules/members/member.routes.js';
import { hospitalRoutes } from './modules/hospitals/hospital.routes.js';
import { doctorRoutes } from './modules/doctors/doctor.routes.js';
import { boardRoutes } from './modules/boards/board.routes.js';
import { attachmentRoutes } from './modules/attachments/attachment.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { notificationRoutes } from './modules/notifications/notification.routes.js';
import { calendarRoutes } from './modules/calendar/calendar.routes.js';

export const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite localhost e chamadas sem origin (como curl/mobile/mesma máquina)
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calendar', calendarRoutes);

// Rotas de Workspace e seus submódulos isolados
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces/:workspaceId/members', memberRoutes);
app.use('/api/workspaces/:workspaceId/hospitals', hospitalRoutes);
app.use('/api/workspaces/:workspaceId/doctors', doctorRoutes);
app.use('/api/workspaces/:workspaceId/boards', boardRoutes);
app.use('/api/workspaces/:workspaceId/attachments', attachmentRoutes);
app.use('/api/workspaces/:workspaceId/audit', auditRoutes);
app.use('/api/workspaces/:workspaceId/dashboard', dashboardRoutes);

// Middleware centralizado de tratamento de erros
app.use(errorHandler);
