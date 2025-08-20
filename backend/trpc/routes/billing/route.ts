import { z } from "zod";
import { publicProcedure, protectedProcedure } from "../../create-context";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_demo_key', {
  apiVersion: '2025-07-30.basil'
});

// Plan configuration
const PLANS = {
  free: {
    name: 'Free',
    description: 'Basic features for getting started',
    price: 0,
    features: {
      analytics: false,
      automation: false,
      maxAccounts: 1,
      dailyPosts: 5,
      aiAgent: false,
      prioritySupport: false
    }
  },
  premium: {
    name: 'Premium',
    description: 'Advanced features for growing creators',
    price: 29,
    priceYearly: 290,
    stripeMonthlyPriceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
    stripeYearlyPriceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly',
    features: {
      analytics: true,
      automation: true,
      maxAccounts: 3,
      dailyPosts: 25,
      aiAgent: true,
      prioritySupport: false
    }
  },
  platinum: {
    name: 'Platinum',
    description: 'Everything you need for professional growth',
    price: 99,
    priceYearly: 990,
    stripeMonthlyPriceId: process.env.STRIPE_PLATINUM_MONTHLY_PRICE_ID || 'price_platinum_monthly',
    stripeYearlyPriceId: process.env.STRIPE_PLATINUM_YEARLY_PRICE_ID || 'price_platinum_yearly',
    features: {
      analytics: true,
      automation: true,
      maxAccounts: 10,
      dailyPosts: 100,
      aiAgent: true,
      prioritySupport: true
    }
  }
} as const;

type PlanType = keyof typeof PLANS;
type BillingPeriod = 'm' | 'y';

// Mock database for plan state (in production, use real database)
const mockPlanState = {
  plan: 'free' as PlanType,
  period: 'm' as BillingPeriod,
  status: 'active' as 'active' | 'canceled' | 'past_due',
  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  stripeCustomerId: null as string | null,
  stripeSubscriptionId: null as string | null
};

// Create Stripe checkout session
export const createCheckoutProcedure = protectedProcedure
  .input(z.object({
    plan: z.enum(['premium', 'platinum']),
    period: z.enum(['m', 'y']),
    successUrl: z.string().optional(),
    cancelUrl: z.string().optional()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[Billing] Creating checkout session:', input);
    
    const isDryRun = process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1';
    const isLiveMode = process.env.LIVE_MODE === 'true';
    
    if (isDryRun || !isLiveMode) {
      console.log('[Billing] DRY_RUN mode - returning mock checkout URL');
      return {
        success: true,
        checkoutUrl: `https://checkout.stripe.com/pay/mock_${input.plan}_${input.period}`,
        sessionId: `cs_mock_${Date.now()}`,
        mode: 'DRY_RUN'
      };
    }
    
    try {
      const planConfig = PLANS[input.plan];
      const priceId = input.period === 'y' ? planConfig.stripeYearlyPriceId : planConfig.stripeMonthlyPriceId;
      
      if (!priceId) {
        throw new Error(`Price ID not configured for ${input.plan} ${input.period}`);
      }
      
      // Create or get customer
      let customerId = mockPlanState.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: 'demo@flaneur.app',
          metadata: {
            userId: 'demo-user',
            plan: input.plan,
            period: input.period
          }
        });
        customerId = customer.id;
        mockPlanState.stripeCustomerId = customerId;
      }
      
      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: input.successUrl || `${process.env.BASE_URL}/settings?checkout=success`,
        cancel_url: input.cancelUrl || `${process.env.BASE_URL}/settings?checkout=canceled`,
        metadata: {
          userId: 'demo-user',
          plan: input.plan,
          period: input.period
        }
      });
      
      console.log('[Billing] Stripe checkout session created:', session.id);
      
      return {
        success: true,
        checkoutUrl: session.url!,
        sessionId: session.id,
        mode: 'LIVE'
      };
    } catch (error) {
      console.error('[Billing] Stripe checkout error:', error);
      throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

// Get Stripe customer portal URL
export const getPortalProcedure = protectedProcedure
  .input(z.object({
    returnUrl: z.string().optional()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[Billing] Getting customer portal URL');
    
    const isDryRun = process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1';
    const isLiveMode = process.env.LIVE_MODE === 'true';
    
    if (isDryRun || !isLiveMode) {
      console.log('[Billing] DRY_RUN mode - returning mock portal URL');
      return {
        success: true,
        portalUrl: 'https://billing.stripe.com/p/session/mock_portal',
        mode: 'DRY_RUN'
      };
    }
    
    try {
      const customerId = mockPlanState.stripeCustomerId;
      if (!customerId) {
        throw new Error('No Stripe customer found. Please subscribe to a plan first.');
      }
      
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: input.returnUrl || `${process.env.BASE_URL}/settings`,
      });
      
      console.log('[Billing] Customer portal session created');
      
      return {
        success: true,
        portalUrl: session.url,
        mode: 'LIVE'
      };
    } catch (error) {
      console.error('[Billing] Customer portal error:', error);
      throw new Error(`Failed to create portal session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

// Get current plan and billing info
export const getCurrentPlanProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    console.log('[Billing] Getting current plan');
    
    const currentPlan = PLANS[mockPlanState.plan];
    
    return {
      success: true,
      plan: mockPlanState.plan,
      name: currentPlan.name,
      description: currentPlan.description,
      price: currentPlan.price,
      features: currentPlan.features,
      billingCycle: mockPlanState.period === 'y' ? 'yearly' : 'monthly',
      status: mockPlanState.status,
      current_period_end: mockPlanState.current_period_end,
      cancelAtPeriodEnd: false,
      stripeCustomerId: mockPlanState.stripeCustomerId,
      stripeSubscriptionId: mockPlanState.stripeSubscriptionId
    };
  });

// List all available plans
export const listPlansProcedure = publicProcedure
  .query(async () => {
    console.log('[Billing] Listing all plans');
    
    return {
      success: true,
      plans: Object.entries(PLANS).map(([key, plan]) => ({
        id: key,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        priceYearly: 'priceYearly' in plan ? plan.priceYearly : undefined,
        features: plan.features,
        popular: key === 'premium'
      }))
    };
  });

// Handle Stripe webhook
export const webhookProcedure = publicProcedure
  .input(z.object({
    signature: z.string(),
    payload: z.string()
  }))
  .mutation(async ({ input }) => {
    console.log('[Billing] Processing webhook');
    
    const isDryRun = process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1';
    const isLiveMode = process.env.LIVE_MODE === 'true';
    
    if (isDryRun || !isLiveMode) {
      console.log('[Billing] DRY_RUN mode - webhook processing skipped');
      return { success: true, processed: false, mode: 'DRY_RUN' };
    }
    
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }
      
      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        input.payload,
        input.signature,
        webhookSecret
      );
      
      console.log('[Billing] Webhook event type:', event.type);
      
      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log('[Billing] Checkout completed:', session.id);
          
          // Update plan state
          const metadata = session.metadata;
          if (metadata?.plan && metadata?.period) {
            mockPlanState.plan = metadata.plan as PlanType;
            mockPlanState.period = metadata.period as BillingPeriod;
            mockPlanState.status = 'active';
            mockPlanState.stripeCustomerId = session.customer as string;
            mockPlanState.stripeSubscriptionId = session.subscription as string;
            
            console.log('[Billing] Plan updated:', mockPlanState);
          }
          break;
        }
        
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log('[Billing] Subscription updated:', subscription.id);
          
          mockPlanState.status = subscription.status === 'active' ? 'active' : 'canceled';
          // Handle current_period_end properly
          const subscriptionData = subscription as any;
          if (subscriptionData.current_period_end) {
            mockPlanState.current_period_end = new Date(subscriptionData.current_period_end * 1000).toISOString();
          }
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log('[Billing] Subscription canceled:', subscription.id);
          
          // Downgrade to free plan
          mockPlanState.plan = 'free';
          mockPlanState.status = 'canceled';
          mockPlanState.stripeSubscriptionId = null;
          break;
        }
        
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          console.log('[Billing] Payment failed:', invoice.id);
          
          mockPlanState.status = 'past_due';
          break;
        }
        
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          console.log('[Billing] Payment succeeded:', invoice.id);
          
          mockPlanState.status = 'active';
          break;
        }
        
        default:
          console.log('[Billing] Unhandled webhook event:', event.type);
      }
      
      return {
        success: true,
        processed: true,
        eventType: event.type,
        mode: 'LIVE'
      };
    } catch (error) {
      console.error('[Billing] Webhook processing error:', error);
      
      // Log to DLQ (Dead Letter Queue) in production
      console.error('[Billing] DLQ: Failed webhook', {
        signature: input.signature.substring(0, 20) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      throw new Error(`Webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

// Check if user has access to a feature based on their plan
export const checkFeatureAccessProcedure = protectedProcedure
  .input(z.object({
    feature: z.enum(['analytics', 'automation', 'aiAgent', 'prioritySupport'])
  }))
  .query(async ({ input }) => {
    console.log('[Billing] Checking feature access:', input.feature);
    
    const currentPlan = PLANS[mockPlanState.plan];
    const hasAccess = currentPlan.features[input.feature];
    
    return {
      success: true,
      hasAccess,
      plan: mockPlanState.plan,
      feature: input.feature,
      requiresUpgrade: !hasAccess && mockPlanState.plan === 'free'
    };
  });

// Get billing usage stats
export const getUsageStatsProcedure = protectedProcedure
  .query(async () => {
    console.log('[Billing] Getting usage stats');
    
    const currentPlan = PLANS[mockPlanState.plan];
    
    // Mock usage data
    const usage = {
      accounts: {
        used: 2,
        limit: currentPlan.features.maxAccounts,
        percentage: Math.round((2 / currentPlan.features.maxAccounts) * 100)
      },
      dailyPosts: {
        used: 8,
        limit: currentPlan.features.dailyPosts,
        percentage: Math.round((8 / currentPlan.features.dailyPosts) * 100)
      },
      resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    return {
      success: true,
      usage,
      plan: mockPlanState.plan,
      billingPeriod: mockPlanState.period
    };
  });