import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medicines: [{ type: String, required: true }],
    dosage: [{ type: String, required: true }],
    instructions: { type: String, default: '' },
    aiExplanation: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;