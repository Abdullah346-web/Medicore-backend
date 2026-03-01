import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';
import { ensureDemoStaffUsers } from './services/seedUsersService.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  await connectDB();
  await ensureDemoStaffUsers();
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
};

bootstrap();