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
- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator or Android Emulator (optional)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd flaneur
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration (DRY_RUN=true for demo)
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

4. **Open the App**
   - Web: Opens automatically in browser
   - Mobile: Scan QR code with Expo Go app
   - Simulator: Press `i` for iOS or `a` for Android

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
npm run dev          # Start development server
npm run build        # Build for production  
npm run test         # Run test suite
npm run typecheck    # TypeScript validation
npm run lint         # ESLint checking
```

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

### Logging
- **Structured Logging**: JSON format with correlation IDs
- **Error Tracking**: Typed errors with context
- **Performance**: Request timing and optimization
- **Audit Trail**: All user actions and system events

## 🚢 Deployment

### Development
```bash
npm run dev  # Local development with hot reload
```

### Production Build
```bash
npm run build     # Build optimized bundle
npm run preview   # Test production build locally
```

### Platform Deployment
- **Web**: Static hosting (Vercel, Netlify)
- **Mobile**: Expo Application Services (EAS)
- **Backend**: Node.js hosting (Railway, Render)

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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
- **Documentation**: Check README and code comments
- **Issues**: Create GitHub issue with reproduction steps
- **Discussions**: Use GitHub Discussions for questions

---

**Flâneur** - Transforming social media through intelligent automation. Built with ❤️ using React Native and modern web technologies.