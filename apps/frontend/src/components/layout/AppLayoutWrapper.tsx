'use client';
import { useComponentProperties } from '@/contexts/ComponentPropertiesContext';
import { AppLayout } from './AppLayout';

interface AppLayoutWrapperProps {
  children: React.ReactNode;
}

export function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const { componentProperties, updateProperty } = useComponentProperties();

  return (
    <AppLayout
      componentProperties={componentProperties}
      onPropertyChange={updateProperty}
    >
      {children}
    </AppLayout>
  );
}
