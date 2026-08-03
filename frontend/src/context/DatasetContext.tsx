import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { Dataset } from '../types';

interface DatasetContextType {
  datasets: Dataset[];
  uniqueDatasets: Dataset[];
  selectedDatasetId: number | undefined;
  selectedDataset: Dataset | null;
  loading: boolean;
  refreshDatasets: (forceSelectId?: number) => Promise<Dataset[]>;
  setSelectedDatasetId: (id: number | undefined) => void;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
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

  // Synchronize datasets loading with user authentication lifecycle
  useEffect(() => {
    if (user) {
      loadDatasets();
    } else {
      setDatasets([]);
      setSelectedDatasetIdState(undefined);
      localStorage.removeItem('selected_dataset_id');
      setLoading(false);
    }
  }, [user]);

  const refreshDatasets = async (forceSelectId?: number) => {
    return loadDatasets(forceSelectId);
  };

  // Safety layer deduplication by unique dataset ID
  const uniqueDatasets = React.useMemo(() => {
    const seen = new Set<number>();
    return datasets.filter(dataset => {
      if (seen.has(dataset.id)) return false;
      seen.add(dataset.id);
      return true;
    });
  }, [datasets]);

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId) || null;

  return (
    <DatasetContext.Provider value={{
      datasets,
      uniqueDatasets,
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
