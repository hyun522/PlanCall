import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  // SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEvents } from "../contexts/EventContext";

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateSettings } = useEvents();

  const handleStart = () => {
    updateSettings({ hasCompletedOnboarding: true });
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* 로고 */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/plancall-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.subtitle}>
            중요한 일정에 늦지 않도록{"\n"}
            출발 시간을 자동으로 계산해드려요
          </Text>

          {/* 기능 카드들 */}
          <View style={styles.features}>
            <View style={styles.featureCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="navigate" size={24} color="#4a9d6f" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>이동 시간 계산</Text>
                <Text style={styles.featureDescription}>
                  출발지와 목적지, 이동 수단을 입력하면 자동으로 소요 시간을
                  계산합니다
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="time" size={24} color="#4a9d6f" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>콜타임 설정 가능</Text>
                <Text style={styles.featureDescription}>
                  여유시간과 예식전 콜타임 시간을 설정 할 수 있습니다
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="notifications" size={24} color="#4a9d6f" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>자동 알림 설정</Text>
                <Text style={styles.featureDescription}>
                  일정 저장 시 출발 시간에 맞춰 알림이 자동으로 등록됩니다
                </Text>
              </View>
            </View>
          </View>

          {/* 시작 버튼 */}
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>시작하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafbfc",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  content: {
    maxWidth: 448,
    width: "100%",
    alignSelf: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    height: 80,
    width: "100%",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    color: "#6c757d",
    marginBottom: 40,
    lineHeight: 26,
  },
  features: {
    gap: 16,
    marginBottom: 40,
  },
  featureCard: {
    flexDirection: "row",
    gap: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e8f5ed",
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#1a1a1a",
  },
  featureDescription: {
    fontSize: 14,
    color: "#6c757d",
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: "#4a9d6f",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4a9d6f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
