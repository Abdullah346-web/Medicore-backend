import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import DiagnosisLog from '../models/DiagnosisLog.js';
import {
  smartSymptomChecker,
  detectRiskPattern,
  explainPrescription,
} from '../services/aiService.js';

export const runSymptomCheck = asyncHandler(async (req, res) => {
  const { symptoms, age, gender, history } = req.body;
  if (!symptoms || age == null || !gender) {
    throw new ApiError(400, 'symptoms, age, and gender are required');
  }

  const result = await smartSymptomChecker({ symptoms, age, gender, history });

  await DiagnosisLog.create({
    symptoms,
    aiResponse: JSON.stringify(result),
    riskLevel: result.riskLevel,
    doctorId: req.user._id,
  });

  res.status(200).json(result);
});

export const runRiskDetection = asyncHandler(async (req, res) => {
  const { symptoms, history } = req.body;
  if (!symptoms) {
    throw new ApiError(400, 'symptoms are required');
  }

  const result = await detectRiskPattern({ symptoms, history });

  await DiagnosisLog.create({
    symptoms,
    aiResponse: result.insights,
    riskLevel: result.riskLevel,
    doctorId: req.user._id,
  });

  res.status(200).json(result);
});

export const runPrescriptionExplanation = asyncHandler(async (req, res) => {
  const { medicines, dosage, instructions, urduMode } = req.body;
  if (!Array.isArray(medicines) || !Array.isArray(dosage)) {
    throw new ApiError(400, 'medicines[] and dosage[] are required');
  }

  const result = await explainPrescription({ medicines, dosage, instructions, urduMode });
  res.status(200).json(result);
});