import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { checkBackendHealth } from '../services/api';
import { getTodayISO } from '../utils/formatters';
import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from '../utils/storage';

const WorkspaceContext = createContext(null);

const DEFAULT_SETTINGS = {
  sidebarCollapsed: false,
  showDemoData: true,
  defaultDate: getTodayISO(),
};

export function WorkspaceProvider({ children }) {
  const [patients, setPatients] = useState(() => readStorage(STORAGE_KEYS.PATIENTS, []));
  const [documents, setDocuments] = useState(() => readStorage(STORAGE_KEYS.DOCUMENTS, []));
  const [notifications, setNotifications] = useState(() =>
    readStorage(STORAGE_KEYS.NOTIFICATIONS, [])
  );
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...readStorage(STORAGE_KEYS.SETTINGS, {}),
  }));
  const [globalSearch, setGlobalSearch] = useState('');
  const [backendStatus, setBackendStatus] = useState({
    state: 'checking', // 'checking' | 'online' | 'offline'
    message: 'Checking backend connection…',
    latencyMs: null,
    checkedAt: null,
  });

  useEffect(() => {
    writeStorage(STORAGE_KEYS.PATIENTS, patients);
  }, [patients]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.DOCUMENTS, documents);
  }, [documents]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }, [notifications]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  const refreshBackendStatus = useCallback(async () => {
    setBackendStatus((prev) => ({ ...prev, state: 'checking' }));
    try {
      const data = await checkBackendHealth();
      setBackendStatus({
        state: 'online',
        message: data?.message || 'Backend online',
        latencyMs: data?.latencyMs ?? null,
        checkedAt: new Date().toISOString(),
      });
      return true;
    } catch {
      setBackendStatus({
        state: 'offline',
        message: 'Backend unreachable',
        latencyMs: null,
        checkedAt: new Date().toISOString(),
      });
      return false;
    }
  }, []);

  useEffect(() => {
    refreshBackendStatus();
  }, [refreshBackendStatus]);

  const addNotification = useCallback((event) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...event,
    };
    setNotifications((prev) => [entry, ...prev].slice(0, 20));
  }, []);

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const upsertPatient = useCallback((patientRecord) => {
    if (!patientRecord?.patient_id) return;
    setPatients((prev) => {
      const exists = prev.some((p) => p.patient_id === patientRecord.patient_id);
      if (exists) {
        return prev.map((p) =>
          p.patient_id === patientRecord.patient_id ? { ...p, ...patientRecord } : p
        );
      }
      return [patientRecord, ...prev];
    });
  }, []);

  const addDocumentRecord = useCallback((docRecord) => {
    if (!docRecord?.document_id) return;
    setDocuments((prev) => [docRecord, ...prev]);
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearWorkspaceCache = useCallback(() => {
    setPatients([]);
    setDocuments([]);
    setNotifications([]);
    removeStorage(STORAGE_KEYS.PATIENTS);
    removeStorage(STORAGE_KEYS.DOCUMENTS);
    removeStorage(STORAGE_KEYS.RAG_CHATS);
    removeStorage(STORAGE_KEYS.NOTIFICATIONS);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        patients,
        upsertPatient,
        documents,
        addDocumentRecord,
        notifications,
        addNotification,
        markNotificationsRead,
        clearNotifications,
        settings,
        updateSettings,
        globalSearch,
        setGlobalSearch,
        backendStatus,
        refreshBackendStatus,
        clearWorkspaceCache,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used inside WorkspaceProvider');
  }
  return ctx;
}

