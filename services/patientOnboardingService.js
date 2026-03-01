import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import ApiError from '../utils/apiError.js';

const TEMP_PASSWORD_LENGTH = 8;
const TEMP_PASSWORD_ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const generateTemporaryPassword = () => {
  let password = '';
  for (let index = 0; index < TEMP_PASSWORD_LENGTH; index += 1) {
    const randomIndex = Math.floor(Math.random() * TEMP_PASSWORD_ALPHANUMERIC.length);
    password += TEMP_PASSWORD_ALPHANUMERIC[randomIndex];
  }
  return password;
};

export const onboardPatientAccount = async ({
  name,
  email,
  phone,
  age,
  gender,
  createdBy,
  temporaryPassword,
}) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  const resolvedTemporaryPassword = temporaryPassword?.trim() || generateTemporaryPassword();

  if (resolvedTemporaryPassword.length < 6) {
    throw new ApiError(400, 'temporaryPassword must be at least 6 characters long');
  }

  const hashedTemporaryPassword = await bcrypt.hash(resolvedTemporaryPassword, 10);

  const user = await User.create({
    name,
    email,
    password: hashedTemporaryPassword,
    role: 'patient',
    mustChangePassword: true,
  });

  const patientProfile = await Patient.create({
    userId: user._id,
    name,
    email,
    phone,
    age,
    gender,
    contact: phone,
    createdBy,
  });

  return {
    user,
    patientProfile,
    temporaryPassword: resolvedTemporaryPassword,
  };
};
