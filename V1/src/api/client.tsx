import { createContext, useContext, useMemo } from 'react';
import { AppApi } from './contracts';
import { createLocalApi } from './local';

function createApi(): AppApi {
  const mode = (process as any).env.REACT_APP_API_MODE || 'mock';
  // For now, only local/mock implementation exists
  switch (mode) {
    case 'mock':
    case 'local':
    default:
      return createLocalApi();
  }
}

const ApiContext = createContext<AppApi | null>(null);

export function ApiProvider({ children }: { children: any }) {
  const api = useMemo(() => createApi(), []);
  return (
    <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
  );
}

export function useApi(): AppApi {
  const api = useContext(ApiContext);
  if (!api) throw new Error('ApiProvider missing');
  return api;
}


