'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ComponentProperties } from '@/types/component';

interface ComponentPropertiesContextType {
  componentProperties: ComponentProperties;
  setComponentProperties: React.Dispatch<React.SetStateAction<ComponentProperties>>;
  updateProperty: (property: keyof ComponentProperties, value: string | number | boolean) => void;
}

const DEFAULT_PROPERTIES: ComponentProperties = {
  x: 100,
  y: 100,
  width: 156,
  height: 40,
  text: 'Button',
  bgColor: '#1976D2',
  textColor: '#FFFFFF',
  cornerRadius: 4,
  showLeftIcon: true,
  showRightIcon: true,
  fontSize: 16,
};

const ComponentPropertiesContext = createContext<ComponentPropertiesContextType | undefined>(undefined);

export function ComponentPropertiesProvider({ children }: { children: ReactNode }) {
  const [componentProperties, setComponentProperties] = useState<ComponentProperties>(DEFAULT_PROPERTIES);

  const updateProperty = (property: keyof ComponentProperties, value: string | number | boolean) => {
    setComponentProperties(prev => ({
      ...prev,
      [property]: value
    }));
  };

  return (
    <ComponentPropertiesContext.Provider value={{ componentProperties, setComponentProperties, updateProperty }}>
      {children}
    </ComponentPropertiesContext.Provider>
  );
}

export function useComponentProperties() {
  const context = useContext(ComponentPropertiesContext);
  if (context === undefined) {
    throw new Error('useComponentProperties must be used within a ComponentPropertiesProvider');
  }
  return context;
}
