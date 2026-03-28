import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";

import { router } from "expo-router";
import { Sparkles, Target, Zap, ChevronRight } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme, brandName, brandTagline } from "@/constants/theme";
import { Logo } from "@/components/Logo";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  {
    icon: <Sparkles size={48} color={theme.colors.black} />,
    title: "AI-Powered Marketing",
    description: "Let our intelligent agent create, publish, and optimize your social media content 24/7"
  },
  {
    icon: <Target size={48} color={theme.colors.black} />,
    title: "Strategic Automation",
    description: "Set your course with simple prompts and watch your social presence grow autonomously"
  },
  {
    icon: <Zap size={48} color={theme.colors.black} />,
    title: "Continuous Learning",
    description: "Your AI marketer learns from performance data and adapts strategies in real-time"
  }
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace("/platform-connect" as any);
    }
  };

  const handleSkip = () => {
    router.replace("/platform-connect" as any);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.brandHeader}>
            <Logo size="large" style={styles.logo} />
            <Text style={styles.brandName}>{brandName}</Text>
            <Text style={styles.brandTagline}>{brandTagline}</Text>
          </View>
          
          <View style={styles.iconContainer}>
            {steps[currentStep].icon}
          </View>
          
          <Text style={styles.title}>{steps[currentStep].title}</Text>
          <Text style={styles.description}>{steps[currentStep].description}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep && styles.dotActive
                ]}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            </Text>
            <ChevronRight size={20} color={theme.colors.black} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  skipButton: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  skipText: {
    color: theme.colors.gray[400],
    fontSize: 16,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: theme.spacing.xxl,
  },
  logo: {
    marginBottom: theme.spacing.md,
  },
  brandName: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: theme.colors.white,
    fontFamily: theme.typography.serif.fontFamily,
    marginBottom: 8,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 16,
    color: theme.colors.gray[400],
    fontFamily: theme.typography.sansSerif.fontFamily,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: theme.colors.white,
    textAlign: "center",
    marginBottom: 16,
    fontFamily: theme.typography.serif.fontFamily,
  },
  description: {
    fontSize: 18,
    color: theme.colors.gray[300],
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  footer: {
    paddingBottom: 32,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.gray[600],
  },
  dotActive: {
    width: 24,
    backgroundColor: theme.colors.white,
  },
  nextButton: {
    flexDirection: "row",
    backgroundColor: theme.colors.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: theme.colors.black,
  },
});