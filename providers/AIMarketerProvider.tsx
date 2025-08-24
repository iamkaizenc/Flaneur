import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { trpc } from "@/lib/trpc";

interface ContentItem {
  id: string;
  title: string;
  platform: string;
  status: "draft" | "queued" | "published" | "held";
  scheduledTime: string;
  preview: string;
}

interface Insight {
  type: "anomaly" | "opportunity";
  title: string;
  description: string;
  action?: string;
}

interface AIMarketerContextType {
  // Flow data
  currentStatus: string;
  upcomingTasks: {
    title: string;
    status: string;
    platform: string;
    time: string;
  }[];
  todayPublished: {
    title: string;
    platform: string;
    time: string;
    impressions: string;
    engagement: string;
  }[];
  
  // Course data
  coursePrompts: string[];
  addCoursePrompt: (prompt: string) => void;
  removeCoursePrompt: (index: number) => void;
  updateSettings: (settings: { focus: string; tone: string; riskLevel: string }) => void;
  
  // Content data
  contentItems: ContentItem[];
  
  // Growth data
  metrics: {
    followers: string;
    followersChange: number;
    impressions: string;
    impressionsChange: number;
    engagement: string;
    engagementChange: number;
    comments: string;
    commentsChange: number;
    growthData: number[];
  };
  insights: Insight[];
  
  // Platform connections
  connectedPlatforms: string[];
  connectPlatform: (platform: string) => void;
}

export const [AIMarketerProvider, useAIMarketer] = createContextHook<AIMarketerContextType>(() => {
  const [coursePrompts, setCoursePrompts] = useState<string[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [settings, setSettings] = useState({
    focus: "Product",
    tone: "Informative",
    riskLevel: "Normal"
  });

  // Sync connected platforms with backend on app startup
  const oauthAccountsQuery = trpc.oauth.listAccounts.useQuery(undefined, {
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const loadSavedData = useCallback(async () => {
    try {
      const savedPrompts = await AsyncStorage.getItem("coursePrompts");
      const savedSettings = await AsyncStorage.getItem("settings");
      
      if (savedPrompts) setCoursePrompts(JSON.parse(savedPrompts));
      if (savedSettings) setSettings(JSON.parse(savedSettings));
      
      // Don't load connected platforms from AsyncStorage anymore - use backend as source of truth
      console.log('[AIMarketer] Loaded saved data from AsyncStorage');
    } catch (error) {
      console.error("[AIMarketer] Error loading saved data:", error);
    }
  }, []);

  // Sync connected platforms with backend data
  useEffect(() => {
    if (oauthAccountsQuery.data?.accounts) {
      const backendPlatforms = oauthAccountsQuery.data.accounts
        .filter(account => account.status === 'connected')
        .map(account => {
          // Map platform keys to display names
          const platformMap: Record<string, string> = {
            'x': 'X (Twitter)',
            'instagram': 'Instagram',
            'linkedin': 'LinkedIn',
            'telegram': 'Telegram',
            'facebook': 'Facebook',
            'tiktok': 'TikTok'
          };
          return platformMap[account.platform] || account.platform;
        });
      
      console.log('[AIMarketer] Syncing connected platforms from backend:', backendPlatforms);
      setConnectedPlatforms(backendPlatforms);
      
      // Update AsyncStorage cache
      AsyncStorage.setItem("connectedPlatforms", JSON.stringify(backendPlatforms));
    }
  }, [oauthAccountsQuery.data]);

  const addCoursePrompt = useCallback(async (prompt: string) => {
    setCoursePrompts(prev => {
      const updated = [...prev, prompt];
      AsyncStorage.setItem("coursePrompts", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeCoursePrompt = useCallback(async (index: number) => {
    setCoursePrompts(prev => {
      const updated = prev.filter((_, i) => i !== index);
      AsyncStorage.setItem("coursePrompts", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateSettings = useCallback(async (newSettings: { focus: string; tone: string; riskLevel: string }) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      AsyncStorage.setItem("settings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const connectPlatform = useCallback(async (platform: string) => {
    setConnectedPlatforms(prev => {
      if (!prev.includes(platform)) {
        const updated = [...prev, platform];
        AsyncStorage.setItem("connectedPlatforms", JSON.stringify(updated));
        console.log('[AIMarketer] Connected platform:', platform);
        
        // Refetch backend accounts to stay in sync
        oauthAccountsQuery.refetch();
        
        return updated;
      }
      return prev;
    });
  }, [oauthAccountsQuery]);

  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  // Mock data - moved outside useMemo to avoid recreating on every render
  const currentStatus = "Crafting LinkedIn thought leadership piece → 3 min remaining";
  
  const upcomingTasks = useMemo(() => [
    { title: "Autonomous marketing manifesto", status: "Scheduled", platform: "X", time: "12:30 PM" },
    { title: "Industry insights synthesis", status: "In Queue", platform: "LinkedIn", time: "2:00 PM" },
    { title: "Visual storytelling piece", status: "Processing", platform: "Instagram", time: "4:30 PM" },
  ], []);

  const todayPublished = useMemo(() => [
    { title: "Minimalist design philosophy", platform: "X", time: "9:00 AM", impressions: "1.2k", engagement: "4.5" },
    { title: "Autonomous creativity showcase", platform: "Instagram", time: "11:00 AM", impressions: "856", engagement: "6.2" },
    { title: "Future of social intelligence", platform: "LinkedIn", time: "1:00 PM", impressions: "432", engagement: "3.8" },
  ], []);

  const contentItems: ContentItem[] = useMemo(() => [
    { id: "1", title: "The Art of Autonomous Marketing", platform: "LinkedIn", status: "published", scheduledTime: "Today, 9:00 AM", preview: "Discover how Flâneur transforms social media strategy through intelligent automation..." },
    { id: "2", title: "Minimalist Content Strategy", platform: "X", status: "queued", scheduledTime: "Today, 2:00 PM", preview: "5 principles of elegant social media presence with Flâneur's autonomous approach..." },
    { id: "3", title: "Behind the Algorithm", platform: "Instagram", status: "queued", scheduledTime: "Today, 4:00 PM", preview: "An intimate look at Flâneur's sophisticated content creation process..." },
    { id: "4", title: "Weekly Insights", platform: "Telegram", status: "draft", scheduledTime: "Tomorrow, 10:00 AM", preview: "This week's curated insights on autonomous social media management..." },
    { id: "5", title: "Platform Evolution", platform: "LinkedIn", status: "held", scheduledTime: "Tomorrow, 12:00 PM", preview: "Announcing Flâneur's next-generation autonomous features..." },
  ], []);

  const metrics = useMemo(() => ({
    followers: "12.4k",
    followersChange: 12,
    impressions: "45.2k",
    impressionsChange: 24,
    engagement: "8.4%",
    engagementChange: -5,
    comments: "342",
    commentsChange: 18,
    growthData: [65, 72, 68, 85, 92, 78, 95],
  }), []);

  const insights: Insight[] = useMemo(() => [
    {
      type: "opportunity",
      title: "Optimal Engagement Window",
      description: "Your audience demonstrates peak activity between 11 AM - 1 PM. Flâneur recommends concentrating content distribution during this refined timeframe.",
      action: "Optimize Schedule"
    },
    {
      type: "anomaly",
      title: "X Platform Performance Shift",
      description: "X engagement metrics declined 40% this week. Evening content underperforming against historical benchmarks.",
      action: "Refine Strategy"
    },
    {
      type: "opportunity",
      title: "Trending Convergence",
      description: "#AutonomousMarketing aligns with your brand positioning. Flâneur can craft sophisticated content leveraging this momentum.",
      action: "Generate Content"
    },
  ], []);

  return useMemo(() => ({
    currentStatus,
    upcomingTasks,
    todayPublished,
    coursePrompts,
    addCoursePrompt,
    removeCoursePrompt,
    updateSettings,
    contentItems,
    metrics,
    insights,
    connectedPlatforms,
    connectPlatform,
  }), [
    coursePrompts,
    connectedPlatforms,
    addCoursePrompt,
    removeCoursePrompt,
    updateSettings,
    connectPlatform,
    upcomingTasks,
    todayPublished,
    contentItems,
    metrics,
    insights
  ]);
});