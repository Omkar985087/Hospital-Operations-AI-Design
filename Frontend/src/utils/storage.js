export const STORAGE_KEYS = {
  PATIENTS: 'hospital_ops_patients_v1',
  DOCUMENTS: 'hospital_ops_documents_v1',
  RAG_CHATS: 'hospital_ops_rag_chats_v1',
  SETTINGS: 'hospital_ops_settings_v1',
  NOTIFICATIONS: 'hospital_ops_notifications_v1',
};

export function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function removeStorage(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

