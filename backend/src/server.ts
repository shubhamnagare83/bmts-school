import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.js';
import { prisma } from './config/database.js';
import path from 'path';

import authRoutes from './routes/auth.routes.js';
import academicYearRoutes from './routes/academicYears.routes.js';
import classRoutes from './routes/classes.routes.js';
import divisionRoutes from './routes/divisions.routes.js';
import subjectRoutes from './routes/subjects.routes.js';
import exportRoutes from './routes/export.routes.js';
import cronRoutes from './routes/cron.routes.js';
import { scheduleAttendanceAutoGeneration, runAutoAttendanceNow } from './cron/attendanceAutoGenerate.js';
import { authorize } from './middleware/roleGuard.js';
import examRoutes from './routes/exams.routes.js';
import markRoutes from './routes/marks.routes.js';
import gradeRuleRoutes from './routes/gradeRules.routes.js';
import reportCardRoutes from './routes/reportCards.routes.js';
import homeworkRoutes from './routes/homework.routes.js';
import teacherRoutes from './routes/teachers.routes.js';
import studentRoutes from './routes/students.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import noticeRoutes from './routes/notices.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import timetableRoutes from './routes/timetable.routes.js';
import holidayRoutes from './routes/holidays.routes.js';
import settingRoutes from './routes/settings.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import auditLogRoutes from './routes/auditLogs.routes.js';
import certificateRoutes from './routes/certificates.routes.js';
import remarkBankRoutes from './routes/remarkBank.routes.js';
import pdfRoutes from './routes/pdf.routes.js';
import teachingLogRoutes from './routes/teachingLogs.routes.js';

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for flexibility; configure per deployment
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 500 : 5000, // limit requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});


// CORS — allow any localhost origin in dev, use FRONTEND_URL in prod
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any localhost / 127.0.0.1 origin in development
    if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/', limiter);


// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/divisions', divisionRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/grade-rules', gradeRuleRoutes);
app.use('/api/report-cards', reportCardRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/remark-bank', remarkBankRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/teaching-logs', teachingLogRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/cron', cronRoutes);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  scheduleAttendanceAutoGeneration();
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
