import { z } from "zod";
import { publicProcedure, protectedProcedure } from "../../create-context";
import banwords from "../../../config/banwords.json";

// AI Content Generation Types
interface GeneratedContent {
  platform: "x" | "instagram" | "telegram" | "linkedin";
  status: "draft" | "held";
  title: string;
  body: string;
  mediaPrompt?: string;
  mediaUrl?: string;
  scheduledAt?: string;
  heldReason?: string;
}

interface PersonaProfile {
  age: number;
  role: string;
  niche: string;
  goals: "para" | "tananirlik" | "topluluk";
  time_availability: "az" | "orta" | "yuksek";
}

interface ContentMix {
  video: number;
  image: number;
  text: number;
}

// Mock persona and settings (in real app, get from user profile)
const mockPersona: PersonaProfile = {
  age: 29,
  role: "ev hanımı",
  niche: "yemek",
  goals: "tananirlik",
  time_availability: "az"
};

const mockContentMix: ContentMix = {
  video: 30,
  image: 40,
  text: 30
};

// Platform-specific quotas and limits
const PLATFORM_QUOTAS = {
  x: { daily: 5, maxLength: 280 },
  instagram: { daily: 2, maxLength: 2200 },
  linkedin: { daily: 1, maxLength: 3000 },
  telegram: { daily: 10, maxLength: 4096 }
};

// AI Media quotas by plan
const AI_MEDIA_QUOTAS = {
  free: { daily: 0, monthly: 0 },
  premium: { daily: 5, monthly: 100 },
  platinum: { daily: -1, monthly: -1 } // unlimited
};

// Simple in-memory storage for media assets and usage tracking
const mediaAssets = new Map<string, any>();
const dailyMediaUsage = new Map<string, { date: string; count: number }>();



// Check if content contains banned words
function checkBanwords(content: string): { isViolation: boolean; word?: string; friendlyMessage?: string } {
  const lowerContent = content.toLowerCase();
  
  for (const word of banwords.banwords) {
    if (lowerContent.includes(word.toLowerCase())) {
      const friendlyMessage = banwords.friendlyMessages[word as keyof typeof banwords.friendlyMessages] 
        || banwords.friendlyMessages.default;
      
      return {
        isViolation: true,
        word,
        friendlyMessage
      };
    }
  }
  
  return { isViolation: false };
}

// Check AI media quota
function checkAIMediaQuota(userPlan: string, userId: string): { allowed: boolean; reason?: string } {
  const quota = AI_MEDIA_QUOTAS[userPlan as keyof typeof AI_MEDIA_QUOTAS];
  if (!quota) {
    return { allowed: false, reason: 'Geçersiz plan' };
  }

  // Unlimited for platinum
  if (quota.daily === -1) {
    return { allowed: true };
  }

  // Free plan has no AI media
  if (quota.daily === 0) {
    return { 
      allowed: false, 
      reason: 'AI görsel üretimi Premium planında! Yükselt veya manuel ekle.' 
    };
  }

  // Check daily usage
  const today = new Date().toISOString().split('T')[0];
  const usage = dailyMediaUsage.get(userId);
  
  if (usage && usage.date === today && usage.count >= quota.daily) {
    return { 
      allowed: false, 
      reason: `Günlük AI görsel kotası doldu (${quota.daily}). Premium ile sınırsız! 🎨` 
    };
  }

  return { allowed: true };
}

// Update media usage tracking
function updateMediaUsage(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const usage = dailyMediaUsage.get(userId);
  
  if (usage && usage.date === today) {
    usage.count += 1;
  } else {
    dailyMediaUsage.set(userId, { date: today, count: 1 });
  }
}

// Store media asset
function storeMediaAsset(userId: string, url: string, prompt: string, platform: string): string {
  const assetId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const hash = Buffer.from(`${prompt}:${platform}:${Date.now()}`).toString('base64').slice(0, 16);
  
  const asset = {
    id: assetId,
    userId,
    url,
    hash,
    platform,
    prompt,
    mimeType: 'image/png',
    createdAt: new Date().toISOString()
  };
  
  mediaAssets.set(assetId, asset);
  return assetId;
}

// Generate media for content item using direct API call
async function generateMediaForContent(
  mediaPrompt: string,
  platform: string,
  userId: string = 'mock_user',
  userPlan: string = 'platinum'
): Promise<{ mediaUrl?: string; assetId?: string; error?: string; quotaExceeded?: boolean }> {
  try {
    // Check quota first
    const quotaCheck = checkAIMediaQuota(userPlan, userId);
    if (!quotaCheck.allowed) {
      return { 
        error: quotaCheck.reason, 
        quotaExceeded: true 
      };
    }

    // Call the image generation API directly
    const response = await fetch('https://toolkit.rork.com/images/generate/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Create a ${platform === 'instagram' ? 'lifestyle/product visual' : 
                 platform === 'x' ? 'meme or quote visual' : 
                 platform === 'telegram' ? 'banner or announcement poster' : 
                 'corporate graphic or slide'} for ${platform} social media post. ${mediaPrompt}. Style: modern, clean, high-quality. Avoid text overlays unless specifically requested.`,
        size: platform === 'telegram' ? '1024x1792' : '1024x1024'
      })
    });

    if (!response.ok) {
      throw new Error(`Image API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.image?.base64Data) {
      // Convert base64 to data URL
      const mediaUrl = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
      
      // Store in media assets
      const assetId = storeMediaAsset(userId, mediaUrl, mediaPrompt, platform);
      
      // Update usage tracking
      updateMediaUsage(userId);
      
      return { mediaUrl, assetId };
    } else {
      return { error: 'No image data received' };
    }
  } catch (error) {
    console.error('[Publish] Media generation error:', error);
    return { error: error instanceof Error ? error.message : 'Media generation failed' };
  }
}

// Generate AI content using external API
async function generateAIContent(
  platforms: string[],
  count: number,
  persona: PersonaProfile,
  language: string,
  contentMix: ContentMix
): Promise<GeneratedContent[]> {
  const prompt = `
Context:
- Persona: ${persona.age} yaşında ${persona.role}, ${persona.niche} nişinde
- Hedef: ${persona.goals}
- Zaman: ${persona.time_availability}
- Dil: ${language}
- Platformlar: ${platforms.join(", ")}
- İçerik karışımı: %${contentMix.video} video, %${contentMix.image} görsel, %${contentMix.text} metin

Görev:
- Her platform için ${count} adet içerik üret
- X: {hook} + {değer} + {CTA} formatı, 220 karakter hedef, 1-2 hashtag
- Instagram: kısa caption + 3-5 hashtag
- LinkedIn: profesyonel ton + insight
- Telegram: duyuru/link odaklı
- Yasaklı kelimelerden kaçın: bedava, garanti, acele et, takip et, çekiliş
- Doğal ve değerli içerik üret

Çıktı JSON formatı:
[
  {
    "platform": "x|instagram|telegram|linkedin",
    "status": "draft|held",
    "title": "string",
    "body": "string",
    "mediaPrompt": "string|null",
    "mediaUrl": "string|null",
    "scheduledAt": "ISO|null",
    "heldReason": "string|null"
  }
]
`;

  try {
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'Sen sosyal medya içerik uzmanısın. Verilen persona ve platform özelliklerine göre doğal, değerli içerikler üretiyorsun. Yasaklı kelimelerden kaçınıyorsun ve her platform için uygun format kullanıyorsun.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let generatedContent: GeneratedContent[];
    
    try {
      // Check if response has completion field
      if (!data.completion) {
        console.error('No completion field in AI response:', data);
        throw new Error('Invalid AI response format');
      }
      
      // Try to parse JSON from completion
      const jsonMatch = data.completion.match(/\[.*\]/s);
      if (jsonMatch) {
        generatedContent = JSON.parse(jsonMatch[0]);
      } else {
        console.error('No JSON array found in AI response:', data.completion);
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', data);
      // Fallback to mock content
      generatedContent = generateMockContent(platforms, count);
    }

    // Validate and process each item
    return generatedContent.map(item => {
      // Check banwords
      const banwordCheck = checkBanwords(`${item.title} ${item.body}`);
      if (banwordCheck.isViolation) {
        return {
          ...item,
          status: "held" as const,
          heldReason: `Yasaklı kelime: "${banwordCheck.word}". ${banwordCheck.friendlyMessage}`
        };
      }

      // Check platform limits
      const quota = PLATFORM_QUOTAS[item.platform as keyof typeof PLATFORM_QUOTAS];
      if (quota && item.body.length > quota.maxLength) {
        return {
          ...item,
          status: "held" as const,
          heldReason: `İçerik çok uzun (${item.body.length}/${quota.maxLength} karakter). Kısalt ve tekrar dene.`
        };
      }

      return item;
    });

  } catch (error) {
    console.error('AI content generation failed:', error);
    // Fallback to mock content
    return generateMockContent(platforms, count);
  }
}

// Fallback mock content generator
function generateMockContent(platforms: string[], count: number): GeneratedContent[] {
  const mockTemplates = {
    x: [
      {
        title: "Yemek Fotoğrafçılığı İpuçları",
        body: "Evde çektiğiniz yemek fotoğrafları için 3 basit ipucu:\n\n1. Doğal ışık kullanın\n2. Açıyı değiştirin\n3. Renk kontrastı yaratın\n\n#yemekfotografi #evyemekleri"
      },
      {
        title: "Hızlı Kahvaltı Önerisi",
        body: "Sabah telaşında pratik kahvaltı: Yulaf + muz + bal + ceviz. 5 dakikada hazır, tok tutuyor! ☕\n\n#kahvalti #pratik"
      }
    ],
    instagram: [
      {
        title: "Renkli Salata Tabağı",
        body: "Gökkuşağı salatası 🌈 Her renk farklı vitamin demek!\n\n#sagliklibeslenme #salata #renkli #vitamin #evyemekleri #saglik",
        mediaPrompt: "Colorful rainbow salad with various vegetables arranged beautifully on a white plate"
      }
    ],
    linkedin: [
      {
        title: "Ev Ekonomisi ve Beslenme",
        body: "Ev ekonomisini yönetirken sağlıklı beslenmeyi ihmal etmemek mümkün. Haftalık menü planlaması ile hem bütçe hem sağlık kontrolde kalıyor.\n\nDeneyimlerinizi paylaşır mısınız?"
      }
    ],
    telegram: [
      {
        title: "Günlük Yemek Menüsü",
        body: "📅 Bugünün menüsü:\n\n🌅 Kahvaltı: Yulaf + meyve\n🌞 Öğle: Mercimek çorbası + salata\n🌙 Akşam: Fırında sebze + bulgur\n\nAfiyet olsun! 🍽️"
      }
    ]
  };

  const results: GeneratedContent[] = [];
  
  platforms.forEach(platform => {
    const templates = mockTemplates[platform as keyof typeof mockTemplates] || [];
    for (let i = 0; i < count && i < templates.length; i++) {
      const template = templates[i];
      results.push({
        platform: platform as any,
        status: "draft",
        title: template.title,
        body: template.body,
        mediaPrompt: (template as any).mediaPrompt || null,
        scheduledAt: undefined
      });
    }
  });

  return results;
}

// Generate idempotency key
function generateIdempotencyKey(platform: string, contentHash: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `${platform}:${contentHash}:${today}`;
}

// Check plan gates
function checkPlanGates(feature: string): { allowed: boolean; reason?: string } {
  const mockUserPlan = process.env.MOCK_USER_PLAN || "platinum";
  
  const planFeatures = {
    free: { automation: false, ai_generation: false },
    premium: { automation: false, ai_generation: true },
    platinum: { automation: true, ai_generation: true }
  };
  
  const userFeatures = planFeatures[mockUserPlan as keyof typeof planFeatures];
  
  if (feature === 'ai_generation' && !userFeatures?.ai_generation) {
    return {
      allowed: false,
      reason: 'AI içerik üretimi Premium planında! Yükselt veya manuel oluştur.'
    };
  }
  
  if (feature === 'automation' && !userFeatures?.automation) {
    return {
      allowed: false,
      reason: 'Otomatik yayınlama Platinum planında! Manuel yayınla veya yükselt.'
    };
  }
  
  return { allowed: true };
}

// Main generate procedure
export const publishGenerateProcedure = publicProcedure
  .input(z.object({
    count: z.number().min(1).max(5).default(3),
    platforms: z.array(z.enum(["x", "instagram", "telegram", "linkedin"])).min(1),
    personaOverride: z.object({
      age: z.number().optional(),
      role: z.string().optional(),
      niche: z.string().optional(),
      goals: z.enum(["para", "tananirlik", "topluluk"]).optional(),
      time_availability: z.enum(["az", "orta", "yuksek"]).optional()
    }).optional(),
    language: z.string().default("tr"),
    autoQueue: z.boolean().default(false)
  }))
  .mutation(async ({ input }) => {
    console.log('[Publish] Generating AI content:', input);
    
    // Check plan gates for AI generation
    const aiCheck = checkPlanGates('ai_generation');
    if (!aiCheck.allowed) {
      return {
        success: false,
        error: aiCheck.reason,
        upgradeRequired: true
      };
    }
    
    // Check automation if autoQueue is requested
    if (input.autoQueue) {
      const automationCheck = checkPlanGates('automation');
      if (!automationCheck.allowed) {
        return {
          success: false,
          error: automationCheck.reason,
          upgradeRequired: true
        };
      }
    }
    
    // Merge persona with override
    const persona = { ...mockPersona, ...input.personaOverride };
    
    try {
      // Generate content using AI
      const generatedContent = await generateAIContent(
        input.platforms,
        input.count,
        persona,
        input.language,
        mockContentMix
      );
      
      const results = [];
      
      // Process each generated item
      for (const item of generatedContent) {
        // Generate content hash for idempotency
        const contentHash = Buffer.from(`${item.title}${item.body}`).toString('base64').slice(0, 8);
        const idempotencyKey = generateIdempotencyKey(item.platform, contentHash);
        
        // Generate media if mediaPrompt exists and item is not held
        let mediaUrl: string | undefined;
        let mediaError: string | undefined;
        let mediaAssetId: string | undefined;
        
        if (item.mediaPrompt && item.status === 'draft') {
          console.log(`[Publish] Generating media for ${item.platform}: ${item.mediaPrompt}`);
          const mockUserPlan = process.env.MOCK_USER_PLAN || "platinum";
          const mediaResult = await generateMediaForContent(
            item.mediaPrompt, 
            item.platform, 
            'mock_user', 
            mockUserPlan
          );
          
          if (mediaResult.quotaExceeded) {
            // Mark item as held due to quota
            item.status = 'held';
            item.heldReason = mediaResult.error;
          } else {
            mediaUrl = mediaResult.mediaUrl;
            mediaError = mediaResult.error;
            mediaAssetId = mediaResult.assetId;
            
            if (mediaError) {
              console.warn(`[Publish] Media generation failed for ${item.platform}: ${mediaError}`);
            }
          }
        }
        
        // Create content item
        const contentItem = {
          id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: item.title,
          body: item.body,
          platform: item.platform,
          status: item.status,
          mediaPrompt: item.mediaPrompt,
          mediaUrl,
          mediaError,
          mediaAssetId,
          scheduledAt: item.scheduledAt,
          heldReason: item.heldReason,
          idempotencyKey,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          publishAttempts: 0,
          source: 'ai_generated'
        };
        
        results.push(contentItem);
        
        // Auto-queue if requested and not held
        if (input.autoQueue && item.status === 'draft') {
          // This would call content.queue in real implementation
          console.log(`[Publish] Auto-queuing item ${contentItem.id}`);
        }
      }
      
      return {
        success: true,
        message: `${results.length} içerik AI tarafından oluşturuldu`,
        items: results,
        stats: {
          generated: results.length,
          held: results.filter(r => r.status === 'held').length,
          queued: input.autoQueue ? results.filter(r => r.status === 'draft').length : 0
        }
      };
      
    } catch (error) {
      console.error('[Publish] AI generation error:', error);
      return {
        success: false,
        error: 'AI içerik üretiminde hata oluştu. Lütfen tekrar deneyin.',
        technicalError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

// Regenerate media for content item
export const publishRegenerateMediaProcedure = publicProcedure
  .input(z.object({
    itemId: z.string(),
    mediaPrompt: z.string().min(1).max(500),
    platform: z.enum(["x", "instagram", "telegram", "linkedin"])
  }))
  .mutation(async ({ input }) => {
    console.log(`[Publish] Regenerating media for ${input.itemId}:`, input.mediaPrompt);
    
    try {
      const mockUserPlan = process.env.MOCK_USER_PLAN || "platinum";
      const mediaResult = await generateMediaForContent(
        input.mediaPrompt, 
        input.platform, 
        'mock_user', 
        mockUserPlan
      );
      
      if (mediaResult.quotaExceeded) {
        return {
          success: false,
          error: mediaResult.error,
          quotaExceeded: true,
          itemId: input.itemId
        };
      }
      
      if (mediaResult.error) {
        return {
          success: false,
          error: mediaResult.error,
          itemId: input.itemId
        };
      }
      
      return {
        success: true,
        mediaUrl: mediaResult.mediaUrl,
        assetId: mediaResult.assetId,
        itemId: input.itemId,
        message: 'Medya başarıyla yeniden oluşturuldu'
      };
    } catch (error) {
      console.error('[Publish] Media regeneration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Medya yeniden oluşturulamadı',
        itemId: input.itemId
      };
    }
  });

// Batch queue procedure for generated content
export const publishBatchQueueProcedure = publicProcedure
  .input(z.object({
    itemIds: z.array(z.string()).min(1),
    scheduledAt: z.string().datetime().optional()
  }))
  .mutation(async ({ input }) => {
    console.log('[Publish] Batch queuing items:', input.itemIds);
    
    // Check automation plan gate
    const automationCheck = checkPlanGates('automation');
    if (!automationCheck.allowed && input.scheduledAt) {
      return {
        success: false,
        error: automationCheck.reason,
        upgradeRequired: true
      };
    }
    
    const results = [];
    
    for (const itemId of input.itemIds) {
      try {
        // This would call the existing content.queue procedure
        // For now, just simulate success
        results.push({
          itemId,
          success: true,
          status: 'queued',
          scheduledAt: input.scheduledAt || new Date().toISOString()
        });
      } catch (error) {
        results.push({
          itemId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return {
      success: successCount > 0,
      message: `${successCount}/${input.itemIds.length} içerik sıraya eklendi`,
      results,
      stats: {
        total: input.itemIds.length,
        success: successCount,
        failed: input.itemIds.length - successCount
      }
    };
  });

// Get media usage stats
export const publishGetMediaUsageProcedure = publicProcedure
  .query(() => {
    const mockUserPlan = process.env.MOCK_USER_PLAN || "platinum";
    const quota = AI_MEDIA_QUOTAS[mockUserPlan as keyof typeof AI_MEDIA_QUOTAS];
    const today = new Date().toISOString().split('T')[0];
    const usage = dailyMediaUsage.get('mock_user');
    const dailyUsed = (usage && usage.date === today) ? usage.count : 0;
    
    return {
      plan: mockUserPlan,
      quota: {
        daily: quota?.daily || 0,
        monthly: quota?.monthly || 0
      },
      usage: {
        daily: dailyUsed,
        remaining: quota?.daily === -1 ? -1 : Math.max(0, (quota?.daily || 0) - dailyUsed)
      },
      assets: {
        total: mediaAssets.size,
        today: Array.from(mediaAssets.values()).filter(
          asset => asset.createdAt.startsWith(today)
        ).length
      }
    };
  });

// Publishing Pipeline Procedures

// Publishing status types
type PublishStatus = 'draft' | 'queued' | 'published' | 'held' | 'error';
type Platform = 'x' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'telegram';

// Mock content database
const mockPublishContent: {
  id: string;
  title: string;
  content: string;
  platforms: Platform[];
  status: PublishStatus;
  scheduledAt?: string;
  publishedAt?: string;
  heldReason?: string;
  errorMessage?: string;
  links?: Partial<Record<Platform, string>>;
  createdAt: string;
  updatedAt: string;
}[] = [
  {
    id: 'content_1',
    title: 'Welcome Post',
    content: 'Welcome to our platform! 🚀 #launch #welcome',
    platforms: ['x', 'instagram'],
    status: 'published',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    links: {
      x: 'https://x.com/demo/status/123456789',
      instagram: 'https://instagram.com/p/ABC123DEF',
      facebook: '',
      linkedin: '',
      tiktok: '',
      telegram: ''
    },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'content_2',
    title: 'Product Update',
    content: 'New features are live! Check them out in the app. #update #features',
    platforms: ['x', 'linkedin'],
    status: 'held',
    heldReason: 'Contains banned word: "check"',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'content_3',
    title: 'Daily Tip',
    content: 'Pro tip: Use hashtags strategically for better reach! #tips #socialmedia',
    platforms: ['x', 'instagram', 'linkedin'],
    status: 'queued',
    scheduledAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
];

// Mock job queue
const mockPublishJobs: {
  id: string;
  contentId: string;
  platforms: Platform[];
  runAt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  error?: string;
  result?: any;
  createdAt: string;
  updatedAt: string;
}[] = [];

// Guardrails configuration
const PUBLISH_GUARDRAILS = {
  postingWindow: { start: 8, end: 22 }, // 8 AM to 10 PM
  dailyLimits: { x: 10, instagram: 5, facebook: 3, linkedin: 2, tiktok: 3, telegram: 20 },
  bannedWords: ['spam', 'fake', 'scam', 'check', 'click here', 'free money'],
  maxHashtags: { x: 2, instagram: 30, facebook: 5, linkedin: 3, tiktok: 5, telegram: 5 }
};

// Queue content for publishing
export const queueProcedure = protectedProcedure
  .input(z.object({
    contentId: z.string(),
    platforms: z.array(z.enum(['x', 'instagram', 'facebook', 'linkedin', 'tiktok', 'telegram'])),
    runAt: z.string().optional() // ISO string, defaults to now
  }))
  .mutation(async ({ input }) => {
    console.log('[Publish] Queuing content:', input);
    
    const isDryRun = process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1';
    const runAt = input.runAt ? new Date(input.runAt) : new Date();
    
    // Find content
    const content = mockPublishContent.find(c => c.id === input.contentId);
    if (!content) {
      throw new Error(`Content not found: ${input.contentId}`);
    }
    
    // Check posting window
    const hour = runAt.getHours();
    if (hour < PUBLISH_GUARDRAILS.postingWindow.start || hour > PUBLISH_GUARDRAILS.postingWindow.end) {
      content.status = 'held';
      content.heldReason = `Outside posting window (${PUBLISH_GUARDRAILS.postingWindow.start}:00-${PUBLISH_GUARDRAILS.postingWindow.end}:00)`;
      content.updatedAt = new Date().toISOString();
      
      return {
        success: false,
        message: 'Content held due to posting window restriction',
        contentId: input.contentId,
        status: 'held',
        heldReason: content.heldReason
      };
    }
    
    // Check banned words
    const bannedWord = PUBLISH_GUARDRAILS.bannedWords.find(word => 
      content.content.toLowerCase().includes(word.toLowerCase())
    );
    if (bannedWord) {
      content.status = 'held';
      content.heldReason = `Contains banned word: "${bannedWord}"`;
      content.updatedAt = new Date().toISOString();
      
      return {
        success: false,
        message: 'Content held due to banned word',
        contentId: input.contentId,
        status: 'held',
        heldReason: content.heldReason
      };
    }
    
    // Create job
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job = {
      id: jobId,
      contentId: input.contentId,
      platforms: input.platforms,
      runAt: runAt.toISOString(),
      status: 'pending' as const,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockPublishJobs.push(job);
    
    // Update content status
    content.status = 'queued';
    content.scheduledAt = runAt.toISOString();
    content.platforms = input.platforms;
    content.updatedAt = new Date().toISOString();
    
    console.log(`[Publish] ${isDryRun ? 'DRY_RUN' : 'LIVE'} - Job queued:`, jobId);
    
    return {
      success: true,
      message: `Content queued for publishing ${isDryRun ? '(DRY_RUN mode)' : ''}`,
      jobId,
      contentId: input.contentId,
      runAt: runAt.toISOString(),
      platforms: input.platforms,
      idempotencyKey: `${input.contentId}_${runAt.getTime()}`
    };
  });

// Execute publishing job
export const executeProcedure = protectedProcedure
  .input(z.object({
    jobId: z.string(),
    idempotencyKey: z.string().optional()
  }))
  .mutation(async ({ input }) => {
    console.log('[Publish] Executing job:', input.jobId);
    
    const isDryRun = process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1';
    
    // Find job
    const job = mockPublishJobs.find(j => j.id === input.jobId);
    if (!job) {
      throw new Error(`Job not found: ${input.jobId}`);
    }
    
    // Check idempotency
    if (job.status === 'completed') {
      console.log('[Publish] Job already completed (idempotent)');
      return {
        success: true,
        message: 'Job already completed',
        jobId: input.jobId,
        status: 'completed',
        idempotent: true
      };
    }
    
    // Find content
    const content = mockPublishContent.find(c => c.id === job.contentId);
    if (!content) {
      job.status = 'failed';
      job.error = 'Content not found';
      job.updatedAt = new Date().toISOString();
      throw new Error(`Content not found: ${job.contentId}`);
    }
    
    // Update job status
    job.status = 'running';
    job.attempts += 1;
    job.updatedAt = new Date().toISOString();
    
    try {
      // Simulate publishing to platforms
      const results: Partial<Record<Platform, { success: boolean; link?: string; error?: string }>> = {};
      
      for (const platform of job.platforms) {
        if (isDryRun) {
          // Simulate success in DRY_RUN mode
          results[platform] = {
            success: true,
            link: `https://${platform}.com/demo/post/${Date.now()}`
          };
        } else {
          // In LIVE mode, this would make actual API calls
          // For now, simulate with random success/failure
          const success = Math.random() > 0.2; // 80% success rate
          if (success) {
            results[platform] = {
              success: true,
              link: `https://${platform}.com/demo/post/${Date.now()}`
            };
          } else {
            results[platform] = {
              success: false,
              error: 'API rate limit exceeded'
            };
          }
        }
      }
      
      // Check if all platforms succeeded
      const allSucceeded = Object.values(results).every(r => r.success);
      
      if (allSucceeded) {
        // Success - update job and content
        job.status = 'completed';
        job.result = results;
        
        content.status = 'published';
        content.publishedAt = new Date().toISOString();
        content.links = Object.fromEntries(
          Object.entries(results)
            .filter(([_, result]) => result && result.success && result.link)
            .map(([platform, result]) => [platform, result!.link!])
        ) as Partial<Record<Platform, string>>;
        
        console.log(`[Publish] ${isDryRun ? 'DRY_RUN' : 'LIVE'} - Job completed successfully:`, input.jobId);
        
        return {
          success: true,
          message: `Content published successfully ${isDryRun ? '(DRY_RUN mode)' : ''}`,
          jobId: input.jobId,
          contentId: job.contentId,
          platforms: job.platforms,
          links: content.links,
          publishedAt: content.publishedAt
        };
      } else {
        // Partial failure - retry if attempts remaining
        const failedPlatforms = Object.entries(results)
          .filter(([_, result]) => !result.success)
          .map(([platform, result]) => `${platform}: ${result.error}`);
        
        if (job.attempts < job.maxAttempts) {
          job.status = 'pending'; // Will be retried
          content.status = 'queued';
          
          console.log(`[Publish] Job failed, will retry (${job.attempts}/${job.maxAttempts}):`, failedPlatforms);
          
          return {
            success: false,
            message: `Publishing failed, will retry (${job.attempts}/${job.maxAttempts})`,
            jobId: input.jobId,
            error: failedPlatforms.join(', '),
            willRetry: true
          };
        } else {
          // Max attempts reached
          job.status = 'failed';
          job.error = failedPlatforms.join(', ');
          
          content.status = 'error';
          content.errorMessage = `Publishing failed: ${job.error}`;
          
          console.log(`[Publish] Job failed permanently:`, failedPlatforms);
          
          return {
            success: false,
            message: 'Publishing failed permanently',
            jobId: input.jobId,
            error: job.error,
            willRetry: false
          };
        }
      }
    } catch (error) {
      // Unexpected error
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      
      content.status = 'error';
      content.errorMessage = job.error;
      
      console.error('[Publish] Job execution error:', error);
      throw error;
    } finally {
      job.updatedAt = new Date().toISOString();
      content.updatedAt = new Date().toISOString();
    }
  });

// Verify published content
export const verifyProcedure = protectedProcedure
  .input(z.object({
    postId: z.string(), // This could be contentId or actual platform post ID
    platform: z.enum(['x', 'instagram', 'facebook', 'linkedin', 'tiktok', 'telegram']).optional()
  }))
  .mutation(async ({ input }) => {
    console.log('[Publish] Verifying post:', input);
    
    const isDryRun = process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1';
    
    // Find content by ID or search in links
    let content = mockPublishContent.find(c => c.id === input.postId);
    if (!content) {
      // Try to find by platform link
      content = mockPublishContent.find(c => 
        c.links && Object.values(c.links).some(link => link && link.includes(input.postId))
      );
    }
    
    if (!content) {
      throw new Error(`Post not found: ${input.postId}`);
    }
    
    if (content.status !== 'published') {
      return {
        success: false,
        message: 'Post is not in published status',
        status: content.status,
        postId: input.postId
      };
    }
    
    // Simulate verification
    const verificationResults: Record<string, { exists: boolean; url?: string; metrics?: any }> = {};
    
    if (content.links) {
      for (const [platform, link] of Object.entries(content.links)) {
        if (!input.platform || platform === input.platform) {
          if (isDryRun) {
            // Simulate successful verification
            verificationResults[platform] = {
              exists: true,
              url: link,
              metrics: {
                views: Math.floor(Math.random() * 1000),
                likes: Math.floor(Math.random() * 100),
                shares: Math.floor(Math.random() * 20)
              }
            };
          } else {
            // In LIVE mode, this would make actual API calls to verify
            // For now, simulate with high success rate
            const exists = Math.random() > 0.1; // 90% success rate
            verificationResults[platform] = {
              exists,
              url: exists ? link : undefined,
              metrics: exists ? {
                views: Math.floor(Math.random() * 1000),
                likes: Math.floor(Math.random() * 100),
                shares: Math.floor(Math.random() * 20)
              } : undefined
            };
          }
        }
      }
    }
    
    console.log(`[Publish] ${isDryRun ? 'DRY_RUN' : 'LIVE'} - Verification completed:`, input.postId);
    
    return {
      success: true,
      message: `Post verification completed ${isDryRun ? '(DRY_RUN mode)' : ''}`,
      postId: input.postId,
      contentId: content.id,
      platforms: Object.keys(verificationResults),
      results: verificationResults,
      verifiedAt: new Date().toISOString()
    };
  });

// Get content logs for UI
export const logsProcedure = protectedProcedure
  .input(z.object({
    cursor: z.string().optional(),
    limit: z.number().min(1).max(100).default(20),
    status: z.enum(['draft', 'queued', 'published', 'held', 'error']).optional(),
    platform: z.enum(['x', 'instagram', 'facebook', 'linkedin', 'tiktok', 'telegram']).optional()
  }))
  .query(async ({ input }) => {
    console.log('[Publish] Getting content logs:', input);
    
    let filteredContent = [...mockPublishContent];
    
    // Apply filters
    if (input.status) {
      filteredContent = filteredContent.filter(c => c.status === input.status);
    }
    
    if (input.platform) {
      filteredContent = filteredContent.filter(c => c.platforms.includes(input.platform!));
    }
    
    // Sort by updatedAt desc
    filteredContent.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    // Apply cursor pagination
    let startIndex = 0;
    if (input.cursor) {
      const cursorIndex = filteredContent.findIndex(c => c.id === input.cursor);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }
    
    const paginatedContent = filteredContent.slice(startIndex, startIndex + input.limit);
    const hasMore = startIndex + input.limit < filteredContent.length;
    const nextCursor = hasMore ? paginatedContent[paginatedContent.length - 1]?.id : null;
    
    return {
      success: true,
      content: paginatedContent.map(c => ({
        id: c.id,
        title: c.title,
        content: c.content.substring(0, 100) + (c.content.length > 100 ? '...' : ''),
        platforms: c.platforms,
        status: c.status,
        scheduledAt: c.scheduledAt,
        publishedAt: c.publishedAt,
        heldReason: c.heldReason,
        errorMessage: c.errorMessage,
        links: c.links,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      })),
      pagination: {
        hasMore,
        nextCursor,
        total: filteredContent.length
      }
    };
  });

// Get publishing statistics
export const statsProcedure = protectedProcedure
  .input(z.object({
    range: z.enum(['24h', '7d', '30d']).default('7d')
  }))
  .query(async ({ input }) => {
    console.log('[Publish] Getting publishing stats:', input.range);
    
    const now = new Date();
    const rangeMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }[input.range];
    
    const cutoff = new Date(now.getTime() - rangeMs);
    
    // Filter content within range
    const recentContent = mockPublishContent.filter(c => 
      new Date(c.updatedAt) >= cutoff
    );
    
    // Calculate stats
    const stats = {
      total: recentContent.length,
      published: recentContent.filter(c => c.status === 'published').length,
      queued: recentContent.filter(c => c.status === 'queued').length,
      held: recentContent.filter(c => c.status === 'held').length,
      error: recentContent.filter(c => c.status === 'error').length,
      draft: recentContent.filter(c => c.status === 'draft').length
    };
    
    const successRate = stats.total > 0 ? (stats.published / stats.total) * 100 : 0;
    
    // Platform breakdown
    const platformStats: Record<Platform, number> = {
      x: 0,
      instagram: 0,
      facebook: 0,
      linkedin: 0,
      tiktok: 0,
      telegram: 0
    };
    
    recentContent.forEach(c => {
      if (c.status === 'published') {
        c.platforms.forEach(platform => {
          platformStats[platform]++;
        });
      }
    });
    
    return {
      success: true,
      range: input.range,
      stats,
      successRate: Math.round(successRate * 10) / 10,
      platformStats,
      generatedAt: new Date().toISOString()
    };
  });

// Upload manual media (for user uploads)
export const publishUploadMediaProcedure = publicProcedure
  .input(z.object({
    itemId: z.string(),
    mediaUrl: z.string().url(),
    mimeType: z.string().default('image/jpeg')
  }))
  .mutation(async ({ input }) => {
    console.log(`[Publish] Manual media upload for ${input.itemId}`);
    
    try {
      // Store the uploaded media asset
      const assetId = storeMediaAsset(
        'mock_user', 
        input.mediaUrl, 
        'user_uploaded', 
        'manual'
      );
      
      return {
        success: true,
        mediaUrl: input.mediaUrl,
        assetId,
        itemId: input.itemId,
        message: 'Medya başarıyla yüklendi'
      };
    } catch (error) {
      console.error('[Publish] Media upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Medya yüklenemedi',
        itemId: input.itemId
      };
    }
  });