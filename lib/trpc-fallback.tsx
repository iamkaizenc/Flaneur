import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert } from 'react-native';
import { getFallbackData, testBackendConnection } from '@/lib/trpc';
import { normalizeError } from '@/lib/errors';

interface BackendStatusContextType {
  isBackendAvailable: boolean;
  lastError: string | null;
  retryConnection: () => Promise<void>;
  useFallbackData: boolean;
}

const BackendStatusContext = createContext<BackendStatusContextType | null>(null);

export function useBackendStatus() {
  const context = useContext(BackendStatusContext);
  if (!context) {
    throw new Error('useBackendStatus must be used within BackendStatusProvider');
  }
  return context;
}

interface BackendStatusProviderProps {
  children: ReactNode;
}

export function BackendStatusProvider({ children }: BackendStatusProviderProps) {
  const [isBackendAvailable, setIsBackendAvailable] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [useFallbackData, setUseFallbackData] = useState<boolean>(false);

  const checkBackendStatus = async () => {
    try {
      const result = await testBackendConnection();
      setIsBackendAvailable(result.success);
      setUseFallbackData(!result.success);
      
      if (!result.success) {
        setLastError('Backend server not running');
        if (__DEV__) {
          console.warn('[Backend Status] Backend unavailable, using demo data');
        }
      } else {
        setLastError(null);
        if (__DEV__) {
          console.log('[Backend Status] Backend is available');
        }
      }
    } catch {
      setIsBackendAvailable(false);
      setUseFallbackData(true);
      setLastError('Connection failed');
      if (__DEV__) {
        console.warn('[Backend Status] Connection test failed, using demo data');
      }
    }
  };

  const retryConnection = async () => {
    console.log('[Backend Status] Retrying backend connection...');
    await checkBackendStatus();
  };

  useEffect(() => {
    // Initial check
    checkBackendStatus();

    // Periodic checks every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const value: BackendStatusContextType = {
    isBackendAvailable,
    lastError,
    retryConnection,
    useFallbackData,
  };

  return (
    <BackendStatusContext.Provider value={value}>
      {children}
    </BackendStatusContext.Provider>
  );
}

// Enhanced tRPC hooks that handle errors gracefully
export function useTRPCWithFallback<T>(
  queryKey: string,
  queryFn: () => any,
  fallbackData?: T
) {
  const { useFallbackData } = useBackendStatus();
  const [data, setData] = useState<T | null>(fallbackData || null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    if (useFallbackData) {
      // Use fallback data
      const mockData = getFallbackData(queryKey) as T;
      if (mockData) {
        setData(mockData);
        setError(null);
      } else if (fallbackData) {
        setData(fallbackData);
        setError(null);
      } else {
        setError(`No fallback data available for ${queryKey}`);
      }
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await queryFn();
      setData(result);
      setError(null);
    } catch (err) {
      const errorMessage = normalizeError(err);
      console.error(`[tRPC Fallback] Query ${queryKey} failed:`, errorMessage);
      
      // Try to use fallback data
      const mockData = getFallbackData(queryKey) as T;
      if (mockData) {
        setData(mockData);
        setError(null);
        console.log(`[tRPC Fallback] Using mock data for ${queryKey}`);
      } else if (fallbackData) {
        setData(fallbackData);
        setError(null);
      } else {
        setData(null);
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [queryKey, useFallbackData, queryFn, fallbackData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, isLoading, refetch: fetchData };
}

// Enhanced mutation hook with better error handling
export function useTRPCMutationWithFallback<T, TVariables>(
  mutationKey: string,
  mutationFn: (variables: TVariables) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    fallbackResponse?: T;
  }
) {
  const { useFallbackData } = useBackendStatus();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (variables: TVariables) => {
    if (useFallbackData) {
      // Simulate mutation in fallback mode
      console.log(`[tRPC Fallback] Simulating mutation ${mutationKey} with:`, variables);
      
      if (options?.fallbackResponse) {
        options.onSuccess?.(options.fallbackResponse);
        return options.fallbackResponse;
      } else {
        const mockResponse = { success: true, message: `Simulated ${mutationKey}` } as T;
        options?.onSuccess?.(mockResponse);
        return mockResponse;
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await mutationFn(variables);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = normalizeError(err);
      console.error(`[tRPC Fallback] Mutation ${mutationKey} failed:`, errorMessage);
      
      setError(errorMessage);
      options?.onError?.(errorMessage);
      
      // Show user-friendly error
      Alert.alert(
        'Operation Failed',
        `${mutationKey} failed: ${errorMessage}`,
        [
          { text: 'OK', style: 'default' }
        ]
      );
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
}

// Enhanced tRPC query hook that automatically handles errors and provides fallback data
export function useTRPCQueryWithFallback<T>(
  queryKey: string,
  queryResult: any // The result from trpc.something.useQuery()
): { data: T | null; error: string | null; isLoading: boolean; refetch: () => void } {
  const fallbackData = getFallbackData(queryKey) as T;
  
  // If the query failed but we have fallback data, use it
  if (queryResult.error && fallbackData) {
    console.log(`[tRPC Fallback] Using fallback data for failed query: ${queryKey}`);
    return {
      data: fallbackData,
      error: null,
      isLoading: false,
      refetch: queryResult.refetch || (() => {})
    };
  }
  
  // If the query is loading and we have fallback data, show it while loading
  if (queryResult.isLoading && fallbackData) {
    return {
      data: fallbackData,
      error: null,
      isLoading: true,
      refetch: queryResult.refetch || (() => {})
    };
  }
  
  // Return the actual query result
  return {
    data: queryResult.data || null,
    error: queryResult.error ? normalizeError(queryResult.error) : null,
    isLoading: queryResult.isLoading || false,
    refetch: queryResult.refetch || (() => {})
  };
}