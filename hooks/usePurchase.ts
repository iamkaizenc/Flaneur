import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';

interface PurchaseResult {
  success: boolean;
  message?: string;
  transactionId?: string;
  receipt?: string;
}

interface UsePurchaseReturn {
  purchasePlan: (planId: 'premium' | 'platinum') => Promise<PurchaseResult>;
  restorePurchases: () => Promise<PurchaseResult>;
  isLoading: boolean;
}

// Mock product IDs for different plans
const PRODUCT_IDS = {
  premium: 'com.flaneur.premium.monthly',
  platinum: 'com.flaneur.platinum.monthly'
};

export const usePurchase = (): UsePurchaseReturn => {
  const [isLoading, setIsLoading] = useState(false);

  const purchasePlan = useCallback(async (planId: 'premium' | 'platinum'): Promise<PurchaseResult> => {
    console.log(`[Purchase] Initiating purchase for plan: ${planId}`);
    setIsLoading(true);

    try {
      const isDryRun = process.env.DRY_RUN === 'true' || __DEV__;
      
      if (isDryRun) {
        console.log(`[Purchase] DRY_RUN mode - simulating purchase for ${planId}`);
        
        // Simulate purchase delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate success/failure (90% success rate)
        const success = Math.random() > 0.1;
        
        if (success) {
          const mockReceipt = {
            transactionId: `mock_txn_${Date.now()}`,
            productId: PRODUCT_IDS[planId],
            purchaseTime: new Date().toISOString(),
            purchaseState: 'purchased',
            receipt: `mock_receipt_${planId}_${Date.now()}`
          };
          
          console.log(`[Purchase] DRY_RUN success:`, mockReceipt);
          
          return {
            success: true,
            message: `Successfully purchased ${planId} plan (DRY_RUN mode)`,
            transactionId: mockReceipt.transactionId,
            receipt: mockReceipt.receipt
          };
        } else {
          console.log(`[Purchase] DRY_RUN failure - simulated error`);
          return {
            success: false,
            message: 'Purchase failed (DRY_RUN simulation)'
          };
        }
      }

      // In LIVE mode, this would use expo-in-app-purchases or react-native-iap
      if (Platform.OS === 'ios') {
        // iOS App Store purchase flow
        console.log(`[Purchase] iOS purchase flow for ${planId}`);
        
        // Example with expo-in-app-purchases:
        // const { responseCode, results } = await InAppPurchases.purchaseItemAsync(PRODUCT_IDS[planId]);
        // if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        //   return {
        //     success: true,
        //     transactionId: results[0].transactionId,
        //     receipt: results[0].receipt
        //   };
        // }
        
        throw new Error('iOS IAP not implemented - set DRY_RUN=true for demo mode');
      } else if (Platform.OS === 'android') {
        // Google Play purchase flow
        console.log(`[Purchase] Android purchase flow for ${planId}`);
        
        // Example with react-native-iap:
        // const purchase = await RNIap.requestPurchase(PRODUCT_IDS[planId]);
        // return {
        //   success: true,
        //   transactionId: purchase.transactionId,
        //   receipt: purchase.transactionReceipt
        // };
        
        throw new Error('Android IAP not implemented - set DRY_RUN=true for demo mode');
      } else {
        // Web fallback - redirect to payment provider
        console.log(`[Purchase] Web purchase flow for ${planId}`);
        
        Alert.alert(
          'Purchase',
          'Web purchases are not supported in this demo. Please use the mobile app.',
          [{ text: 'OK' }]
        );
        
        return {
          success: false,
          message: 'Web purchases not supported'
        };
      }
    } catch (error) {
      console.error('[Purchase] Purchase failed:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Purchase failed'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restorePurchases = useCallback(async (): Promise<PurchaseResult> => {
    console.log('[Purchase] Restoring purchases');
    setIsLoading(true);

    try {
      const isDryRun = process.env.DRY_RUN === 'true' || __DEV__;
      
      if (isDryRun) {
        console.log('[Purchase] DRY_RUN mode - simulating restore purchases');
        
        // Simulate restore delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulate finding previous purchases (70% chance)
        const hasPreviousPurchases = Math.random() > 0.3;
        
        if (hasPreviousPurchases) {
          const mockRestoredPurchases = [
            {
              productId: PRODUCT_IDS.premium,
              transactionId: `restored_txn_${Date.now()}`,
              purchaseTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
              isActive: true
            }
          ];
          
          console.log('[Purchase] DRY_RUN restore success:', mockRestoredPurchases);
          
          return {
            success: true,
            message: `Restored ${mockRestoredPurchases.length} purchase(s) (DRY_RUN mode)`
          };
        } else {
          console.log('[Purchase] DRY_RUN restore - no previous purchases found');
          return {
            success: false,
            message: 'No previous purchases found (DRY_RUN mode)'
          };
        }
      }

      // In LIVE mode, this would restore actual purchases
      if (Platform.OS === 'ios') {
        // iOS restore flow
        console.log('[Purchase] iOS restore purchases');
        
        // Example with expo-in-app-purchases:
        // const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
        // if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        //   return {
        //     success: true,
        //     message: `Restored ${results.length} purchase(s)`
        //   };
        // }
        
        throw new Error('iOS restore not implemented - set DRY_RUN=true for demo mode');
      } else if (Platform.OS === 'android') {
        // Android restore flow
        console.log('[Purchase] Android restore purchases');
        
        // Example with react-native-iap:
        // const purchases = await RNIap.getAvailablePurchases();
        // return {
        //   success: true,
        //   message: `Restored ${purchases.length} purchase(s)`
        // };
        
        throw new Error('Android restore not implemented - set DRY_RUN=true for demo mode');
      } else {
        return {
          success: false,
          message: 'Restore not supported on web'
        };
      }
    } catch (error) {
      console.error('[Purchase] Restore failed:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Restore failed'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    purchasePlan,
    restorePurchases,
    isLoading
  };
};