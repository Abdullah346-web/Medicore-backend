import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';
import { ensureDemoStaffUsers } from './services/seedUsersService.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
let server;

const shutdown = (signal) => {
  if (!server) {
    process.exit(0);
    return;
  }

  server.close(() => {
    console.log(`${signal} received. Backend stopped.`);
    process.exit(0);
  });
};

const bootstrap = async () => {
  try {
    await connectDB();
    try {
      await ensureDemoStaffUsers();
    } catch (error) {
      console.warn('Demo user seeding skipped:', error?.message || error);
    }

    server = app.listen(PORT, HOST, () => {
      console.log(`Backend running on ${HOST}:${PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the existing process or change PORT in .env.`);
      } else {
        console.error('Server startup error:', error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to bootstrap backend:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error?.message || error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error?.message || error);
  process.exit(1);
});

bootstrap();