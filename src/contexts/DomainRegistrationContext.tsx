import { createContext, useContext, type ReactNode } from 'react';

interface DomainRegistrationContextType {
  onRegistrationComplete: () => void;
}

const DomainRegistrationContext = createContext<DomainRegistrationContextType | undefined>(undefined);

export function useDomainRegistration() {
  const context = useContext(DomainRegistrationContext);
  if (!context) {
    throw new Error('useDomainRegistration must be used within DomainRegistrationProvider');
  }
  return context;
}

interface DomainRegistrationProviderProps {
  children: ReactNode;
  onRegistrationComplete: () => void;
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
