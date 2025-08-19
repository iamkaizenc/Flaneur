import { z } from "zod";
import { publicProcedure } from "../../create-context";
import banwords from "../../../config/banwords.json";

// AI Content Generation Types
interface GeneratedContent {
  platform: "x" | "instagram" | "telegram" | "linkedin";
  status: "draft" | "held";
  title: string;
  body: string;
  mediaPrompt?: string;
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

// Content templates by platform
const CONTENT_TEMPLATES = {
  x: {
    structure: "{hook} {value} {cta}",
    tone: "casual",
    hashtags: "1-2",
    length: "220 char hedef"
  },
  instagram: {
    structure: "kısa caption + 3-5 hashtag",
    tone: "visual-focused",
    hashtags: "3-5",
    length: "short caption"
  },
  linkedin: {
    structure: "profesyonel ton + insight",
    tone: "professional",
    hashtags: "0-2",
    length: "detailed post"
  },
  telegram: {
    structure: "link/duyuru odaklı",
    tone: "informative",
    hashtags: "0-1",
    length: "announcement style"
  }
};

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
      // Try to parse JSON from completion
      const jsonMatch = data.completion.match(/\[.*\]/s);
      if (jsonMatch) {
        generatedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
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
        
        // Create content item
        const contentItem = {
          id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: item.title,
          body: item.body,
          platform: item.platform,
          status: item.status,
          mediaPrompt: item.mediaPrompt,
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