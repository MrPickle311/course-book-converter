import React, { createContext, useContext, useEffect, useState } from 'react';

type PageSize = 50 | 100;
type ImageSize = 'small' | 'medium' | 'large';

interface SettingsContextType {
  pageSize: PageSize;
  setPageSize: (size: PageSize) => void;
  imageSize: ImageSize;
  setImageSize: (size: ImageSize) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider = (props: SettingsProviderProps) => {
  const [pageSize, setPageSizeState] = useState<PageSize>(() => {
    const stored = Number(localStorage.getItem('pageSize')) as PageSize;
    return stored === 50 || stored === 100 ? stored : 100;
  });

  const [imageSize, setImageSizeState] = useState<ImageSize>(() => {
    const stored = (localStorage.getItem('imageSize') as ImageSize) || 'small';
    return stored === 'small' || stored === 'medium' || stored === 'large' ? stored : 'small';
  });

  useEffect(function handlePageSizeChange ()  {
    localStorage.setItem('pageSize', String(pageSize));
  }, [pageSize]);

  useEffect(function changeImageSizeChange ()  {
    localStorage.setItem('imageSize', imageSize);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-image-size', imageSize);
    }
  }, [imageSize]);

  const setPageSize = (size: PageSize) => {
    setPageSizeState(size);
  };

  const setImageSize = (size: ImageSize) => {
    setImageSizeState(size);
  };

  return (
    <SettingsContext.Provider value={{ pageSize, setPageSize, imageSize, setImageSize }}>
      {props.children}
    </SettingsContext.Provider>
  );
};


