import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Always use the configured API URL for consistency
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log('[tRPC] Using configured API URL:', process.env.EXPO_PUBLIC_API_URL);
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Development fallback - use single consistent URL
  console.log('[tRPC] Using fallback API URL: http://localhost:8081');
  return 'http://localhost:8081';
};



export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        try {
          console.log('[tRPC] Making request to:', url);
          console.log('[tRPC] Request options:', {
            method: options?.method || 'GET',
            headers: options?.headers,
            body: options?.body ? 'present' : 'none'
          });
          
          const response = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...options?.headers,
            },
          });
          
          console.log('[tRPC] Response status:', response.status);
          console.log('[tRPC] Response headers:', Object.fromEntries(response.headers.entries()));
          
          // Check if response is ok
          if (!response.ok) {
            console.error('[tRPC] HTTP error:', response.status, response.statusText);
            
            // Try to get response text for debugging
            const responseText = await response.text();
            console.error('[tRPC] Response body:', responseText.substring(0, 500));
            
            // Return a proper JSON error response instead of throwing
            const errorResponse = new Response(
              JSON.stringify({
                error: {
                  code: 'HTTP_ERROR',
                  message: `HTTP ${response.status}: ${response.statusText}`,
                  data: { httpStatus: response.status }
                }
              }),
              {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
              }
            );
            return errorResponse;
          }
          
          // Check content type
          const contentType = response.headers.get('content-type');
          if (!contentType?.includes('application/json')) {
            console.error('[tRPC] Non-JSON response:', contentType);
            
            // Try to get response text for debugging
            const responseText = await response.text();
            console.error('[tRPC] Response body:', responseText.substring(0, 500));
            
            // Return a proper JSON error response instead of throwing
            const errorResponse = new Response(
              JSON.stringify({
                error: {
                  code: 'NON_JSON_RESPONSE',
                  message: `Expected JSON response, got: ${contentType}`,
                  data: { contentType, responsePreview: responseText.substring(0, 200) }
                }
              }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              }
            );
            return errorResponse;
          }
          
          return response;
        } catch (error) {
          console.error('[tRPC] Fetch error:', error);
          
          // Return a proper JSON error response instead of throwing
          const errorResponse = new Response(
            JSON.stringify({
              error: {
                code: 'FETCH_ERROR',
                message: error instanceof Error ? error.message : 'Network error',
                data: { originalError: String(error) }
              }
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );
          return errorResponse;
        }
      },
    }),
  ],
});