import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { oauthStartProcedure, oauthCallbackProcedure, oauthRefreshProcedure, oauthRevokeProcedure } from "./routes/oauth/route";
import { contentListProcedure, contentQueueProcedure, contentHoldProcedure, contentRetryProcedure, contentCreateProcedure, contentStatsProcedure } from "./routes/content/list/route";
import { insightsListProcedure } from "./routes/insights/list/route";
import { settingsGetProcedure, settingsUpdateProcedure, settingsConnectProcedure, settingsDisconnectProcedure, settingsTestNotificationProcedure, settingsGetHealthProcedure, settingsGetVersionProcedure } from "./routes/settings/route";
import { authRegisterProcedure, authLoginProcedure, authLogoutProcedure, authMeProcedure, authUpdateProfileProcedure, authUpdateEmailProcedure, authUpdatePasswordProcedure, authDeleteAccountProcedure } from "./routes/auth/route";
import { plansGetCurrentProcedure, plansListProcedure, plansUpgradeProcedure, plansDowngradeProcedure, plansGetUsageProcedure } from "./routes/plans/route";
import { cronMetricsRefreshProcedure, cronDailyRollupProcedure, cronTriggerAllProcedure, cronStatusProcedure } from "./routes/crons/route";
import { generateIdempotencyKeyProcedure, checkIdempotencyProcedure, storeIdempotentResultProcedure, publishWithIdempotencyProcedure, getIdempotencyStatsProcedure } from "./routes/idempotency/route";
import { getPostingWindowProcedure, updatePostingWindowProcedure, isWithinPostingWindowProcedure, getOptimalPostingTimesProcedure, batchConvertTimezoneProcedure } from "./routes/timezones/route";
import { getTraceLogsProcedure, addTraceLogProcedure, getTraceLogsSummaryProcedure, getSystemTraceLogsProcedure, clearOldTraceLogsProcedure } from "./routes/traces/route";
import { getAdsProcedure, trackAdImpressionProcedure, trackAdClickProcedure, getAdStatsProcedure, updateAdSettingsProcedure, getPaywallContentProcedure } from "./routes/ads/route";

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
  crons: createTRPCRouter({
    metricsRefresh: cronMetricsRefreshProcedure,
    dailyRollup: cronDailyRollupProcedure,
    triggerAll: cronTriggerAllProcedure,
    status: cronStatusProcedure,
  }),
  idempotency: createTRPCRouter({
    generateKey: generateIdempotencyKeyProcedure,
    check: checkIdempotencyProcedure,
    store: storeIdempotentResultProcedure,
    publish: publishWithIdempotencyProcedure,
    stats: getIdempotencyStatsProcedure,
  }),
  timezones: createTRPCRouter({
    getPostingWindow: getPostingWindowProcedure,
    updatePostingWindow: updatePostingWindowProcedure,
    isWithinWindow: isWithinPostingWindowProcedure,
    getOptimalTimes: getOptimalPostingTimesProcedure,
    batchConvert: batchConvertTimezoneProcedure,
  }),
  traces: createTRPCRouter({
    get: getTraceLogsProcedure,
    add: addTraceLogProcedure,
    summary: getTraceLogsSummaryProcedure,
    system: getSystemTraceLogsProcedure,
    clearOld: clearOldTraceLogsProcedure,
  }),
  ads: createTRPCRouter({
    get: getAdsProcedure,
    trackImpression: trackAdImpressionProcedure,
    trackClick: trackAdClickProcedure,
    stats: getAdStatsProcedure,
    updateSettings: updateAdSettingsProcedure,
    getPaywall: getPaywallContentProcedure,
  }),
});

export type AppRouter = typeof appRouter;