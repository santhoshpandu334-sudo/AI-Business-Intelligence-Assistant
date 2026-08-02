import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { Dataset } from '../types';

interface DatasetContextType {
  datasets: Dataset[];
  selectedDatasetId: number | undefined;
  selectedDataset: Dataset | null;
  loading: boolean;
  refreshDatasets: (forceSelectId?: number) => Promise<Dataset[]>;
  setSelectedDatasetId: (id: number | undefined) => void;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetIdState] = useState<number | undefined>(() => {
    const saved = localStorage.getItem('selected_dataset_id');
    return saved ? Number(saved) : undefined;
  });
  const [loading, setLoading] = useState(true);

  const loadDatasets = async (forceSelectId?: number) => {
    setLoading(true);
    try {
      const list = await api.getDatasets();
      setDatasets(list);
      
      if (list.length > 0) {
        if (forceSelectId) {
          setSelectedDatasetId(forceSelectId);
        } else {
          const stillExists = list.some(d => d.id === selectedDatasetId);
          if (!selectedDatasetId || !stillExists) {
            // Sort by created_at descending to find the newest remaining dataset
            const sorted = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setSelectedDatasetId(sorted[0].id);
          }
        }
      } else {
        setSelectedDatasetId(undefined);
      }
      return list;
    } catch (err) {
      console.error("Failed to load datasets in global context:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const setSelectedDatasetId = (id: number | undefined) => {
    setSelectedDatasetIdState(id);
    if (id !== undefined) {
      localStorage.setItem('selected_dataset_id', String(id));
    } else {
      localStorage.removeItem('selected_dataset_id');
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const refreshDatasets = async (forceSelectId?: number) => {
    return loadDatasets(forceSelectId);
  };

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId) || null;

  return (
    <DatasetContext.Provider value={{
      datasets,
      selectedDatasetId,
      selectedDataset,
      loading,
      refreshDatasets,
      setSelectedDatasetId
    }}>
      {children}
    </DatasetContext.Provider>
  );
};

export const useDataset = () => {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error('useDataset must be used within DatasetProvider');
  return ctx;
};
