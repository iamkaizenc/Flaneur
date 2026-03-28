export function normalizeError(e: unknown): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  
  // Handle tRPC errors
  if (e && typeof e === "object") {
    const anyErr = e as any;
    if (anyErr.message) return String(anyErr.message);
    if (anyErr.data?.code || anyErr.data?.message) {
      return `${anyErr.data.code ?? "ERR"}: ${anyErr.data.message ?? "Unknown error"}`;
    }
    try { 
      return JSON.stringify(anyErr); 
    } catch { 
      return "Unknown error"; 
    }
  }
  
  return "Unknown error";
}