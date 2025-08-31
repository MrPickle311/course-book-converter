import { createContext, useContext, useEffect, useState } from 'react';

type PageSize = 50 | 100;

interface SettingsContextType {
  pageSize: PageSize;
  setPageSize: (size: PageSize) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [pageSize, setPageSizeState] = useState<PageSize>(() => {
    const stored = Number(localStorage.getItem('pageSize')) as PageSize;
    return stored === 50 || stored === 100 ? stored : 100;
  });

  useEffect(() => {
    localStorage.setItem('pageSize', String(pageSize));
  }, [pageSize]);

  const setPageSize = (size: PageSize) => {
    setPageSizeState(size);
  };

  return (
    <SettingsContext.Provider value={{ pageSize, setPageSize }}>
      {children}
    </SettingsContext.Provider>
  );
};


