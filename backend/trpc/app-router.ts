import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { oauthStartProcedure, oauthCallbackProcedure } from "./routes/oauth/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  oauth: createTRPCRouter({
    start: oauthStartProcedure,
    callback: oauthCallbackProcedure,
  }),
});

export type AppRouter = typeof appRouter;