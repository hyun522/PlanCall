import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEvents } from "../contexts/EventContext";
import { TransportMethod } from "../types";
import { parseEventDate } from "../utils/dateValidation";

export default function EventListScreen() {
  const { events } = useEvents();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const getTransportIcon = (method: TransportMethod) => {
    switch (method) {
      case "car":
        return "car";
      case "transit":
        return "bus";
      default:
        return "car";
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>내 일정</Text>
          <Text style={styles.subtitle}>등록된 일정 {events.length}개</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>
      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={32} color="#6c757d" />
            </View>
            <Text style={styles.emptyTitle}>아직 일정이 없어요</Text>
            <Text style={styles.emptyDescription}>첫 일정을 추가해보세요</Text>
          </View>
        ) : (
          <View style={styles.eventList}>
            {events.map((event) => {
              const eventDate = parseEventDate(event.eventDate);
              const isToday =
                eventDate !== null &&
                format(new Date(), "yyyy-MM-dd") === event.eventDate;
              const eventDateLabel = eventDate
                ? format(eventDate, "M월 d일 (EEE)", {
                    locale: ko,
                  })
                : "날짜 확인 필요";

              return (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => router.push(`/edit-event?eventId=${event.id}`)}
                >
                  <View style={styles.eventHeader}>
                    <View style={styles.eventTitleContainer}>
                      <Text style={styles.eventName}>{event.eventName}</Text>
                      <View style={styles.eventDateRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color="#6c757d"
                        />
                        <Text style={styles.eventDate}>
                          {isToday ? "오늘" : eventDateLabel} {event.eventTime}
                        </Text>
                      </View>
                    </View>
                    {isToday && (
                      <View style={styles.dDayBadge}>
                        <Text style={styles.dDayText}>D-Day</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.eventDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color="#6c757d"
                      />
                      <Text style={styles.detailText}>{event.location}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons
                        name={getTransportIcon(event.transportMethod) as any}
                        size={16}
                        color="#6c757d"
                      />
                      <Text style={styles.detailText}>
                        {event.travelTimeMinutes}분 소요
                      </Text>
                    </View>
                  </View>

                  <View style={styles.timeGrid}>
                    <View style={styles.timeCard}>
                      <Text style={styles.timeLabel}>출발 시간</Text>
                      <View style={styles.timeRow}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#4a9d6f"
                        />
                        <Text style={styles.departureTime}>
                          {event.departureTime}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.timeCard}>
                      <Text style={styles.timeLabel}>도착 예정</Text>
                      <View style={styles.timeRow}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#1a1a1a"
                        />
                        <Text style={styles.arrivalTime}>
                          {event.arrivalTime}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/add-event")}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafbfc",
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#4a9d6f",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6c757d",
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e8f5ed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#6c757d",
  },
  eventList: {
    gap: 16,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  eventTitleContainer: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  eventDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventDate: {
    fontSize: 14,
    color: "#6c757d",
  },
  dDayBadge: {
    backgroundColor: "#ff8c42",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dDayText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  eventDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#6c757d",
  },
  timeGrid: {
    flexDirection: "row",
    gap: 12,
  },
  timeCard: {
    flex: 1,
    backgroundColor: "#e8f5ed",
    borderRadius: 8,
    padding: 12,
  },
  timeLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  departureTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a9d6f",
  },
  arrivalTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  addButton: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#4a9d6f",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4a9d6f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
