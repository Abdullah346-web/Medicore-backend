import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import diagnosisRoutes from './routes/diagnosisRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

app.use(helmet());

const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isConfiguredOrigin = allowedOrigins.includes(origin);
      const isLocalhostOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

      if (isConfiguredOrigin || (process.env.NODE_ENV !== 'production' && isLocalhostOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'ai-clinic-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/subscription', subscriptionRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;