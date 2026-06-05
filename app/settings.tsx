import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useEvents } from "../contexts/EventContext";

export default function SettingsScreen() {
  const { settings, updateSettings } = useEvents();
  const router = useRouter();

  const [formData, setFormData] = useState({
    arrivalBuffer: settings.arrivalBuffer,
    defaultDepartureLocation: settings.defaultDepartureLocation,
    extraTime: settings.extraTime,
    departureNotification: settings.departureNotification,
    arrivalNotification: settings.arrivalNotification,
  });

  const handleSave = () => {
    updateSettings(formData);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>설정</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 준비 시간 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color="#4a9d6f" />
            <Text style={styles.sectionTitle}>준비 시간</Text>
          </View>
          <Text style={styles.sectionDescription}>
            집을 나가기 전 준비에 필요한 시간(분)
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              keyboardType="number-pad"
              value={String(formData.arrivalBuffer)}
              onChangeText={(text) =>
                setFormData({ ...formData, arrivalBuffer: parseInt(text) || 0 })
              }
            />
            <Text style={styles.unit}>분</Text>
          </View>
        </View>

        {/* 여유 시간 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color="#4a9d6f" />
            <Text style={styles.sectionTitle}>여유 시간</Text>
          </View>
          <Text style={styles.sectionDescription}>
            예상치 못한 상황을 대비해 추가로 확보할 시간(분)
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              keyboardType="number-pad"
              value={String(formData.extraTime)}
              onChangeText={(text) =>
                setFormData({ ...formData, extraTime: parseInt(text) || 0 })
              }
            />
            <Text style={styles.unit}>분</Text>
          </View>
        </View>

        {/* 알림 설정 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={20} color="#4a9d6f" />
            <Text style={styles.sectionTitle}>알림 설정</Text>
          </View>
          <Text style={styles.sectionDescription}>
            일정에 대한 알림을 관리하세요
          </Text>

          <View style={styles.switchCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>출발 알림</Text>
              <Text style={styles.switchDescription}>
                출발 시간에 알림을 받습니다
              </Text>
            </View>
            <Switch
              value={formData.departureNotification}
              onValueChange={(value) =>
                setFormData({ ...formData, departureNotification: value })
              }
              trackColor={{ false: "#d1d5db", true: "#4a9d6f" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.switchCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>준비 알림</Text>
              <Text style={styles.switchDescription}>
                준비 시간에 알림을 받습니다
              </Text>
            </View>
            <Switch
              value={formData.arrivalNotification}
              onValueChange={(value) =>
                setFormData({ ...formData, arrivalNotification: value })
              }
              trackColor={{ false: "#d1d5db", true: "#4a9d6f" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafbfc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 16 : 48,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4a9d6f",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  unit: {
    fontSize: 16,
    color: "#6c757d",
  },
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: "#6c757d",
  },
  footer: {
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  saveButton: {
    height: 56,
    backgroundColor: "#4a9d6f",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
