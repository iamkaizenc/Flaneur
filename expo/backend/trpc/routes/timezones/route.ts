import { z } from "zod";
import { publicProcedure } from "../../create-context";

// Timezone utilities
const convertToUTC = (localTime: string, timezone: string): Date => {
  // In production, use a proper timezone library like date-fns-tz
  const date = new Date(localTime);
  // Simple offset calculation (in production, handle DST properly)
  const timezoneOffsets: Record<string, number> = {
    'America/New_York': -5,
    'America/Los_Angeles': -8,
    'Europe/London': 0,
    'Europe/Paris': 1,
    'Asia/Tokyo': 9,
    'Australia/Sydney': 11
  };
  
  const offset = timezoneOffsets[timezone] || 0;
  return new Date(date.getTime() - (offset * 60 * 60 * 1000));
};

const convertFromUTC = (utcTime: Date, timezone: string): string => {
  const timezoneOffsets: Record<string, number> = {
    'America/New_York': -5,
    'America/Los_Angeles': -8, 
    'Europe/London': 0,
    'Europe/Paris': 1,
    'Asia/Tokyo': 9,
    'Australia/Sydney': 11
  };
  
  const offset = timezoneOffsets[timezone] || 0;
  const localTime = new Date(utcTime.getTime() + (offset * 60 * 60 * 1000));
  return localTime.toISOString();
};

// Get user's posting window in their local timezone
export const getPostingWindowProcedure = publicProcedure
  .input(z.object({
    timezone: z.string().default('UTC')
  }))
  .query(async ({ input }) => {
    // Default posting window: 8 AM - 10 PM local time
    const startHour = parseInt(process.env.PUBLISH_START_HOUR || '8');
    const endHour = parseInt(process.env.PUBLISH_END_HOUR || '22');
    
    const now = new Date();
    const currentHour = new Date(convertFromUTC(now, input.timezone)).getHours();
    
    // Check if currently within posting window
    const isWithinWindow = currentHour >= startHour && currentHour <= endHour;
    
    // Calculate next window start/end in UTC
    const today = new Date();
    today.setHours(startHour, 0, 0, 0);
    const windowStart = convertToUTC(today.toISOString(), input.timezone);
    
    today.setHours(endHour, 0, 0, 0);
    const windowEnd = convertToUTC(today.toISOString(), input.timezone);
    
    // If past today's window, calculate tomorrow's window
    let nextWindowStart = windowStart;
    if (now > windowEnd) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(startHour, 0, 0, 0);
      nextWindowStart = convertToUTC(tomorrow.toISOString(), input.timezone);
    }
    
    return {
      timezone: input.timezone,
      localTime: convertFromUTC(now, input.timezone),
      postingWindow: {
        startHour,
        endHour,
        startUTC: windowStart.toISOString(),
        endUTC: windowEnd.toISOString(),
        isWithinWindow,
        nextWindowStart: nextWindowStart.toISOString()
      },
      currentHour
    };
  });

// Update user's posting window preferences
export const updatePostingWindowProcedure = publicProcedure
  .input(z.object({
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(0).max(23),
    timezone: z.string()
  }))
  .mutation(async ({ input }) => {
    if (input.startHour >= input.endHour) {
      throw new Error("Start hour must be before end hour");
    }
    
    console.log(`[Timezone] Updated posting window: ${input.startHour}:00-${input.endHour}:00 ${input.timezone}`);
    
    // In production, save to user settings in database
    // For now, just validate and return the converted UTC times
    
    const today = new Date();
    today.setHours(input.startHour, 0, 0, 0);
    const startUTC = convertToUTC(today.toISOString(), input.timezone);
    
    today.setHours(input.endHour, 0, 0, 0);
    const endUTC = convertToUTC(today.toISOString(), input.timezone);
    
    return {
      success: true,
      message: "Posting window updated successfully",
      settings: {
        localWindow: {
          start: `${input.startHour.toString().padStart(2, '0')}:00`,
          end: `${input.endHour.toString().padStart(2, '0')}:00`,
          timezone: input.timezone
        },
        utcWindow: {
          start: startUTC.toISOString(),
          end: endUTC.toISOString()
        }
      }
    };
  });

// Check if a specific time is within posting window
export const isWithinPostingWindowProcedure = publicProcedure
  .input(z.object({
    scheduledAt: z.string().datetime(),
    timezone: z.string().default('UTC')
  }))
  .query(async ({ input }) => {
    const scheduledTime = new Date(input.scheduledAt);
    const localScheduledTime = convertFromUTC(scheduledTime, input.timezone);
    const scheduledHour = new Date(localScheduledTime).getHours();
    
    const startHour = parseInt(process.env.PUBLISH_START_HOUR || '8');
    const endHour = parseInt(process.env.PUBLISH_END_HOUR || '22');
    
    const isWithinWindow = scheduledHour >= startHour && scheduledHour <= endHour;
    
    return {
      isWithinWindow,
      scheduledAt: input.scheduledAt,
      localScheduledTime,
      scheduledHour,
      postingWindow: {
        start: startHour,
        end: endHour
      },
      timezone: input.timezone
    };
  });

// Get optimal posting times based on historical performance
export const getOptimalPostingTimesProcedure = publicProcedure
  .input(z.object({
    platform: z.string(),
    timezone: z.string().default('UTC')
  }))
  .query(async ({ input }) => {
    // Mock optimal times based on platform
    const optimalTimes: Record<string, number[]> = {
      'x': [9, 12, 15, 18], // 9 AM, 12 PM, 3 PM, 6 PM
      'linkedin': [8, 12, 17], // 8 AM, 12 PM, 5 PM
      'instagram': [11, 14, 19], // 11 AM, 2 PM, 7 PM
      'facebook': [9, 13, 15], // 9 AM, 1 PM, 3 PM
      'tiktok': [16, 19, 21], // 4 PM, 7 PM, 9 PM
      'telegram': [10, 14, 20] // 10 AM, 2 PM, 8 PM
    };
    
    const platformTimes = optimalTimes[input.platform] || [9, 12, 18];
    
    // Convert to user's timezone
    const today = new Date();
    const suggestions = platformTimes.map(hour => {
      const localTime = new Date(today);
      localTime.setHours(hour, 0, 0, 0);
      const utcTime = convertToUTC(localTime.toISOString(), input.timezone);
      
      return {
        localHour: hour,
        localTime: `${hour.toString().padStart(2, '0')}:00`,
        utcTime: utcTime.toISOString(),
        engagementScore: 0.7 + Math.random() * 0.3 // Mock engagement score
      };
    });
    
    return {
      platform: input.platform,
      timezone: input.timezone,
      optimalTimes: suggestions.sort((a, b) => b.engagementScore - a.engagementScore),
      recommendation: `Best posting times for ${input.platform} in ${input.timezone}`
    };
  });

// Batch convert multiple times between timezones
export const batchConvertTimezoneProcedure = publicProcedure
  .input(z.object({
    times: z.array(z.string().datetime()),
    fromTimezone: z.string(),
    toTimezone: z.string()
  }))
  .mutation(async ({ input }) => {
    const conversions = input.times.map(time => {
      // Convert from source timezone to UTC, then to target timezone
      const utcTime = convertToUTC(time, input.fromTimezone);
      const targetTime = convertFromUTC(utcTime, input.toTimezone);
      
      return {
        original: time,
        converted: targetTime,
        utc: utcTime.toISOString()
      };
    });
    
    return {
      fromTimezone: input.fromTimezone,
      toTimezone: input.toTimezone,
      conversions,
      count: conversions.length
    };
  });