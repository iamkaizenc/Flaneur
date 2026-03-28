import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useBackendStatus } from '@/lib/trpc-fallback';

interface BackendStatusIndicatorProps {
  style?: any;
  showDetails?: boolean;
}

export function BackendStatusIndicator({ style, showDetails = false }: BackendStatusIndicatorProps) {
  const { isBackendAvailable, lastError, retryConnection, useFallbackData } = useBackendStatus();

  const handleRetry = async () => {
    console.log('[Backend Status] Manual retry triggered');
    await retryConnection();
  };

  if (!showDetails && isBackendAvailable) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.statusRow}>
        {isBackendAvailable ? (
          <Wifi size={16} color="#10B981" />
        ) : (
          <WifiOff size={16} color="#F59E0B" />
        )}
        
        <Text style={[
          styles.statusText,
          { color: isBackendAvailable ? "#10B981" : "#F59E0B" }
        ]}>
          {isBackendAvailable ? 'Backend Connected' : 'Backend Offline - Using Demo Data'}
        </Text>
        
        {!isBackendAvailable && (
          <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
            <RefreshCw size={14} color={theme.colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>
      
      {showDetails && useFallbackData && (
        <View style={styles.detailsRow}>
          <AlertCircle size={12} color={theme.colors.gray[400]} />
          <Text style={styles.detailsText}>
            Using cached data. {lastError ? `Error: ${lastError}` : 'Backend unavailable.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.gray[900],
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginVertical: theme.spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500' as const,
    flex: 1,
  },
  retryButton: {
    padding: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[800],
  },
  detailsText: {
    fontSize: 10,
    color: theme.colors.gray[400],
    flex: 1,
  },
});

export default BackendStatusIndicator;