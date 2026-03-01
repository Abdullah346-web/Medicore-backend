import User from '../models/User.js';

const DEMO_STAFF_USERS = [
  {
    name: 'Receptionist Demo',
    email: 'recept@clinic.com',
    password: 'recept12345',
    role: 'receptionist',
  },
  {
    name: 'Doctor Demo',
    email: 'doctor@clinic.com',
    password: 'doctor12345',
    role: 'doctor',
  },
];

export const ensureDemoStaffUsers = async () => {
  for (const demoUser of DEMO_STAFF_USERS) {
    const existingUser = await User.findOne({ email: demoUser.email });

    if (!existingUser) {
      await User.create({
        ...demoUser,
        subscriptionPlan: 'pro',
        mustChangePassword: false,
      });
      continue;
    }

    existingUser.name = demoUser.name;
    existingUser.role = demoUser.role;
    existingUser.password = demoUser.password;
    existingUser.subscriptionPlan = 'pro';
    existingUser.mustChangePassword = false;
    await existingUser.save();
  }
};
