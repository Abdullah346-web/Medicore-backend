import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patientName: { type: String, required: true, trim: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorName: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

appointmentSchema.index({ doctorId: 1, date: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;