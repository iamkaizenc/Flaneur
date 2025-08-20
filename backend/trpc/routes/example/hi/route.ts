import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export default publicProcedure
  .input(z.object({ name: z.string().optional() }).optional())
  .query(({ input }) => {
    console.log('[tRPC] Hi route called successfully');
    return {
      hello: input?.name || "World",
      greeting: "Hello from tRPC!",
      timestamp: new Date().toISOString(),
      status: "success",
      message: "tRPC is working correctly"
    };
  });