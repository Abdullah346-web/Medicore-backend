import mongoose from 'mongoose';

const diagnosisLogSchema = new mongoose.Schema(
  {
    symptoms: { type: String, required: true },
    aiResponse: { type: String, required: true },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

const DiagnosisLog = mongoose.model('DiagnosisLog', diagnosisLogSchema);
export default DiagnosisLog;