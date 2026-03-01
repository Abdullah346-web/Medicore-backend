import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'doctor', 'receptionist', 'patient'],
      default: 'patient',
    },
    subscriptionPlan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    mustChangePassword: {
      type: Boolean,
      default: function defaultMustChangePassword() {
        return this.role === 'patient';
      },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;