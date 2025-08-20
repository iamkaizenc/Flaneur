import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Crown, Zap } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';

interface PaywallProps {
  feature: 'analytics' | 'automation' | 'aiAgent' | 'prioritySupport';
  title: string;
  description: string;
  onUpgrade?: () => void;
  children?: React.ReactNode;
}

const FEATURE_ICONS = {
  analytics: '📊',
  automation: '🤖',
  aiAgent: '✨',
  prioritySupport: '🎯'
} as const;

const FEATURE_NAMES = {
  analytics: 'Analytics',
  automation: 'Automation',
  aiAgent: 'AI Agent',
  prioritySupport: 'Priority Support'
} as const;

export function Paywall({ feature, title, description, onUpgrade, children }: PaywallProps) {
  const featureAccessQuery = trpc.billing.checkFeatureAccess.useQuery({ feature });
  const createCheckoutMutation = trpc.billing.createCheckout.useMutation();
  
  // Show loading state
  if (featureAccessQuery.isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Checking access...</Text>
        </View>
      </View>
    );
  }
  
  // If user has access, render children
  if (featureAccessQuery.data?.hasAccess) {
    return <>{children}</>;
  }
  
  // Show paywall
  const handleUpgrade = async () => {
    try {
      if (onUpgrade) {
        onUpgrade();
        return;
      }
      
      // Default upgrade flow
      const result = await createCheckoutMutation.mutateAsync({
        plan: 'premium',
        period: 'm'
      });
      
      if (result.success && result.checkoutUrl) {
        Alert.alert(
          'Upgrade Required',
          'You will be redirected to complete your subscription.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Continue', 
              onPress: () => {
                // In a real app, you would open the checkout URL
                console.log('Opening checkout:', result.checkoutUrl);
                Alert.alert('Demo Mode', 'Checkout URL: ' + result.checkoutUrl);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      Alert.alert('Error', 'Failed to start upgrade process. Please try again.');
    }
  };
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.paywallCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Lock size={24} color="#ffffff" />
          </View>
          <Text style={styles.featureIcon}>{FEATURE_ICONS[feature]}</Text>
        </View>
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        
        <View style={styles.featureTag}>
          <Crown size={16} color="#ffd700" />
          <Text style={styles.featureTagText}>
            {FEATURE_NAMES[feature]} • Premium Feature
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={handleUpgrade}
          disabled={createCheckoutMutation.isPending}
        >
          <LinearGradient
            colors={['#ffd700', '#ffed4e']}
            style={styles.upgradeButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Zap size={20} color="#000000" />
            <Text style={styles.upgradeButtonText}>
              {createCheckoutMutation.isPending ? 'Loading...' : 'Upgrade to Premium'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.subtitle}>
          Unlock this feature and more with Premium
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  paywallCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 24,
    position: 'absolute',
    top: -8,
    right: -8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  featureTagText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 6,
  },
  upgradeButton: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});