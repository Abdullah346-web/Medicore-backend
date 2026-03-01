import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import Prescription from '../models/Prescription.js';
import Patient from '../models/Patient.js';
import { explainPrescription } from '../services/aiService.js';
import { generatePrescriptionPdfBuffer } from '../services/pdfService.js';
import { uploadPdfBuffer } from '../services/cloudinaryService.js';

export const createPrescription = asyncHandler(async (req, res) => {
  const { patientId, medicines, dosage, instructions, urduMode } = req.body;

  if (!patientId || !Array.isArray(medicines) || !Array.isArray(dosage)) {
    throw new ApiError(400, 'patientId, medicines[], and dosage[] are required');
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  const ai = await explainPrescription({
    medicines,
    dosage,
    instructions,
    urduMode: Boolean(urduMode),
  });

  const aiExplanation = `${ai.explanation}\n\nLifestyle: ${ai.lifestyleAdvice}\nPreventive: ${ai.preventiveAdvice}`;

  const prescription = await Prescription.create({
    patientId,
    doctorId: req.user._id,
    medicines,
    dosage,
    instructions,
    aiExplanation,
  });

  const populatedPrescription = await Prescription.findById(prescription._id)
    .populate('patientId', 'name age gender')
    .populate('doctorId', 'name email');

  const pdfBuffer = await generatePrescriptionPdfBuffer({
    prescription: populatedPrescription,
    patient: populatedPrescription.patientId,
    doctor: populatedPrescription.doctorId,
  });

  const uploaded = await uploadPdfBuffer(pdfBuffer, `prescription-${prescription._id}`);
  prescription.pdfUrl = uploaded.secureUrl;
  await prescription.save();

  res.status(201).json({
    ...prescription.toObject(),
    uploadProvider: uploaded.provider,
  });
});

export const getPrescriptionsByPatient = asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({ patientId: req.params.patientId })
    .populate('doctorId', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json(prescriptions);
});

export const regeneratePrescriptionPdf = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('patientId', 'name age gender')
    .populate('doctorId', 'name email');

  if (!prescription) {
    throw new ApiError(404, 'Prescription not found');
  }

  const pdfBuffer = await generatePrescriptionPdfBuffer({
    prescription,
    patient: prescription.patientId,
    doctor: prescription.doctorId,
  });

  const uploaded = await uploadPdfBuffer(pdfBuffer, `prescription-${prescription._id}`);
  prescription.pdfUrl = uploaded.secureUrl;
  await prescription.save();

  res.status(200).json({ pdfUrl: prescription.pdfUrl, uploadProvider: uploaded.provider });
});