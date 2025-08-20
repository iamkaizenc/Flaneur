import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, CreditCard, Check, Zap, Shield, BarChart3, Bot } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';

export function BillingSettings() {
  const currentPlanQuery = trpc.billing.getCurrent.useQuery();
  const plansQuery = trpc.billing.list.useQuery();
  const usageQuery = trpc.billing.usage.useQuery();
  const createCheckoutMutation = trpc.billing.createCheckout.useMutation();
  const getPortalMutation = trpc.billing.portal.useMutation();

  const handleUpgrade = async (planId: string, period: 'm' | 'y') => {
    try {
      const result = await createCheckoutMutation.mutateAsync({
        plan: planId as 'premium' | 'platinum',
        period
      });

      if (result.success && result.checkoutUrl) {
        Alert.alert(
          'Upgrade Plan',
          `You will be redirected to complete your ${planId} subscription.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Continue', 
              onPress: () => {
                console.log('Opening checkout:', result.checkoutUrl);
                Alert.alert('Demo Mode', `Checkout URL: ${result.checkoutUrl}`);
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

  const handleManageBilling = async () => {
    try {
      const result = await getPortalMutation.mutateAsync({});

      if (result.success && result.portalUrl) {
        console.log('Opening portal:', result.portalUrl);
        Alert.alert('Demo Mode', `Portal URL: ${result.portalUrl}`);
      }
    } catch (error) {
      console.error('Portal error:', error);
      Alert.alert('Error', 'Failed to open billing portal. Please try again.');
    }
  };

  if (currentPlanQuery.isLoading || plansQuery.isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Loading billing information...</Text>
        </View>
      </View>
    );
  }

  const currentPlan = currentPlanQuery.data;
  const plans = plansQuery.data?.plans || [];
  const usage = usageQuery.data?.usage;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Current Plan Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Plan</Text>
        <LinearGradient
          colors={currentPlan?.plan === 'free' ? ['#f8f9fa', '#e9ecef'] : ['#667eea', '#764ba2']}
          style={styles.currentPlanCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.planHeader}>
            <View style={styles.planTitleContainer}>
              <Crown size={24} color={currentPlan?.plan === 'free' ? '#6c757d' : '#ffd700'} />
              <Text style={[
                styles.planTitle,
                { color: currentPlan?.plan === 'free' ? '#495057' : '#ffffff' }
              ]}>
                {currentPlan?.name || 'Free'}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: currentPlan?.plan === 'free' ? '#28a745' : 'rgba(255, 255, 255, 0.2)' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: currentPlan?.plan === 'free' ? '#ffffff' : '#ffffff' }
              ]}>
                {currentPlan?.status === 'active' ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          
          <Text style={[
            styles.planDescription,
            { color: currentPlan?.plan === 'free' ? '#6c757d' : 'rgba(255, 255, 255, 0.9)' }
          ]}>
            {currentPlan?.description || 'Basic features for getting started'}
          </Text>
          
          {currentPlan?.plan !== 'free' && (
            <View style={styles.billingInfo}>
              <Text style={styles.billingText}>
                ${currentPlan?.price}/{currentPlan?.billingCycle === 'yearly' ? 'year' : 'month'}
              </Text>
              <Text style={styles.nextBilling}>
                Next billing: {new Date(currentPlan?.current_period_end || '').toLocaleDateString()}
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Usage Stats */}
      {usage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage This Month</Text>
          <View style={styles.usageCard}>
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>Connected Accounts</Text>
              <View style={styles.usageBar}>
                <View style={[styles.usageProgress, { width: `${usage.accounts.percentage}%` }]} />
              </View>
              <Text style={styles.usageText}>
                {usage.accounts.used} / {usage.accounts.limit}
              </Text>
            </View>
            
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>Daily Posts</Text>
              <View style={styles.usageBar}>
                <View style={[styles.usageProgress, { width: `${usage.dailyPosts.percentage}%` }]} />
              </View>
              <Text style={styles.usageText}>
                {usage.dailyPosts.used} / {usage.dailyPosts.limit}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Available Plans */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Plans</Text>
        {plans.map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            <View style={styles.planCardHeader}>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>
                  {plan.price === 0 ? 'Free' : `$${plan.price}/month`}
                </Text>
                {plan.priceYearly && (
                  <Text style={styles.yearlyPrice}>
                    or $${plan.priceYearly}/year (save ${(plan.price * 12) - plan.priceYearly})
                  </Text>
                )}
              </View>
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Popular</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.planDescription}>{plan.description}</Text>
            
            <View style={styles.featuresContainer}>
              <View style={styles.featureRow}>
                <BarChart3 size={16} color={plan.features.analytics ? '#28a745' : '#6c757d'} />
                <Text style={[styles.featureText, { color: plan.features.analytics ? '#000' : '#6c757d' }]}>
                  Advanced Analytics
                </Text>
                {plan.features.analytics && <Check size={16} color="#28a745" />}
              </View>
              
              <View style={styles.featureRow}>
                <Bot size={16} color={plan.features.automation ? '#28a745' : '#6c757d'} />
                <Text style={[styles.featureText, { color: plan.features.automation ? '#000' : '#6c757d' }]}>
                  Automation
                </Text>
                {plan.features.automation && <Check size={16} color="#28a745" />}
              </View>
              
              <View style={styles.featureRow}>
                <Zap size={16} color={plan.features.aiAgent ? '#28a745' : '#6c757d'} />
                <Text style={[styles.featureText, { color: plan.features.aiAgent ? '#000' : '#6c757d' }]}>
                  AI Agent
                </Text>
                {plan.features.aiAgent && <Check size={16} color="#28a745" />}
              </View>
              
              <View style={styles.featureRow}>
                <Shield size={16} color={plan.features.prioritySupport ? '#28a745' : '#6c757d'} />
                <Text style={[styles.featureText, { color: plan.features.prioritySupport ? '#000' : '#6c757d' }]}>
                  Priority Support
                </Text>
                {plan.features.prioritySupport && <Check size={16} color="#28a745" />}
              </View>
            </View>
            
            {plan.id !== currentPlan?.plan && plan.id !== 'free' && (
              <View style={styles.planActions}>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => handleUpgrade(plan.id, 'm')}
                  disabled={createCheckoutMutation.isPending}
                >
                  <Text style={styles.upgradeButtonText}>
                    {createCheckoutMutation.isPending ? 'Loading...' : 'Upgrade Monthly'}
                  </Text>
                </TouchableOpacity>
                
                {plan.priceYearly && (
                  <TouchableOpacity
                    style={[styles.upgradeButton, styles.yearlyButton]}
                    onPress={() => handleUpgrade(plan.id, 'y')}
                    disabled={createCheckoutMutation.isPending}
                  >
                    <Text style={styles.yearlyButtonText}>
                      {createCheckoutMutation.isPending ? 'Loading...' : 'Upgrade Yearly'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {plan.id === currentPlan?.plan && (
              <View style={styles.currentPlanBadge}>
                <Check size={16} color="#28a745" />
                <Text style={styles.currentPlanText}>Current Plan</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Billing Management */}
      {currentPlan?.plan !== 'free' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Management</Text>
          <TouchableOpacity
            style={styles.manageBillingButton}
            onPress={handleManageBilling}
            disabled={getPortalMutation.isPending}
          >
            <CreditCard size={20} color="#667eea" />
            <Text style={styles.manageBillingText}>
              {getPortalMutation.isPending ? 'Loading...' : 'Manage Billing & Invoices'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
    marginHorizontal: 20,
  },
  currentPlanCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 16,
    marginBottom: 16,
  },
  billingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  nextBilling: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  usageCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  usageItem: {
    marginBottom: 16,
  },
  usageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  usageBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 4,
  },
  usageProgress: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 4,
  },
  usageText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'right',
  },
  planCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 2,
  },
  yearlyPrice: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  popularBadge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  featuresContainer: {
    marginVertical: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  planActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  upgradeButton: {
    flex: 1,
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  yearlyButton: {
    backgroundColor: '#28a745',
  },
  yearlyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  currentPlanText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
    marginLeft: 4,
  },
  manageBillingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  manageBillingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 12,
  },
});