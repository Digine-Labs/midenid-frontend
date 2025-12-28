import { createContext, useContext } from 'react';
import type {
  DomainRegistrationContextType,
  DomainRegistrationProviderProps
} from '@/types/context';

const DomainRegistrationContext = createContext<DomainRegistrationContextType | undefined>(undefined);

export function useDomainRegistration() {
  const context = useContext(DomainRegistrationContext);
  if (!context) {
    throw new Error('useDomainRegistration must be used within DomainRegistrationProvider');
  }
  return context;
}

export function DomainRegistrationProvider({
  children,
  onRegistrationComplete,
}: DomainRegistrationProviderProps) {
  return (
    <DomainRegistrationContext.Provider value={{ onRegistrationComplete }}>
      {children}
    </DomainRegistrationContext.Provider>
  );
}
