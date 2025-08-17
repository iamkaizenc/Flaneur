# Flâneur — Autonomous Social Media Agency

A sophisticated mobile application for managing autonomous social media marketing through AI-powered agents. Flâneur provides elegant, minimalist control over your social media presence with intelligent automation.

## 🎯 Project Overview

Flâneur is an autonomous social media management platform that allows users to guide AI agents through strategic prompts. The system operates 24/7, planning, creating, publishing, and optimizing content across multiple social platforms.

### Key Features

- **Autonomous Operation**: AI agents work continuously to manage your social presence
- **Strategic Prompts**: Guide your AI with simple, powerful course corrections
- **Multi-Platform Support**: X (Twitter), Instagram, LinkedIn, Telegram, TikTok, Facebook
- **Real-time Analytics**: Live performance monitoring and intelligent insights
- **Premium Design**: Monochrome aesthetic with serif/sans-serif typography harmony

## 🏗️ Architecture

### Mobile App (React Native + Expo)
- **Flow Screen**: Live status monitoring and task queue
- **Course Screen**: Strategic prompt management and settings
- **Content Screen**: Calendar view and content pipeline
- **Growth Screen**: Analytics, metrics, and AI insights

### Core Technologies
- React Native with Expo SDK 53
- TypeScript with strict type checking
- React Query for server state management
- AsyncStorage for local persistence
- Lucide React Native for icons

## 🎨 Design System

### Brand Identity
- **Name**: Flâneur (French: "one who strolls")
- **Aesthetic**: Minimalist, premium, monochrome
- **Typography**: Serif headings + Sans-serif body text
- **Colors**: High-contrast black and white

### Theme Configuration
```typescript
export const theme = {
  colors: {
    black: '#000000',
    white: '#FFFFFF',
    gray: { /* 50-900 scale */ }
  },
  typography: {
    serif: { fontFamily: 'serif' },
    sansSerif: { fontFamily: 'system' }
  }
}
```

## 📱 Screen Details

### Flow Screen
- **Live Status**: Current AI operations with progress indicators
- **Task Queue**: Upcoming content creation and publishing
- **Today's Activity**: Published content with performance metrics
- **Quick Stats**: Success rate, reach, and queue status

### Course Screen
- **Strategic Prompts**: Text-based guidance for AI behavior
- **Focus Areas**: Product, Brand, Industry, Community
- **Tone Settings**: Informative, Casual, Professional, Bold
- **Risk Levels**: Conservative, Normal, Aggressive

### Content Screen
- **Calendar View**: Weekly content distribution visualization
- **Status Filters**: Draft, Queued, Published, Held content
- **Content Cards**: Preview, platform, scheduling, and status
- **Detail Navigation**: Tap to view full content details

### Growth Screen
- **Metrics Grid**: Followers, Impressions, Engagement, Comments
- **Growth Charts**: Weekly performance visualization
- **AI Insights**: Anomaly detection and optimization opportunities
- **Performance Summary**: Intelligent analysis and recommendations

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ with Bun package manager
- Expo CLI and development tools
- iOS Simulator or Android Emulator (optional)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd flaneur-app

# Install dependencies
bun install

# Start development server
bun run start

# Start with web preview
bun run start-web
```

### Environment Configuration
Create `.env` file with required variables:
```env
# API Configuration
API_BASE_URL=https://api.flaneur.app
OPENAI_API_KEY=your_openai_key

# Platform API Keys
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
INSTAGRAM_APP_ID=your_instagram_app_id
LINKEDIN_CLIENT_ID=your_linkedin_client_id
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Development Settings
DRY_RUN=true
LOG_LEVEL=debug
```

## 🚀 Platform Integration

### Supported Platforms
- **X (Twitter)**: OAuth 2.0, posting, basic metrics
- **Instagram**: Graph API, feed/reels, insights
- **LinkedIn**: Company pages, sharing, analytics
- **Telegram**: Bot API, channel posting
- **TikTok**: Business API, video upload (planned)
- **Facebook**: Pages API, posting, metrics (planned)

### OAuth Flow
1. User initiates platform connection
2. Redirect to platform OAuth endpoint
3. Handle callback and token exchange
4. Store encrypted tokens with refresh capability
5. Verify permissions and account details

### Content Publishing
- **Rate Limiting**: Platform-specific limits with backoff
- **Retry Logic**: Exponential backoff for failed requests
- **Guardrails**: Content filtering and risk assessment
- **Scheduling**: Optimal timing based on audience analysis

## 📊 Data Management

### State Architecture
- **React Query**: Server state and caching
- **AsyncStorage**: Local persistence for settings
- **Context Providers**: Shared application state
- **Type Safety**: Strict TypeScript throughout

### Content Pipeline
```typescript
interface ContentItem {
  id: string;
  title: string;
  platform: string;
  status: "draft" | "queued" | "published" | "held";
  scheduledTime: string;
  preview: string;
}
```

### Analytics Schema
```typescript
interface Metrics {
  followers: string;
  followersChange: number;
  impressions: string;
  impressionsChange: number;
  engagement: string;
  engagementChange: number;
  growthData: number[];
}
```

## 🛡️ Security & Privacy

### Data Protection
- **Token Encryption**: AES-GCM encryption for stored credentials
- **Secure Storage**: Platform-specific secure storage APIs
- **Network Security**: HTTPS-only communication
- **Privacy First**: Minimal data collection and retention

### Content Safety
- **Guardrails**: Configurable content filtering
- **Risk Assessment**: Automated content risk scoring
- **Manual Review**: Hold queue for sensitive content
- **Compliance**: Platform ToS adherence monitoring

## 🧪 Testing Strategy

### Test Coverage
- **Unit Tests**: Core business logic and utilities
- **Integration Tests**: Platform adapters and API calls
- **Component Tests**: UI components and interactions
- **E2E Tests**: Critical user flows and scenarios

### Quality Assurance
- **TypeScript**: Strict type checking and validation
- **ESLint**: Code quality and consistency rules
- **Prettier**: Automated code formatting
- **Husky**: Pre-commit hooks and validation

## 📈 Performance Optimization

### Mobile Performance
- **React.memo()**: Component memoization for expensive renders
- **useCallback()**: Function memoization for stable references
- **useMemo()**: Value memoization for computed data
- **Image Optimization**: Proper sizing and caching strategies

### Network Efficiency
- **React Query**: Intelligent caching and background updates
- **Request Batching**: Combine multiple API calls when possible
- **Offline Support**: Graceful degradation without connectivity
- **Progressive Loading**: Skeleton screens and lazy loading

## 🚀 Deployment

### Build Configuration
```json
{
  "expo": {
    "name": "Flâneur",
    "slug": "flaneur-autonomous-social-media",
    "version": "1.0.0",
    "icon": "./assets/brand/flaneur-icon-ios-1024.png",
    "splash": {
      "image": "./assets/brand/flaneur-logo-white.png",
      "backgroundColor": "#000000"
    }
  }
}
```

### Asset Management
- **Logo Assets**: Multiple resolutions for different contexts
- **App Icons**: iOS and Android adaptive icons
- **Splash Screens**: Platform-specific splash configurations
- **Brand Guidelines**: Consistent visual identity across platforms

## 🔮 Future Roadmap

### Phase 2 Features
- **Advanced Analytics**: Machine learning insights and predictions
- **Multi-Account Management**: Enterprise-level account orchestration
- **A/B Testing**: Automated content variation testing
- **Voice Commands**: Natural language prompt input

### Platform Expansion
- **TikTok Integration**: Full video creation and publishing
- **YouTube Shorts**: Short-form video automation
- **Pinterest**: Visual content strategy automation
- **Reddit**: Community engagement automation

### AI Enhancements
- **GPT-4 Integration**: Advanced content generation
- **Image Generation**: Automated visual content creation
- **Video Synthesis**: AI-powered video content
- **Sentiment Analysis**: Real-time audience mood tracking

## 📚 Documentation

### API Documentation
- **Platform Adapters**: Integration guides for each social platform
- **Authentication**: OAuth flows and token management
- **Rate Limiting**: Platform-specific limits and handling
- **Error Handling**: Comprehensive error classification and recovery

### User Guides
- **Getting Started**: Onboarding and initial setup
- **Platform Connection**: Step-by-step connection guides
- **Content Strategy**: Best practices for prompt engineering
- **Analytics Interpretation**: Understanding metrics and insights

## 🤝 Contributing

### Development Guidelines
- **Code Style**: Follow established TypeScript and React Native patterns
- **Commit Messages**: Use conventional commit format
- **Pull Requests**: Include tests and documentation updates
- **Issue Reporting**: Use provided templates for bugs and features

### Architecture Decisions
- **Mobile-First**: Prioritize mobile experience and performance
- **Type Safety**: Maintain strict TypeScript throughout
- **Platform Compatibility**: Ensure cross-platform functionality
- **Accessibility**: Follow WCAG guidelines for inclusive design

## 📄 License

This project is proprietary software. All rights reserved.

---

**Flâneur** — *Autonomous Social Media Agency*  
Elegant automation for the modern digital presence.