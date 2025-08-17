// Seed script for development data
console.log("[Seed] Starting development data seeding...");

// Mock workspace data
const seedWorkspace = {
  id: "workspace_1",
  userId: "user_1",
  name: "Flâneur Demo Workspace",
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock connected accounts (DRY_RUN mode)
const seedAccounts = [
  {
    id: "account_x_1",
    userId: "user_1",
    platform: "x",
    handle: "@flaneur_demo",
    displayName: "Flâneur Demo",
    status: "connected",
    lastRefresh: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
    scopes: ["read", "write"],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 25 * 60 * 1000)
  },
  {
    id: "account_telegram_1", 
    userId: "user_1",
    platform: "telegram",
    handle: "@flaneur_channel",
    displayName: "Flâneur Channel",
    status: "connected",
    lastRefresh: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    scopes: ["channel_post"],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    updatedAt: new Date(Date.now() - 45 * 60 * 1000)
  },
  {
    id: "account_linkedin_1",
    userId: "user_1", 
    platform: "linkedin",
    handle: "flaneur-company",
    displayName: "Flâneur Company",
    status: "expired",
    lastRefresh: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    scopes: ["r_liteprofile", "w_member_social"],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }
];

// Mock 7-day metrics for analytics
const seedMetrics = [];
for (let i = 6; i >= 0; i--) {
  const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
  
  // X account metrics
  seedMetrics.push({
    id: `metrics_x_${i}`,
    accountId: "account_x_1",
    date,
    followers: 1250 + Math.floor(Math.random() * 20) - 10,
    impressions: 8500 + Math.floor(Math.random() * 2000) - 1000,
    engagements: 340 + Math.floor(Math.random() * 100) - 50,
    clicks: 85 + Math.floor(Math.random() * 30) - 15,
    ctr: (1.0 + (Math.random() * 0.5 - 0.25)).toFixed(2),
    posts: Math.floor(Math.random() * 4) + 1,
    createdAt: date
  });
  
  // Telegram account metrics
  seedMetrics.push({
    id: `metrics_telegram_${i}`,
    accountId: "account_telegram_1",
    date,
    followers: 890 + Math.floor(Math.random() * 15) - 7,
    impressions: 2100 + Math.floor(Math.random() * 500) - 250,
    engagements: 125 + Math.floor(Math.random() * 40) - 20,
    clicks: 42 + Math.floor(Math.random() * 15) - 7,
    ctr: (2.0 + (Math.random() * 0.8 - 0.4)).toFixed(2),
    posts: Math.floor(Math.random() * 2) + 1,
    createdAt: date
  });
}

// Default workspace settings
const seedSettings = {
  workspaceId: "workspace_1",
  data: {
    accounts: seedAccounts.map(acc => ({
      platform: acc.platform,
      handle: acc.handle,
      status: acc.status,
      lastRefresh: acc.lastRefresh.toISOString(),
      scopes: acc.scopes
    })),
    quotas: {
      dailyLimits: {
        X: 10,
        Instagram: 5,
        LinkedIn: 3,
        TikTok: 3,
        Facebook: 5,
        Telegram: 10
      },
      postingWindow: {
        start: 8,
        end: 22
      },
      dryRun: true
    },
    guardrails: {
      bannedWords: ["revolutionary", "disrupt", "game-changer"],
      bannedTags: ["#spam", "#fake"],
      riskLevel: "normal"
    },
    notifications: {
      emails: ["demo@flaneurcollective.com"],
      telegramChatId: "123456789",
      notifyOn: ["publish_error", "held", "anomaly"]
    },
    branding: {
      logoWordmarkEnabled: true,
      theme: "black-white"
    }
  },
  updatedAt: new Date()
};

// Mock user for demo
const seedUser = {
  id: "user_1",
  email: "demo@flaneurcollective.com",
  displayName: "Flâneur Demo User",
  avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  plan: "platinum", // Start with full features
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  updatedAt: new Date()
};

console.log("[Seed] Seeded data:");
console.log("- 1 workspace:", seedWorkspace.name);
console.log("- 3 social accounts:", seedAccounts.map(a => `${a.platform} (${a.status})`).join(", "));
console.log("- 14 metrics entries (7 days × 2 platforms)");
console.log("- Default workspace settings with guardrails");
console.log("- Demo user with Platinum plan");
console.log("- DRY_RUN mode enabled for safe testing");

console.log("\n[Seed] Demo flow ready:");
console.log("1. Settings > Connections: X + Telegram connected, LinkedIn expired");
console.log("2. Content: 6 items queued, 1 held example with guardrail");
console.log("3. Growth: 7-day charts with mock anomaly detection");
console.log("4. Plans: Platinum features enabled, can test downgrades");

console.log("\n[Seed] Seeding completed successfully! 🌱");

export { seedWorkspace, seedAccounts, seedMetrics, seedSettings, seedUser };