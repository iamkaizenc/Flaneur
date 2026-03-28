# Flâneur - Autonomous Social Media Agent

A sophisticated mobile application that transforms social media strategy through intelligent automation and content curation. Built with React Native, Expo, and a powerful tRPC backend.

## 🎯 5-Minute Demo Flow

Experience the complete Flâneur workflow in just 5 minutes:

### Demo Setup (DRY_RUN Mode)
- **Environment**: DRY_RUN=ON (simulates all external APIs)
- **Mock Data**: 1 workspace, X+Telegram connected, 6 queued items, 7 days metrics
- **Plan**: Platinum (all features enabled)
- **Guardrails**: Banned words include "revolutionary" (for held example)

### Demo Steps

1. **Settings > Connections** 
   - View X + Telegram "Connected" status with last refresh times
   - See LinkedIn "Expired" with "Fix" button
   - Test OAuth flow (simulated in DRY_RUN)

2. **Agent Tab** (if implemented)
   - Prompt: "September launch tweet + LinkedIn post"
   - AI generates suggestions → Apply → Creates draft content

3. **Content Management**
   - Open draft, edit content → Queue (status=queued)
   - View "Held" example with guardrail reason
   - Use "Review & Requeue" to fix held content

4. **Publisher Pipeline**
   - Watch log trail: queued → publishing → success (DRY_RUN)
   - Observe quota/window rules enforcement
   - See retry logic for failed items

5. **Growth Analytics**
   - 7-day performance charts
   - 2+ insights including 1 anomaly detection
   - "Best 3 / Weak 3" content performance

6. **Plan Management**
   - Switch Premium → automation toggles disabled + Upgrade CTA
   - Switch Free → ads shown + feature limitations
   - Demonstrate plan-based feature gating

7. **Profile & Security**
   - Change profile picture (optimistic UI update)
   - Password change flow with validation
   - Account deletion with confirmation modal

### Key Demo Points
- **Real-time Updates**: UI reflects backend state changes
- **Error Handling**: Graceful failures with user-friendly messages  
- **Plan Enforcement**: Features disabled based on subscription tier
- **Security**: All sensitive operations require confirmation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and bun/npm/yarn
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator or Android Emulator (optional)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd flaneur
   bun install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration (DRY_RUN=true for demo)
   ```

3. **Start Development**
   ```bash
   bun run dev
   ```

4. **Open the App**
   - Web: Opens automatically in browser
   - Mobile: Scan QR code with Expo Go app
   - Simulator: Press `i` for iOS or `a` for Android

### Available Scripts
```bash
bun run dev          # Start development server
bun run ios          # Run on iOS simulator
bun run android      # Run on Android emulator
bun run web          # Run on web browser
bun run typecheck    # Run TypeScript type checking
bun run build        # Build for production
bun run test         # Run test suite
bun run seed         # Seed development data
```

## 🏗️ Architecture

### Frontend (React Native + Expo)
- **Framework**: Expo SDK 53 with React Native Web compatibility
- **Navigation**: Expo Router (file-based routing)
- **State Management**: tRPC + React Query for server state, @nkzw/create-context-hook for local state
- **Styling**: React Native StyleSheet with theme system
- **Icons**: Lucide React Native

### Backend (Node.js + Hono + tRPC)
- **Runtime**: Node.js with Hono web framework
- **API**: tRPC for type-safe client-server communication
- **Validation**: Zod schemas with SuperJSON serialization
- **Authentication**: JWT-based with secure session management
- **OAuth**: Platform-specific integrations with token encryption

### Key Features
- **DRY_RUN Mode**: Complete simulation for development/demo
- **Plan-Based Gating**: Server-side feature enforcement
- **Real-time Updates**: Optimistic UI with query invalidation
- **Cross-Platform**: Web, iOS, and Android support
- **Type Safety**: End-to-end TypeScript with strict checking

## 📱 Platform Integrations

### Supported Platforms
- **X (Twitter)**: OAuth 2.0, text + media publishing, engagement metrics
- **Instagram**: Graph API, image/carousel/reels, basic insights  
- **LinkedIn**: Company pages, professional content, reactions/impressions
- **TikTok**: Business API, video upload, basic metrics
- **Facebook**: Pages API, post publishing, engagement data
- **Telegram**: Bot API, channel posting, message delivery

### OAuth Flow
1. User initiates connection in Settings
2. Redirect to platform OAuth endpoint
3. Exchange authorization code for access token
4. Encrypt and store tokens with AES-GCM
5. Auto-refresh tokens when needed
6. Graceful handling of expired/revoked tokens

### DRY_RUN vs LIVE Mode

**DRY_RUN=true (Development/Demo)**
- All API calls simulated
- Mock data generation
- Safe testing environment
- Full feature demonstration
- No real social media posting

**DRY_RUN=false (Production)**
- Real API calls to social platforms
- Actual content publishing
- Live metrics and analytics
- Production error handling
- Rate limiting enforcement

## 🔧 Configuration

### Environment Variables

#### Core Settings
```bash
NODE_ENV=development
BASE_URL=http://localhost:3000
DRY_RUN=true  # Set to false for production
```

#### OAuth Credentials (required when DRY_RUN=false)
```bash
X_CLIENT_ID=your_twitter_client_id
X_CLIENT_SECRET=your_twitter_client_secret
INSTAGRAM_CLIENT_ID=your_instagram_app_id
# ... (see .env.example for complete list)
```

#### Security
```bash
ENCRYPTION_KEY=your_32_character_key  # Generate with: openssl rand -hex 32
JWT_SECRET=your_jwt_secret
```

### Publishing Rules
- **Daily Limits**: Per-platform quotas (configurable)
- **Posting Window**: 08:00-22:00 (configurable)
- **Guardrails**: Banned words/tags with risk levels
- **Rate Limiting**: Exponential backoff on API failures

## 🧪 Development

### Scripts
```bash
bun run dev          # Start development server
bun run build        # Build for production  
bun run test         # Run test suite
bun run typecheck    # TypeScript validation
bun run seed         # Seed development data
```

### Cron Jobs & Background Tasks

**Automated Schedules**
- **30-minute**: Metrics refresh from connected platforms
- **24-hour**: Daily rollup and anomaly detection
- **Manual Trigger**: `/api/trpc/crons.triggerAll` for development

**Idempotency & Retry Logic**
- Unique keys prevent duplicate posts
- Exponential backoff for failed operations
- Comprehensive trace logging
- Automatic retry for transient failures

### Project Structure
```
├── app/                 # Expo Router pages
│   ├── (tabs)/         # Tab navigation
│   ├── _layout.tsx     # Root layout
│   └── onboarding.tsx  # Auth flows
├── backend/            # tRPC API server
│   ├── trpc/          # Route definitions
│   ├── types/         # Shared schemas
│   └── hono.ts        # Server entry
├── components/         # Reusable UI components
├── hooks/             # Custom React hooks
├── providers/         # Context providers
└── constants/         # Theme and configuration
```

### Adding New Features

1. **Backend Route**
   ```typescript
   // backend/trpc/routes/feature/route.ts
   export const featureProcedure = publicProcedure
     .input(schema)
     .mutation(async ({ input }) => {
       // Implementation
     });
   ```

2. **Frontend Hook**
   ```typescript
   // hooks/useFeature.ts
   export const useFeature = () => {
     const mutation = trpc.feature.action.useMutation();
     return { action: mutation.mutate, isLoading: mutation.isLoading };
   };
   ```

3. **UI Component**
   ```typescript
   // components/FeatureComponent.tsx
   export const FeatureComponent = () => {
     const { action } = useFeature();
     return <TouchableOpacity onPress={() => action(data)} />;
   };
   ```

### Timezone Handling

**Posting Windows**
- User sets local timezone preferences
- Server converts to UTC for enforcement
- Optimal posting times per platform
- Automatic DST adjustments (production)

**Implementation**
```typescript
// Get user's posting window
const window = await trpc.timezones.getPostingWindow.query({ timezone: 'America/New_York' });

// Check if time is within window
const isValid = await trpc.timezones.isWithinWindow.query({ 
  scheduledAt: '2024-01-15T14:00:00Z',
  timezone: 'America/New_York'
});
```

## 🔒 Security

### Data Protection
- **Token Encryption**: AES-GCM with environment-based keys
- **Password Hashing**: Argon2id (when implemented)
- **Session Management**: JWT with secure expiration
- **Input Validation**: Zod schemas on all endpoints

### Privacy
- **Local Storage**: Minimal data persistence
- **API Calls**: All external requests logged and monitored
- **User Data**: Encrypted at rest, secure transmission
- **OAuth Tokens**: Never logged or exposed in client

## 📊 Monitoring & Analytics

### Built-in Analytics
- **Content Performance**: Impressions, engagement, reach
- **Anomaly Detection**: 3-sigma deviation alerts
- **Usage Tracking**: API quotas, rate limits, errors
- **Plan Enforcement**: Feature usage monitoring

### Trace Logging System
```typescript
// View content publishing trail
const logs = await trpc.traces.get.query({ contentId: '123' });
// Returns: queued → publishing → published/held/failed

// System-wide logs for debugging
const systemLogs = await trpc.traces.system.query({ 
  status: 'failed', 
  limit: 50 
});
```

### Insights & Anomaly Detection
- **Moving Averages**: 7-day baseline calculation
- **3-Sigma Rule**: Statistical outlier detection
- **Percentage Changes**: Performance vs previous period
- **Actionable Recommendations**: Specific improvement suggestions
- **Confidence Scores**: AI prediction reliability

### Free User Ad System
**Placement Strategy**
- Settings footer card
- Growth chart under-banner
- Content list (every 10th item)
- Modal interstitials

**DRY_RUN Ads**
- Labeled "Ad" for transparency
- No tracking in development
- Disabled for Premium/Platinum
- Environment controlled (`ADS_ENABLED=true`)

## 🚢 Deployment

### Development
```bash
bun run dev  # Local development with hot reload
```

### Production Build
```bash
bun run build     # Build optimized bundle
bun run typecheck # Validate TypeScript
```

### Platform Deployment
- **Web**: Static hosting (Vercel, Netlify)
- **Mobile**: Expo Application Services (EAS)
- **Backend**: Node.js hosting (Railway, Render)

### IAP Sandbox Testing

**TestFlight Setup**
1. Enable Sandbox environment in App Store Connect
2. Create test user accounts in Sandbox
3. Set `IAP_DRY_RUN=true` for testing without real charges
4. Test purchase flow: Free → Premium → Platinum
5. Test restore purchases functionality
6. Verify plan features are properly gated

**Subscription Testing Matrix**
```bash
# Test all plan transitions
Free → Premium: Analytics enabled, automation disabled
Premium → Platinum: Automation enabled, unlimited accounts
Platinum → Free: All features disabled, ads shown
Restore: Previous plan restored from App Store receipt
```

**Settings Subscription UI**
- Current plan with feature list
- Upgrade buttons (contextual)
- Restore purchases option
- Renewal info and manage subscription link
- Small "Sandbox" badge when `IAP_DRY_RUN=true`

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes with proper TypeScript types
4. Add tests for new functionality
5. Ensure all checks pass: `npm run typecheck && npm run lint`
6. Submit pull request with clear description

### Code Standards
- **TypeScript**: Strict mode with explicit types
- **React**: Functional components with hooks
- **Styling**: StyleSheet with theme consistency
- **Testing**: Unit tests for business logic
- **Documentation**: JSDoc for complex functions

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

### Common Issues

**OAuth Connection Fails**
- Verify client credentials in .env
- Check redirect URI configuration
- Ensure DRY_RUN=true for demo mode

**TypeScript Errors**
- Run `npm run typecheck` for detailed errors
- Ensure all imports use correct paths
- Check tRPC procedure types match usage

**Mobile App Won't Load**
- Clear Expo cache: `expo start -c`
- Verify network connectivity
- Check console for error messages

### Getting Help
- **Website**: [flaneurcollective.com](https://flaneurcollective.com)
- **Support Email**: support@flaneurcollective.com
- **Privacy Policy**: [flaneurcollective.com/privacy](https://flaneurcollective.com/privacy)
- **Terms of Service**: [flaneurcollective.com/terms](https://flaneurcollective.com/terms)

### Account Linking Steps
1. **X (Twitter)**: OAuth 2.0 → Developer Portal → Callback URL
2. **LinkedIn**: Company Pages API → OAuth consent
3. **Instagram**: Meta Business → Graph API permissions
4. **Telegram**: BotFather → Create bot → Get token
5. **TikTok**: Business API → Developer account
6. **Facebook**: Meta for Developers → App creation

### Common Errors & Solutions

**"Rate limit exceeded"**
- Check daily quotas in Settings
- Wait for rate limit reset
- Verify posting window compliance

**"Token expired"**
- Use "Fix" button in Connections
- Re-authenticate with platform
- Check token refresh settings

**"Content held by guardrail"**
- Review banned words list
- Adjust risk level settings
- Edit content and requeue

**"Publishing window closed"**
- Check timezone settings
- Verify posting hours (8 AM - 10 PM default)
- Schedule for next available window

---

**Flâneur** - Transforming social media through intelligent automation. Built with ❤️ using React Native and modern web technologies.