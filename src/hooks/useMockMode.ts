import { useState, useEffect } from 'react';

const MOCK_MODE_KEY = 'kanban-mock-mode';

export function useMockMode() {
  const [isMockMode, setIsMockMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(MOCK_MODE_KEY);
      // Default: ON em dev, OFF em prod
      return stored ? JSON.parse(stored) : process.env.NODE_ENV === 'development';
    } catch {
      return process.env.NODE_ENV === 'development';
    }
  });

  const toggleMockMode = (enabled: boolean) => {
    setIsMockMode(enabled);
    localStorage.setItem(MOCK_MODE_KEY, JSON.stringify(enabled));
  };

  useEffect(() => {
    localStorage.setItem(MOCK_MODE_KEY, JSON.stringify(isMockMode));
  }, [isMockMode]);

  return { isMockMode, toggleMockMode };
}