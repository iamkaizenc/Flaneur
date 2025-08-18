import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Play, CheckCircle, XCircle, Clock } from "lucide-react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

interface TestResult {
  testName: string;
  status: 'pass' | 'fail' | 'running';
  message: string;
  details?: any;
  timestamp: string;
}

export default function E2ETestScreen() {
  const router = useRouter();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // tRPC mutations for E2E tests
  const connectPlatformsMutation = trpc.e2e.connectPlatforms.useMutation();
  const publishPostsMutation = trpc.e2e.publishPosts.useMutation();
  const idempotencyTestMutation = trpc.e2e.idempotencyTest.useMutation();
  const growthUpdatesMutation = trpc.e2e.growthUpdates.useMutation();
  const badgeStreakCronMutation = trpc.e2e.badgeStreakCron.useMutation();
  const fullFlowMutation = trpc.e2e.fullFlow.useMutation();

  const runIndividualTest = async (testName: string, mutation: any) => {
    setTestResults(prev => [...prev, {
      testName,
      status: 'running',
      message: 'Test in progress...',
      timestamp: new Date().toISOString()
    }]);

    try {
      const result = await mutation.mutateAsync();
      
      setTestResults(prev => prev.map(test => 
        test.testName === testName ? {
          ...test,
          status: result.success ? 'pass' : 'fail',
          message: result.message,
          details: result,
          timestamp: new Date().toISOString()
        } : test
      ));

      if (result.success) {
        console.log(`✅ ${testName} passed:`, result);
      } else {
        console.error(`❌ ${testName} failed:`, result);
      }
    } catch (error) {
      console.error(`💥 ${testName} error:`, error);
      
      setTestResults(prev => prev.map(test => 
        test.testName === testName ? {
          ...test,
          status: 'fail',
          message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString()
        } : test
      ));
    }
  };

  const runFullE2EFlow = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      console.log("🚀 Starting full E2E test flow...");

      // Step 1: Connect Platforms
      await runIndividualTest("Platform Connections", connectPlatformsMutation);
      
      // Step 2: Publish Posts
      await runIndividualTest("Publish Posts", publishPostsMutation);
      
      // Step 3: Idempotency Test
      await runIndividualTest("Idempotency Test", idempotencyTestMutation);
      
      // Step 4: Growth Updates
      await runIndividualTest("Growth Updates", growthUpdatesMutation);
      
      // Step 5: Badge & Streak Crons
      await runIndividualTest("Badge & Streak Crons", badgeStreakCronMutation);

      const passedTests = testResults.filter(t => t.status === 'pass').length;
      const totalTests = testResults.length;
      
      Alert.alert(
        "E2E Tests Complete",
        `${passedTests}/${totalTests} tests passed`,
        [{ text: "OK" }]
      );

    } catch (error) {
      console.error("E2E Flow Error:", error);
      Alert.alert("E2E Test Error", "Failed to complete E2E test flow");
    } finally {
      setIsRunning(false);
    }
  };

  const runQuickTest = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      console.log("⚡ Running quick E2E test...");
      
      const result = await fullFlowMutation.mutateAsync();
      
      if (result.results) {
        setTestResults(result.results.map((r: any) => ({
          testName: r.testName,
          status: r.status,
          message: r.message,
          details: r.details,
          timestamp: r.timestamp
        })));
      }

      Alert.alert(
        "Quick Test Complete",
        result.message,
        [{ text: "OK" }]
      );

    } catch (error) {
      console.error("Quick Test Error:", error);
      Alert.alert("Quick Test Error", "Failed to run quick test");
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle size={20} color="#10B981" />;
      case 'fail':
        return <XCircle size={20} color="#EF4444" />;
      case 'running':
        return <Clock size={20} color="#F59E0B" />;
      default:
        return <Clock size={20} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return "#10B981";
      case 'fail':
        return "#EF4444";
      case 'running':
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>E2E Tests</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Controls</Text>
          <Text style={styles.sectionDescription}>
            Run end-to-end tests to verify platform connections, publishing with plan gates, posting windows, daily quotas, guardrails, idempotency, growth updates, and cron jobs.
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.testButton, styles.primaryButton]} 
              onPress={runFullE2EFlow}
              disabled={isRunning}
            >
              {isRunning ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Play size={20} color={theme.colors.white} />
              )}
              <Text style={styles.primaryButtonText}>
                {isRunning ? "Running..." : "Run Full E2E Flow"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, styles.secondaryButton]} 
              onPress={runQuickTest}
              disabled={isRunning}
            >
              <Play size={20} color="#10B981" />
              <Text style={styles.secondaryButtonText}>Quick Test</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, styles.clearButton]} 
              onPress={clearResults}
              disabled={isRunning}
            >
              <Text style={styles.clearButtonText}>Clear Results</Text>
            </TouchableOpacity>
          </View>
        </View>

        {testResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <Text style={styles.summaryValue}>{testResults.length}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Passed</Text>
                  <Text style={[styles.summaryValue, { color: "#10B981" }]}>
                    {testResults.filter(t => t.status === 'pass').length}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Failed</Text>
                  <Text style={[styles.summaryValue, { color: "#EF4444" }]}>
                    {testResults.filter(t => t.status === 'fail').length}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Running</Text>
                  <Text style={[styles.summaryValue, { color: "#F59E0B" }]}>
                    {testResults.filter(t => t.status === 'running').length}
                  </Text>
                </View>
              </View>
            </View>

            {testResults.map((result, index) => (
              <View key={index} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  {getStatusIcon(result.status)}
                  <Text style={styles.resultTitle}>{result.testName}</Text>
                  <Text style={[styles.resultStatus, { color: getStatusColor(result.status) }]}>
                    {result.status.toUpperCase()}
                  </Text>
                </View>
                
                <Text style={styles.resultMessage}>{result.message}</Text>
                
                <Text style={styles.resultTimestamp}>
                  {new Date(result.timestamp).toLocaleTimeString()}
                </Text>
                
                {result.details && (
                  <TouchableOpacity 
                    style={styles.detailsButton}
                    onPress={() => {
                      Alert.alert(
                        "Test Details",
                        JSON.stringify(result.details, null, 2),
                        [{ text: "OK" }]
                      );
                    }}
                  >
                    <Text style={styles.detailsButtonText}>View Details</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Coverage</Text>
          <View style={styles.coverageList}>
            <View style={styles.coverageItem}>
              <Text style={styles.coverageIcon}>🔗</Text>
              <Text style={styles.coverageText}>Platform Connections (X DRY_RUN, Telegram LIVE)</Text>
            </View>
            <View style={styles.coverageItem}>
              <Text style={styles.coverageIcon}>📝</Text>
              <Text style={styles.coverageText}>Content Publishing & Guardrails</Text>
            </View>
            <View style={styles.coverageItem}>
              <Text style={styles.coverageIcon}>🛡️</Text>
              <Text style={styles.coverageText}>Plan Gates (Free/Premium/Platinum)</Text>
            </View>
            <View style={styles.coverageItem}>
              <Text style={styles.coverageIcon}>⏰</Text>
              <Text style={styles.coverageText}>Posting Window (08:00-22:00 TZ)</Text>
            </View>
            <View style={styles.coverageItem}>
              <Text style={styles.coverageIcon}>📊</Text>
              <Text style={styles.coverageText}>Daily Quotas (X:5, IG:2, LI:1, FB:2, TG:∞)</Text>
            </View>
            <View style={styles.coverageItem}>
              <Text style={styles.coverageIcon}>🚫</Text>
              <Text style={styles.coverageText}>Banned Words (&quot;bedava&quot;, &quot;revolutionary&quot;)</Text>
            </View>
            <View style={styles.coverageItem}>
              <Text style={styles.coverageIcon}>🔄</Text>
              <Text style={styles.coverageText}>Idempotency & Duplicate Prevention</Text>
            </View>
            <View style={styles.coverageItem}>
              <Text style={styles.coverageIcon}>📈</Text>
              <Text style={styles.coverageText}>Growth Updates & FameScore (+10 Push)</Text>
            </View>
            <View style={styles.coverageItem}>
              <Text style={styles.coverageIcon}>🏆</Text>
              <Text style={styles.coverageText}>Badge & Streak Cron Jobs</Text>
            </View>
            <View style={styles.coverageItem}>
              <Text style={styles.coverageIcon}>📋</Text>
              <Text style={styles.coverageText}>Trace Logs (queued → publishing → success/held)</Text>
            </View>
          </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[800],
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: theme.colors.white,
    fontFamily: theme.typography.serif.fontFamily,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.serif.fontFamily,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.gray[400],
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  buttonContainer: {
    gap: theme.spacing.md,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: "#10B981",
  },
  secondaryButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  clearButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.gray[600],
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.white,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#10B981",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.gray[400],
  },
  summaryCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.gray[500],
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: theme.colors.black,
  },
  resultCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  resultTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600" as const,
    color: theme.colors.black,
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  resultMessage: {
    fontSize: 14,
    color: theme.colors.gray[600],
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  resultTimestamp: {
    fontSize: 12,
    color: theme.colors.gray[500],
    marginBottom: theme.spacing.sm,
  },
  detailsButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.gray[100],
    borderRadius: 4,
  },
  detailsButtonText: {
    fontSize: 12,
    color: theme.colors.gray[600],
    fontWeight: "500" as const,
  },
  coverageList: {
    gap: theme.spacing.sm,
  },
  coverageItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  coverageIcon: {
    fontSize: 16,
  },
  coverageText: {
    fontSize: 14,
    color: theme.colors.gray[300],
    flex: 1,
  },
});