import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications"; //모듈 전체를 하나의 객체로 가져오는 문법 작명한 이름에 담기
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEvents } from "../contexts/EventContext";

type MinuteSettingField = "preparationTime" | "extraTime";

const MINUTE_OPTIONS = Array.from({ length: 25 }, (_, index) => index * 5);

export default function SettingsScreen() {
  const { settings, updateSettings } = useEvents();
  const router = useRouter();
  const [selectedMinuteField, setSelectedMinuteField] =
    useState<MinuteSettingField | null>(null);

  const [formData, setFormData] = useState({
    preparationTime: settings.preparationTime,
    extraTime: settings.extraTime,
    departureNotification: settings.departureNotification,
    arrivalNotification: settings.arrivalNotification,
  });

  const handleSave = () => {
    updateSettings(formData);
    router.back();
  };

  const scheduleTestNotification = async () => {
    const permission = await Notifications.getPermissionsAsync(); //현재 알림 권한 상태 확인
    let finalStatus = permission.status;

    if (finalStatus !== "granted") {
      //허용안됨
      const requestedPermission = await Notifications.requestPermissionsAsync({
        //알림권한 확인후 없으면 팝업 확인
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = requestedPermission.status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "알림 권한 필요",
        "알림 권한을 허용한 뒤 다시 시도해 주세요.",
      );
      return;
    }

    await Notifications.scheduleNotificationAsync({
      //알림예약
      content: {
        title: "PlanCall",
        body: "10초 뒤 알림 테스트 성공",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
      },
    });

    Alert.alert("알림 테스트", "10초 뒤 테스트 알림이 발송됩니다.");
  };

  const handleSelectMinute = (value: number) => {
    if (!selectedMinuteField) {
      return;
    }

    setFormData((current) => ({
      ...current,
      [selectedMinuteField]: value,
    }));
    setSelectedMinuteField(null);
  };

  const renderMinuteSelector = (field: MinuteSettingField, value: number) => (
    <TouchableOpacity
      style={[styles.minuteSelectButton, { flex: 1 }]}
      activeOpacity={0.8}
      onPress={() => setSelectedMinuteField(field)}
    >
      <Text style={styles.minuteSelectText}>{value}</Text>
      <Ionicons name="chevron-down" size={20} color="#4a9d6f" />
    </TouchableOpacity>
  );

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
            {renderMinuteSelector("preparationTime", formData.preparationTime)}
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
            {renderMinuteSelector("extraTime", formData.extraTime)}
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

        {/* TODO: 실제 일정 알림 연동 전 로컬 알림 검증용 임시 UI입니다. */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={20} color="#4a9d6f" />
            <Text style={styles.sectionTitle}>알림 테스트</Text>
          </View>
          <Text style={styles.sectionDescription}>
            버튼을 누르면 10초 뒤 테스트 알림을 보냅니다
          </Text>
          <TouchableOpacity
            style={styles.testNotificationButton}
            activeOpacity={0.8}
            onPress={scheduleTestNotification}
          >
            <Text style={styles.testNotificationButtonText}>알림 테스트</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장하기</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={selectedMinuteField !== null}
        onRequestClose={() => setSelectedMinuteField(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>시간 선택</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedMinuteField(null)}
              >
                <Ionicons name="close" size={22} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.minuteOptionList}>
              {MINUTE_OPTIONS.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.minuteOption,
                    selectedMinuteField &&
                      formData[selectedMinuteField] === value &&
                      styles.minuteOptionActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleSelectMinute(value)}
                >
                  <Text
                    style={[
                      styles.minuteOptionText,
                      selectedMinuteField &&
                        formData[selectedMinuteField] === value &&
                        styles.minuteOptionTextActive,
                    ]}
                  >
                    {value}분
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  minuteSelectButton: {
    height: 48,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  minuteSelectText: {
    fontSize: 16,
    color: "#1a1a1a",
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
  testNotificationButton: {
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4a9d6f",
    justifyContent: "center",
    alignItems: "center",
  },
  testNotificationButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a9d6f",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  modalCloseButton: {
    padding: 4,
  },
  minuteOptionList: {
    marginHorizontal: -8,
  },
  minuteOption: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  minuteOptionActive: {
    backgroundColor: "#e8f5ed",
  },
  minuteOptionText: {
    fontSize: 16,
    color: "#1a1a1a",
  },
  minuteOptionTextActive: {
    color: "#4a9d6f",
    fontWeight: "600",
  },
});
