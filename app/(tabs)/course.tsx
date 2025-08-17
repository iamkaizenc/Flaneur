import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Compass, Plus, X, Target, Volume2, Shield } from "lucide-react-native";
import { useAIMarketer } from "@/providers/AIMarketerProvider";
import { theme, brandName } from "@/constants/theme";

export default function CourseScreen() {
  const { coursePrompts, addCoursePrompt, removeCoursePrompt } = useAIMarketer();
  const [newPrompt, setNewPrompt] = useState("");
  const [focus, setFocus] = useState("Product");
  const [tone, setTone] = useState("Informative");
  const [riskLevel, setRiskLevel] = useState("Normal");

  const handleAddPrompt = () => {
    if (newPrompt.trim()) {
      addCoursePrompt(newPrompt.trim());
      setNewPrompt("");
    }
  };

  const focusOptions = ["Product", "Brand", "Industry", "Community"];
  const toneOptions = ["Informative", "Casual", "Professional", "Bold"];
  const riskOptions = ["Conservative", "Normal", "Aggressive"];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brandName}>{brandName}</Text>
        <Text style={styles.brandTagline}>Course Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.promptCard}>
          <View style={styles.cardHeader}>
            <Compass size={24} color={theme.colors.black} />
            <Text style={styles.cardTitle}>Course Prompts</Text>
          </View>
          <Text style={styles.cardDescription}>
            Guide your AI marketer with strategic prompts. These will influence content creation and strategy.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter a course prompt..."
              placeholderTextColor={theme.colors.gray[400]}
              value={newPrompt}
              onChangeText={setNewPrompt}
              multiline
            />
            <TouchableOpacity
              style={[styles.addButton, !newPrompt.trim() && styles.addButtonDisabled]}
              onPress={handleAddPrompt}
              disabled={!newPrompt.trim()}
            >
              <Plus size={20} color={theme.colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.promptsList}>
            {coursePrompts.map((prompt, index) => (
              <View key={index} style={styles.promptItem}>
                <Text style={styles.promptText}>{prompt}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeCoursePrompt(index)}
                >
                  <X size={16} color={theme.colors.gray[400]} />
                </TouchableOpacity>
              </View>
            ))}
            {coursePrompts.length === 0 && (
              <Text style={styles.emptyText}>
                No prompts added yet. Add your first strategic prompt above.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.cardHeader}>
            <Target size={24} color={theme.colors.black} />
            <Text style={styles.cardTitle}>Focus Area</Text>
          </View>
          <View style={styles.optionsGrid}>
            {focusOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  focus === option && styles.optionButtonActive
                ]}
                onPress={() => setFocus(option)}
              >
                <Text style={[
                  styles.optionText,
                  focus === option && styles.optionTextActive
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.cardHeader}>
            <Volume2 size={24} color={theme.colors.black} />
            <Text style={styles.cardTitle}>Tone & Voice</Text>
          </View>
          <View style={styles.optionsGrid}>
            {toneOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  tone === option && styles.optionButtonActive
                ]}
                onPress={() => setTone(option)}
              >
                <Text style={[
                  styles.optionText,
                  tone === option && styles.optionTextActive
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.cardHeader}>
            <Shield size={24} color={theme.colors.black} />
            <Text style={styles.cardTitle}>Risk Level</Text>
          </View>
          <View style={styles.optionsGrid}>
            {riskOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  riskLevel === option && styles.optionButtonActive
                ]}
                onPress={() => setRiskLevel(option)}
              >
                <Text style={[
                  styles.optionText,
                  riskLevel === option && styles.optionTextActive
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.riskDescription}>
            {riskLevel === "Conservative" && "Safe, brand-friendly content with minimal risk"}
            {riskLevel === "Normal" && "Balanced approach with moderate creative freedom"}
            {riskLevel === "Aggressive" && "Bold, attention-grabbing content with higher engagement potential"}
          </Text>
        </View>

        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Course Settings</Text>
        </TouchableOpacity>
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
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[800],
  },
  brandName: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: theme.colors.white,
    fontFamily: theme.typography.serif.fontFamily,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 14,
    color: theme.colors.gray[400],
    fontFamily: theme.typography.sansSerif.fontFamily,
  },
  promptCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  settingsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginLeft: 8,
    fontFamily: theme.typography.serif.fontFamily,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.gray[600],
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.md,
    padding: 12,
    fontSize: 16,
    color: theme.colors.black,
    minHeight: 80,
    textAlignVertical: "top",
  },
  addButton: {
    backgroundColor: theme.colors.black,
    borderRadius: theme.borderRadius.md,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonDisabled: {
    backgroundColor: theme.colors.gray[300],
  },
  promptsList: {
    gap: 8,
  },
  promptItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.md,
    padding: 12,
    gap: 12,
  },
  promptText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.black,
    lineHeight: 20,
  },
  removeButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.gray[400],
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  optionButtonActive: {
    backgroundColor: theme.colors.black,
    borderColor: theme.colors.black,
  },
  optionText: {
    fontSize: 14,
    color: theme.colors.gray[600],
    fontWeight: "500" as const,
  },
  optionTextActive: {
    color: theme.colors.white,
  },
  riskDescription: {
    fontSize: 12,
    color: theme.colors.gray[500],
    lineHeight: 16,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: theme.colors.black,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: theme.spacing.lg,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.white,
  },
});