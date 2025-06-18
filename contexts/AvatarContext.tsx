import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AvatarContextType {
  selectedAvatar: string | null;
  setSelectedAvatar: (avatar: string | null) => void;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export function AvatarProvider({ children }: { children: ReactNode }) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  return (
    <AvatarContext.Provider value={{ selectedAvatar, setSelectedAvatar }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error('useAvatar must be used within an AvatarProvider');
  }
  return context;
} 