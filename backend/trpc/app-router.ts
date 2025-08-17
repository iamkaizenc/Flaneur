import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { oauthStartProcedure, oauthCallbackProcedure, oauthRefreshProcedure, oauthRevokeProcedure } from "./routes/oauth/route";
import { contentListProcedure, contentQueueProcedure, contentHoldProcedure, contentRetryProcedure, contentCreateProcedure, contentStatsProcedure } from "./routes/content/list/route";
import { insightsListProcedure } from "./routes/insights/list/route";
import { settingsGetProcedure, settingsUpdateProcedure, settingsConnectProcedure, settingsDisconnectProcedure, settingsTestNotificationProcedure, settingsGetHealthProcedure, settingsGetVersionProcedure } from "./routes/settings/route";
import { authRegisterProcedure, authLoginProcedure, authLogoutProcedure, authMeProcedure, authUpdateProfileProcedure, authUpdateEmailProcedure, authUpdatePasswordProcedure, authDeleteAccountProcedure } from "./routes/auth/route";
import { plansGetCurrentProcedure, plansListProcedure, plansUpgradeProcedure, plansDowngradeProcedure, plansGetUsageProcedure } from "./routes/plans/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  oauth: createTRPCRouter({
    start: oauthStartProcedure,
    callback: oauthCallbackProcedure,
    refresh: oauthRefreshProcedure,
    revoke: oauthRevokeProcedure,
  }),
  content: createTRPCRouter({
    list: contentListProcedure,
    queue: contentQueueProcedure,
    hold: contentHoldProcedure,
    retry: contentRetryProcedure,
    create: contentCreateProcedure,
    stats: contentStatsProcedure,
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
    health: settingsGetHealthProcedure,
    version: settingsGetVersionProcedure,
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
    list: plansListProcedure,
    upgrade: plansUpgradeProcedure,
    downgrade: plansDowngradeProcedure,
    usage: plansGetUsageProcedure,
  }),
});

export type AppRouter = typeof appRouter;