export function normalizeError(e: unknown): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  // @ts-ignore (tRPC shape)
  if (e?.message) return String(e.message);
  try { return JSON.stringify(e); } catch { return "Unknown error"; }
}