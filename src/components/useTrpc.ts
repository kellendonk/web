import { useState, useEffect, useCallback, useMemo } from 'react';
import { createTRPCProxyClient, httpBatchLink, loggerLink } from '@trpc/client';
import { AppRouter } from '../api/AppRouter';

export function useTrpc() {
  return useMemo(
    () =>
      createTRPCProxyClient<AppRouter>({
        transformer: {
          serialize: (object) => object,
          deserialize: (payload) => payload,
        },
        links: [
          loggerLink(),
          httpBatchLink({ url: process.env.NEXT_PUBLIC_API_URL! }),
        ],
      }),
    [],
  );
}

export function useQuery<T>(queryFn: () => Promise<T>): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState(0);
  const refresh = useCallback(() => setKey((key) => key + 1), [setKey]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await queryFn();
        if (isMounted) {
          setData(data);
        }
      } catch (error) {
        if (isMounted) {
          setError(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, [queryFn, key]);

  return {
    data,
    error,
    isLoading,
    refresh,
  };
}

export type UseQueryResult<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refresh: () => void;
};
