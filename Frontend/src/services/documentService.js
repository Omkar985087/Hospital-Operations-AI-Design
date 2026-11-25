import apiClient from './api';

/**
 * POST /documents/upload
 * Multipart form-data with `file` (.pdf) and `patient_id`.
 * Returns { patient_id, document_id, total_chunks, status }
 */
export async function uploadDocument({ file, patientId, onUploadProgress }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('patient_id', patientId.trim());

  const response = await apiClient.post('/documents/upload', formData, {
    onUploadProgress,
  });
  return response.data;
}

/**
 * POST /documents/ask
 * JSON body: { patient_id, question }
 * Returns { answer, sources: [{ document_id, chunk_index, distance }] }
 */
export async function askDocumentQuestion({ patientId, question }) {
  const response = await apiClient.post('/documents/ask', {
    patient_id: patientId.trim(),
    question: question.trim(),
  });
  return response.data;
}

