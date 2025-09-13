import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Server,
  Wifi,
  WifiOff
} from "lucide-react-native";
import { theme } from "@/constants/theme";
import { trpc, testBackendConnection } from "@/lib/trpc";

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function OAuthTestScreen() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Test OAuth endpoints
  const oauthListQuery = trpc.oauth.listAccounts.useQuery(undefined, {
    enabled: false,
    retry: false,
  });

  const oauthStartMutation = trpc.oauth.start.useMutation({
    retry: false,
  });

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    setBackendStatus('checking');
    try {
      const result = await testBackendConnection();
      setBackendStatus(result.success ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Test 1: Backend Connection
    results.push({
      name: "Backend Connection",
      status: 'pending',
      message: "Testing backend server connection...",
    });
    setTestResults([...results]);

    try {
      const backendTest = await testBackendConnection();
      results[0] = {
        name: "Backend Connection",
        status: backendTest.success ? 'success' : 'error',
        message: backendTest.success 
          ? "Backend server is running and accessible"
          : "Backend server is not accessible",
        details: backendTest.details,
      };
    } catch (error) {
      results[0] = {
        name: "Backend Connection",
        status: 'error',
        message: "Failed to test backend connection",
        details: error,
      };
    }
    setTestResults([...results]);

    // Test 2: OAuth List Accounts
    results.push({
      name: "OAuth List Accounts",
      status: 'pending',
      message: "Testing OAuth account listing...",
    });
    setTestResults([...results]);

    try {
      const accountsData = await oauthListQuery.refetch();
      if (accountsData.data) {
        results[1] = {
          name: "OAuth List Accounts",
          status: 'success',
          message: `Found ${accountsData.data.total || 0} connected accounts`,
          details: accountsData.data,
        };
      } else {
        results[1] = {
          name: "OAuth List Accounts",
          status: 'warning',
          message: "No accounts found or using fallback data",
          details: accountsData,
        };
      }
    } catch (error: any) {
      results[1] = {
        name: "OAuth List Accounts",
        status: 'error',
        message: error?.message || "Failed to list OAuth accounts",
        details: error,
      };
    }
    setTestResults([...results]);

    // Test 3: OAuth Start Flow (Demo)
    results.push({
      name: "OAuth Start Flow",
      status: 'pending',
      message: "Testing OAuth initialization...",
    });
    setTestResults([...results]);

    try {
      const startResult = await oauthStartMutation.mutateAsync({
        platform: 'x' as any,
      });
      
      results[2] = {
        name: "OAuth Start Flow",
        status: 'success',
        message: startResult.authUrl 
          ? "OAuth flow can be initiated"
          : "OAuth flow ready (bot token mode)",
        details: {
          authUrl: startResult.authUrl ? "Generated" : "N/A",
          state: 'state' in startResult ? startResult.state : undefined,
          requiresBotToken: startResult.requiresBotToken,
        },
      };
    } catch (error: any) {
      results[2] = {
        name: "OAuth Start Flow",
        status: 'error',
        message: error?.message || "Failed to start OAuth flow",
        details: error,
      };
    }
    setTestResults([...results]);

    // Test 4: Environment Check
    results.push({
      name: "Environment Configuration",
      status: 'pending',
      message: "Checking environment settings...",
    });
    setTestResults([...results]);

    const isDryRun = process.env.DRY_RUN === 'true';
    const isLiveMode = process.env.EXPO_PUBLIC_LIVE_MODE === 'true';
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    const trpcUrl = process.env.EXPO_PUBLIC_TRPC_URL;

    results[3] = {
      name: "Environment Configuration",
      status: 'success',
      message: `Mode: ${isLiveMode ? 'LIVE' : 'DEMO'} | DRY_RUN: ${isDryRun ? 'ON' : 'OFF'}`,
      details: {
        LIVE_MODE: isLiveMode,
        DRY_RUN: isDryRun,
        API_URL: apiUrl || 'Not set',
        TRPC_URL: trpcUrl || 'Not set',
      },
    };
    setTestResults([...results]);

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} color={theme.colors.success} />;
      case 'error':
        return <XCircle size={20} color={theme.colors.error} />;
      case 'warning':
        return <AlertCircle size={20} color="#F59E0B" />;
      default:
        return <ActivityIndicator size="small" color={theme.colors.gray[400]} />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return '#F59E0B';
      default:
        return theme.colors.gray[400];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>OAuth System Test</Text>
          <Text style={styles.subtitle}>
            Verify OAuth implementation and backend connectivity
          </Text>
        </View>

        {/* Backend Status Card */}
        <View style={[styles.statusCard, {
          borderColor: backendStatus === 'online' 
            ? theme.colors.success 
            : backendStatus === 'offline' 
            ? theme.colors.error 
            : theme.colors.gray[600]
        }]}>
          <View style={styles.statusHeader}>
            {backendStatus === 'online' ? (
              <Wifi size={24} color={theme.colors.success} />
            ) : backendStatus === 'offline' ? (
              <WifiOff size={24} color={theme.colors.error} />
            ) : (
              <Server size={24} color={theme.colors.gray[400]} />
            )}
            <Text style={styles.statusTitle}>Backend Server</Text>
          </View>
          <Text style={[styles.statusText, {
            color: backendStatus === 'online' 
              ? theme.colors.success 
              : backendStatus === 'offline' 
              ? theme.colors.error 
              : theme.colors.gray[400]
          }]}>
            {backendStatus === 'checking' && 'Checking...'}
            {backendStatus === 'online' && 'Online and responding'}
            {backendStatus === 'offline' && 'Offline - Start with: bun run backend/server.ts'}
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={checkBackendStatus}
          >
            <RefreshCw size={16} color={theme.colors.gray[400]} />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Test Results */}
        {testResults.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            {testResults.map((result) => (
              <View key={result.name} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  {getStatusIcon(result.status)}
                  <Text style={styles.resultName}>{result.name}</Text>
                </View>
                <Text style={[styles.resultMessage, {
                  color: getStatusColor(result.status)
                }]}>
                  {result.message}
                </Text>
                {result.details && (
                  <View style={styles.detailsBox}>
                    <Text style={styles.detailsText}>
                      {JSON.stringify(result.details, null, 2)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={runTests}
            disabled={isRunning}
          >
            {isRunning ? (
              <ActivityIndicator size="small" color={theme.colors.black} />
            ) : (
              <Text style={styles.primaryButtonText}>Run All Tests</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push("/platform-connect")}
          >
            <Text style={styles.secondaryButtonText}>Test OAuth UI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.back()}
          >
            <Text style={styles.linkButtonText}>Back to App</Text>
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Quick Help</Text>
          <Text style={styles.helpText}>
            1. Start backend: bun run backend/server.ts{'\n'}
            2. Wait for &quot;API is running&quot; message{'\n'}
            3. Run tests to verify OAuth setup{'\n'}
            4. Test OAuth UI for user flow
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    marginTop: 32,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: theme.colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.gray[400],
    lineHeight: 24,
  },
  statusCard: {
    backgroundColor: theme.colors.gray[900],
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.white,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  refreshText: {
    fontSize: 12,
    color: theme.colors.gray[400],
  },
  resultsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: theme.colors.white,
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: theme.colors.gray[900],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  resultName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: theme.colors.white,
  },
  resultMessage: {
    fontSize: 12,
    lineHeight: 18,
  },
  detailsBox: {
    backgroundColor: theme.colors.black,
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  detailsText: {
    fontSize: 10,
    color: theme.colors.gray[400],
    fontFamily: "monospace",
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: theme.colors.white,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.black,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.gray[600],
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.white,
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  linkButtonText: {
    fontSize: 14,
    color: theme.colors.gray[400],
  },
  helpSection: {
    backgroundColor: theme.colors.gray[900],
    borderRadius: 8,
    padding: 16,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: theme.colors.white,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: theme.colors.gray[400],
    lineHeight: 18,
  },
});