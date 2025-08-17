import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { oauthStartProcedure, oauthCallbackProcedure, getConnectedAccountsProcedure, disconnectAccountProcedure } from "./routes/oauth/route";
import { contentListProcedure, contentQueueProcedure, contentHoldProcedure, contentRetryProcedure } from "./routes/content/list/route";
import { insightsListProcedure } from "./routes/insights/list/route";
import { settingsGetProcedure, settingsUpdateProcedure, settingsConnectProcedure, settingsDisconnectProcedure, settingsTestNotificationProcedure } from "./routes/settings/route";
import { authRegisterProcedure, authLoginProcedure, authLogoutProcedure, authMeProcedure, authUpdateProfileProcedure, authUpdateEmailProcedure, authUpdatePasswordProcedure, authDeleteAccountProcedure } from "./routes/auth/route";
import { plansGetCurrentProcedure, plansUpgradeProcedure } from "./routes/plans/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  oauth: createTRPCRouter({
    start: oauthStartProcedure,
    callback: oauthCallbackProcedure,
    getConnectedAccounts: getConnectedAccountsProcedure,
    disconnect: disconnectAccountProcedure,
  }),
  content: createTRPCRouter({
    list: contentListProcedure,
    queue: contentQueueProcedure,
    hold: contentHoldProcedure,
    retry: contentRetryProcedure,
  }),
  insights: createTRPCRouter({
    list: insightsListProcedure,
  }),
  settings: createTRPCRouter({
    get: settingsGetProcedure,
    update: settingsUpdateProcedure,
    connect: settingsConnectProcedure,
    disconnect: settingsDisconnectProcedure,
    testNotification: settingsTestNotificationProcedure,
  }),
  auth: createTRPCRouter({
    register: authRegisterProcedure,
    login: authLoginProcedure,
    logout: authLogoutProcedure,
    me: authMeProcedure,
    updateProfile: authUpdateProfileProcedure,
    updateEmail: authUpdateEmailProcedure,
    updatePassword: authUpdatePasswordProcedure,
    deleteAccount: authDeleteAccountProcedure,
  }),
  plans: createTRPCRouter({
    getCurrent: plansGetCurrentProcedure,
    upgrade: plansUpgradeProcedure,
  }),
});

export type AppRouter = typeof appRouter;