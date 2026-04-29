import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useEvents } from "../contexts/EventContext";
import {
  calculateArrivalTime,
  calculateDepartureTime,
  calculateTravelTime,
} from "../utils/travelCalculator";

export default function AddEventScreen() {
  const { addEvent, settings } = useEvents();
  const router = useRouter();

  const [formData, setFormData] = useState({
    eventName: "",
    eventDate: "",
    eventTime: "",
    location: "",
    departureLocation: settings.defaultDepartureLocation,
    transportMethod: "transit" as "car" | "transit" | "walk",
  });

  const [calculated, setCalculated] = useState<{
    travelTime: number;
    departureTime: string;
    arrivalTime: string;
  } | null>(null);

  const handleCalculate = () => {
    if (
      !formData.departureLocation ||
      !formData.location ||
      !formData.eventTime
    ) {
      return;
    }

    const travelTime = calculateTravelTime(
      formData.departureLocation,
      formData.location,
      formData.transportMethod,
    );

    const departureTime = calculateDepartureTime(
      formData.eventTime,
      travelTime,
      settings.arrivalBuffer,
      settings.extraTime,
    );

    const arrivalTime = calculateArrivalTime(departureTime, travelTime);

    setCalculated({
      travelTime,
      departureTime,
      arrivalTime,
    });
  };

  const handleSave = () => {
    if (
      !calculated ||
      !formData.eventName ||
      !formData.eventDate ||
      !formData.eventTime
    ) {
      return;
    }

    const newEvent = {
      id: Date.now().toString(),
      eventName: formData.eventName,
      eventDate: formData.eventDate,
      eventTime: formData.eventTime,
      location: formData.location,
      departureLocation: formData.departureLocation,
      transportMethod: formData.transportMethod,
      travelTimeMinutes: calculated.travelTime,
      departureTime: calculated.departureTime,
      arrivalTime: calculated.arrivalTime,
    };

    addEvent(newEvent);
    router.back();
  };

  const isFormValid =
    formData.eventName &&
    formData.eventDate &&
    formData.eventTime &&
    formData.location &&
    formData.departureLocation;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>일정 추가</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Form Fields */}
        <View style={styles.field}>
          <Text style={styles.label}>일정 이름</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 친구 결혼식"
            value={formData.eventName}
            onChangeText={(text) =>
              setFormData({ ...formData, eventName: text })
            }
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>날짜</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.eventDate}
              onChangeText={(text) =>
                setFormData({ ...formData, eventDate: text })
              }
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>시간</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM"
              value={formData.eventTime}
              onChangeText={(text) =>
                setFormData({ ...formData, eventTime: text })
              }
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>목적지</Text>
          <TextInput
            style={styles.input}
            placeholder="행사 장소 입력"
            value={formData.location}
            onChangeText={(text) =>
              setFormData({ ...formData, location: text })
            }
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>출발지</Text>
          <TextInput
            style={styles.input}
            placeholder="출발 위치 입력"
            value={formData.departureLocation}
            onChangeText={(text) =>
              setFormData({ ...formData, departureLocation: text })
            }
          />
        </View>

        {/* Transport Methods */}
        <View style={styles.field}>
          <Text style={styles.label}>이동 수단</Text>
          <View style={styles.transportGrid}>
            {[
              { value: "car", icon: "car", label: "자차" },
              { value: "transit", icon: "bus", label: "대중교통" },
              { value: "walk", icon: "walk", label: "도보" },
            ].map(({ value, icon, label }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.transportButton,
                  formData.transportMethod === value &&
                    styles.transportButtonActive,
                ]}
                onPress={() =>
                  setFormData({ ...formData, transportMethod: value as any })
                }
              >
                <Ionicons
                  name={icon as any}
                  size={24}
                  color={
                    formData.transportMethod === value ? "#FFFFFF" : "#4a9d6f"
                  }
                />
                <Text
                  style={[
                    styles.transportLabel,
                    formData.transportMethod === value &&
                      styles.transportLabelActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.calculateButton,
            !isFormValid && styles.buttonDisabled,
          ]}
          onPress={handleCalculate}
          disabled={!isFormValid}
        >
          <Text style={styles.calculateButtonText}>시간 계산하기</Text>
        </TouchableOpacity>

        {calculated && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>계산 결과</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>예상 소요 시간</Text>
              <Text style={styles.resultValue}>{calculated.travelTime}분</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>출발 시간</Text>
              <Text style={[styles.resultValue, { color: "#4a9d6f" }]}>
                {calculated.departureTime}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>도착 예정 시간</Text>
              <Text style={styles.resultValue}>{calculated.arrivalTime}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {calculated && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons
              name="checkmark"
              size={20}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.saveButtonText}>저장하기</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>
            저장하면 알림이 자동으로 등록돼요
          </Text>
        </View>
      )}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
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
  field: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
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
  transportGrid: {
    flexDirection: "row",
    gap: 12,
  },
  transportButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    gap: 8,
  },
  transportButtonActive: {
    backgroundColor: "#4a9d6f",
    borderColor: "#4a9d6f",
  },
  transportLabel: {
    fontSize: 14,
    color: "#1a1a1a",
  },
  transportLabelActive: {
    color: "#FFFFFF",
  },
  calculateButton: {
    height: 56,
    backgroundColor: "#e8f5ed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a9d6f",
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#e8f5ed",
    borderRadius: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: "#6c757d",
  },
  resultValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  footer: {
    padding: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButton: {
    height: 56,
    backgroundColor: "#4a9d6f",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4a9d6f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  footerText: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
    marginTop: 8,
  },
});
