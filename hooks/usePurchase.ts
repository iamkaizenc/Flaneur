import { useState } from "react";
import { Platform } from "react-native";

interface PurchaseResult {
  success: boolean;
  message?: string;
  transactionId?: string;
}

interface PurchaseHook {
  purchasePlan: (plan: "premium" | "platinum") => Promise<PurchaseResult>;
  restorePurchases: () => Promise<PurchaseResult>;
  isLoading: boolean;
}

// Mock purchase products for DRY_RUN mode
const MOCK_PRODUCTS = {
  premium: {
    productId: "flaneur_premium_monthly",
    price: "$9.99",
    title: "Flâneur Premium",
    description: "Growth tracking + analytics",
  },
  platinum: {
    productId: "flaneur_platinum_monthly",
    price: "$19.99",
    title: "Flâneur Platinum",
    description: "Analytics + automation + unlimited",
  },
};

export const usePurchase = (): PurchaseHook => {
  const [isLoading, setIsLoading] = useState(false);

  const purchasePlan = async (plan: "premium" | "platinum"): Promise<PurchaseResult> => {
    setIsLoading(true);
    
    try {
      // Check if we're in DRY_RUN mode (default for development)
      const isDryRun = process.env.NODE_ENV === "development" || process.env.DRY_RUN === "true";
      
      if (isDryRun) {
        // Simulate purchase flow in DRY_RUN mode
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
        
        const product = MOCK_PRODUCTS[plan];
        console.log(`[DRY_RUN] Simulating purchase of ${product.title} (${product.price})`);
        
        return {
          success: true,
          message: `Successfully purchased ${product.title} (DRY_RUN mode)`,
          transactionId: `mock_txn_${Date.now()}`,
        };
      }
      
      // In LIVE mode, we would integrate with expo-in-app-purchases or RevenueCat
      if (Platform.OS === "ios") {
        // iOS App Store integration
        return await handleIOSPurchase(plan);
      } else if (Platform.OS === "android") {
        // Google Play Store integration
        return await handleAndroidPurchase(plan);
      } else {
        // Web fallback - redirect to payment provider
        return await handleWebPurchase(plan);
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      return {
        success: false,
        message: "Purchase failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async (): Promise<PurchaseResult> => {
    setIsLoading(true);
    
    try {
      const isDryRun = process.env.NODE_ENV === "development" || process.env.DRY_RUN === "true";
      
      if (isDryRun) {
        // Simulate restore in DRY_RUN mode
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log("[DRY_RUN] Simulating purchase restoration");
        
        // Randomly simulate having or not having previous purchases
        const hasPreviousPurchases = Math.random() > 0.5;
        
        if (hasPreviousPurchases) {
          return {
            success: true,
            message: "Previous purchases restored successfully (DRY_RUN mode)",
          };
        } else {
          return {
            success: false,
            message: "No previous purchases found to restore",
          };
        }
      }
      
      // In LIVE mode, restore purchases from the respective store
      if (Platform.OS === "ios") {
        return await handleIOSRestore();
      } else if (Platform.OS === "android") {
        return await handleAndroidRestore();
      } else {
        return {
          success: false,
          message: "Purchase restoration not available on web",
        };
      }
    } catch (error) {
      console.error("Restore failed:", error);
      return {
        success: false,
        message: "Failed to restore purchases. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    purchasePlan,
    restorePurchases,
    isLoading,
  };
};

// iOS App Store purchase handler (stub for future implementation)
const handleIOSPurchase = async (plan: "premium" | "platinum"): Promise<PurchaseResult> => {
  // TODO: Implement with expo-in-app-purchases or RevenueCat
  // Example:
  // import * as InAppPurchases from 'expo-in-app-purchases';
  // 
  // await InAppPurchases.connectAsync();
  // const products = await InAppPurchases.getProductsAsync([MOCK_PRODUCTS[plan].productId]);
  // const purchaseResult = await InAppPurchases.purchaseItemAsync(MOCK_PRODUCTS[plan].productId);
  // 
  // return {
  //   success: purchaseResult.responseCode === InAppPurchases.IAPResponseCode.OK,
  //   message: purchaseResult.responseCode === InAppPurchases.IAPResponseCode.OK ? "Purchase successful" : "Purchase failed",
  //   transactionId: purchaseResult.results?.[0]?.transactionId,
  // };
  
  return {
    success: false,
    message: "iOS purchases not yet implemented. Please use DRY_RUN mode for testing.",
  };
};

// Android Google Play purchase handler (stub for future implementation)
const handleAndroidPurchase = async (plan: "premium" | "platinum"): Promise<PurchaseResult> => {
  // TODO: Implement with expo-in-app-purchases or RevenueCat
  return {
    success: false,
    message: "Android purchases not yet implemented. Please use DRY_RUN mode for testing.",
  };
};

// Web purchase handler (stub for future implementation)
const handleWebPurchase = async (plan: "premium" | "platinum"): Promise<PurchaseResult> => {
  // TODO: Implement with Stripe, PayPal, or other web payment provider
  return {
    success: false,
    message: "Web purchases not yet implemented. Please use DRY_RUN mode for testing.",
  };
};

// iOS restore handler (stub for future implementation)
const handleIOSRestore = async (): Promise<PurchaseResult> => {
  // TODO: Implement with expo-in-app-purchases or RevenueCat
  return {
    success: false,
    message: "iOS restore not yet implemented. Please use DRY_RUN mode for testing.",
  };
};

// Android restore handler (stub for future implementation)
const handleAndroidRestore = async (): Promise<PurchaseResult> => {
  // TODO: Implement with expo-in-app-purchases or RevenueCat
  return {
    success: false,
    message: "Android restore not yet implemented. Please use DRY_RUN mode for testing.",
  };
};