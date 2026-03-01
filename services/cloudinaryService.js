import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

const toDataUri = (buffer, mimeType = 'application/pdf') =>
  `data:${mimeType};base64,${buffer.toString('base64')}`;

export const uploadPdfBuffer = async (buffer, fileName = 'prescription') => {
  if (!isCloudinaryConfigured) {
    return {
      secureUrl: toDataUri(buffer),
      provider: 'local-fallback',
    };
  }

  const uploaded = await cloudinary.uploader.upload(toDataUri(buffer), {
    folder: process.env.CLOUDINARY_FOLDER || 'ai-clinic/prescriptions',
    resource_type: 'raw',
    public_id: `${fileName}-${Date.now()}`,
    format: 'pdf',
  });

  return {
    secureUrl: uploaded.secure_url,
    provider: 'cloudinary',
  };
};