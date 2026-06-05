import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
// TODO: MVP 범위 조정으로 일정 수정 기능 임시 비활성화
// import { isValidEventDate } from "../utils/dateValidation";

export default function EditEventScreen() {
  const { events, deleteEvent } = useEvents();
  // TODO: MVP 범위 조정으로 일정 수정 기능 임시 비활성화
  // const { events, updateEvent, deleteEvent } = useEvents();
  const router = useRouter();
  const { eventId } = useLocalSearchParams();

  const event = events.find((e) => e.id === eventId);

  const [formData, setFormData] = useState({
    eventName: event?.eventName || "",
    eventDate: event?.eventDate || "",
    eventTime: event?.eventTime || "",
    location: event?.location || "",
  });

  if (!event) {
    router.back();
    return null;
  }

  // TODO: MVP 범위 조정으로 일정 수정 기능 임시 비활성화
  // const handleSave = () => {
  //   if (!isFormValid) {
  //     return;
  //   }
  //
  //   updateEvent(eventId as string, {
  //     ...event,
  //     ...formData,
  //   });
  //   router.back();
  // };
  //
  // const isFormValid = Boolean(
  //   formData.eventName &&
  //     isValidEventDate(formData.eventDate) &&
  //     formData.eventTime &&
  //     formData.location,
  // );

  const handleDelete = () => {
    deleteEvent(eventId as string);
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
        <Text style={styles.title}>일정 수정</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.field}>
          <Text style={styles.label}>일정 이름</Text>
          <TextInput
            style={styles.input}
            value={formData.eventName}
            onChangeText={(text) =>
              setFormData({ ...formData, eventName: text })
            }
          />
        </View>

        <View style={styles.field}>
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

        <View style={styles.field}>
          <Text style={styles.label}>시간</Text>
          <TextInput
            style={styles.input}
            value={formData.eventTime}
            onChangeText={(text) =>
              setFormData({ ...formData, eventTime: text })
            }
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>장소</Text>
          <TextInput
            style={styles.input}
            value={formData.location}
            onChangeText={(text) =>
              setFormData({ ...formData, location: text })
            }
          />
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
          <Text style={styles.deleteButtonText}>삭제하기</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        {/* TODO: MVP 범위 조정으로 일정 수정 기능 임시 비활성화 */}
        {/* <TouchableOpacity
          style={[styles.saveButton, !isFormValid && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={!isFormValid}
        >
          <Text style={styles.saveButtonText}>저장하기</Text>
        </TouchableOpacity> */}
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
  field: {
    marginBottom: 20,
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
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 8,
    marginTop: 20,
  },
  deleteButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
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
  buttonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
