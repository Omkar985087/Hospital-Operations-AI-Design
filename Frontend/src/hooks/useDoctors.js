import { useCallback, useEffect, useState } from 'react';
import { getDoctors } from '../services/doctorService';
import { getErrorMessage } from '../services/api';

export function useDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDoctors();
      setDoctors(Array.isArray(data?.doctors) ? data.doctors : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load doctor directory.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return {
    doctors,
    loading,
    error,
    refreshDoctors: fetchDoctors,
  };
}

