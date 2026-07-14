import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  AppStateStatus,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SearchLocationModal from "../components/SearchLocationModal";
import { useEvents } from "../contexts/EventContext";
import { LocationSearchTarget, SelectedPlace, TransportMethod } from "../types";
import { isValidEventDate } from "../utils/dateValidation";
import {
  calculateArrivalTime,
  calculateDepartureTime,
  calculatePreparationStartTime,
  calculateTravelTime,
  fetchTransitRoutes, //요약본 총시간 반환
  TransitRouteResult,
} from "../utils/travelCalculator";

type PickerMode = "date" | "time";
type TransportOption = {
  value: TransportMethod;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

const TRANSPORT_OPTIONS: TransportOption[] = [
  { value: "car", icon: "car", label: "자차" },
  { value: "transit", icon: "bus", label: "대중교통" },
];

// TODO: Remove this after local notification verification. Development only.
const TEST_NOTIFICATION = true;
const TEST_NOTIFICATION_DELAY_SECONDS = 5;

const padTwoDigits = (value: number) => value.toString().padStart(2, "0");

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${padTwoDigits(date.getMonth() + 1)}-${padTwoDigits(
    date.getDate(),
  )}`;

const formatTime = (date: Date) =>
  `${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}`;

const getTimeMinutes = (time: string) => {
  //12:30
  const [hours, minutes] = time.split(":").map(Number); //12,30

  return hours * 60 + minutes; //12*60 +minutes
};

const getNotificationDate = (
  eventDate: string,
  eventTime: string,
  notificationTime: string,
) => {
  const [year, month, day] = eventDate.split("-").map(Number); //약속일정
  const [hours, minutes] = notificationTime.split(":").map(Number); //알림일정
  const notificationDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (getTimeMinutes(notificationTime) > getTimeMinutes(eventTime)) {
    //알림시간 > 약속시간
    notificationDate.setDate(notificationDate.getDate() - 1); //날짜 하루 당ㅣㅣ
  }

  return notificationDate; //Sat Jun 20 2026 08:30:00 GMT+0900
};

const getTestNotificationDate = () =>
  new Date(Date.now() + TEST_NOTIFICATION_DELAY_SECONDS * 1000);

const getInitialFormData = () => {
  const now = new Date();

  return {
    eventName: "",
    eventDate: formatDate(now),
    eventTime: formatTime(now),
    location: "",
    locationPlace: null as SelectedPlace | null,
    departureLocation: "",
    departurePlace: null as SelectedPlace | null,
    transportMethod: "transit" as TransportMethod,
  };
};

const isAndroidRuntimeNotificationPermissionRequired = () =>
  Platform.OS === "android" && Number(Platform.Version) >= 33;

const checkNotificationPermission = async (onOpenSettings?: () => void) => {
  if (
    Platform.OS === "android" &&
    !isAndroidRuntimeNotificationPermissionRequired()
  ) {
    return true;
  }

  const permission = await Notifications.getPermissionsAsync();

  if (permission.status === "granted") {
    return true;
  }

  if (Platform.OS === "android" && permission.canAskAgain) {
    const requestedPermission = await Notifications.requestPermissionsAsync();

    if (requestedPermission.status === "granted") {
      return true;
    }
  }

  Alert.alert(
    "알림 권한 필요",
    "출발 시간 알림을 받으려면 알림 권한이 필요합니다.",
    [
      { text: "취소", style: "cancel" },
      {
        text: "설정으로 이동",
        onPress: () => {
          onOpenSettings?.();
          Linking.openSettings().catch((error) => {
            console.error("Failed to open settings:", error);
          });
        },
      },
    ],
  );

  return false;
};

const getPickerDate = (eventDate: string, eventTime: string) => {
  const [year, month, day] = eventDate.split("-").map(Number);
  const [hours, minutes] = eventTime.split(":").map(Number);
  const fallback = new Date();

  return new Date(
    Number.isFinite(year) ? year : fallback.getFullYear(),
    Number.isFinite(month) ? month - 1 : fallback.getMonth(),
    Number.isFinite(day) ? day : fallback.getDate(),
    Number.isFinite(hours) ? hours : fallback.getHours(),
    Number.isFinite(minutes) ? minutes : fallback.getMinutes(),
  );
};

export default function AddEventScreen() {
  const { addEvent, settings } = useEvents();
  const router = useRouter();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const shouldRecheckNotificationPermissionRef = useRef(false); //"설정으로 이동 버튼을 눌렀는지 기억하는 플래그"

  const [formData, setFormData] = useState(getInitialFormData);

  const [calculated, setCalculated] = useState<{
    travelTime: number;
    preparationStartTime: string;
    departureTime: string;
    arrivalTime: string;
    transitRouteSummary?: string;
  } | null>(null);
  const [visiblePicker, setVisiblePicker] = useState<PickerMode | null>(null);
  const [isTransitModalVisible, setIsTransitModalVisible] = useState(false);
  const [transitRoutes, setTransitRoutes] = useState<TransitRouteResult[]>([]);
  const [locationModalTarget, setLocationModalTarget] =
    useState<LocationSearchTarget | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      const returnedToActive =
        nextAppState === "active" &&
        (previousAppState === "background" || previousAppState === "inactive");

      if (
        !returnedToActive ||
        !shouldRecheckNotificationPermissionRef.current
      ) {
        return;
      }

      shouldRecheckNotificationPermissionRef.current = false;

      Notifications.getPermissionsAsync()
        .then((permission) => {
          if (permission.status === "granted") {
            Alert.alert(
              "알림 권한 허용",
              "알림 권한이 허용되었습니다. 이제 일정을 저장할 수 있습니다.",
            );
          }
        })
        .catch((error) => {
          console.error("Failed to recheck notification permission:", error);
        });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const updateScheduleDateTime = (mode: PickerMode, date: Date) => {
    setCalculated(null);
    setFormData((current) => ({
      ...current,
      eventDate: mode === "date" ? formatDate(date) : current.eventDate,
      eventTime: mode === "time" ? formatTime(date) : current.eventTime,
    }));
  };

  const handleNativePickerChange = (
    mode: PickerMode,
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === "android") {
      setVisiblePicker(null);
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    updateScheduleDateTime(mode, selectedDate);
  };

  const renderPickerField = (
    mode: PickerMode,
    label: string,
    value: string,
    placeholder: string,
    iconName: keyof typeof Ionicons.glyphMap,
  ) => {
    if (Platform.OS === "web") {
      const webPickerInputStyle = {
        ...(StyleSheet.flatten([
          styles.webPickerInput,
          !value && styles.webPickerInputPlaceholder,
        ]) as React.CSSProperties),
        appearance: "none",
        WebkitAppearance: "none",
        borderStyle: "solid",
        boxSizing: "border-box",
        fontFamily: "inherit",
        outline: "none",
      };

      return (
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>{label}</Text>
          {React.createElement("input", {
            type: mode,
            value,
            onClick: (event: React.MouseEvent<HTMLInputElement>) => {
              event.currentTarget.showPicker?.();
            },
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              const nextValue = event.target.value;
              setCalculated(null);
              setFormData((current) => ({
                ...current,
                eventDate: mode === "date" ? nextValue : current.eventDate,
                eventTime: mode === "time" ? nextValue : current.eventTime,
              }));
            },
            onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
              event.preventDefault();
            },
            onPaste: (event: React.ClipboardEvent<HTMLInputElement>) => {
              event.preventDefault();
            },
            style: webPickerInputStyle,
            "aria-label": label,
          })}
        </View>
      );
    }

    return (
      <View style={[styles.field, { flex: 1 }]}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          activeOpacity={0.8}
          onPress={() => setVisiblePicker(mode)}
        >
          <Text
            style={[
              styles.pickerButtonText,
              !value && styles.pickerButtonPlaceholder,
            ]}
          >
            {value || placeholder}
          </Text>
          <Ionicons name={iconName} size={20} color="#4a9d6f" />
        </TouchableOpacity>
      </View>
    );
  };

  const calculateSchedule = (
    travelTime: number,
    transitRouteSummary?: string,
  ) => {
    const departureTime = calculateDepartureTime(
      formData.eventTime,
      travelTime,
      settings.extraTime,
    );

    const preparationStartTime = calculatePreparationStartTime(
      departureTime,
      settings.preparationTime,
    );

    const arrivalTime = calculateArrivalTime(departureTime, travelTime);

    setCalculated({
      travelTime,
      preparationStartTime,
      departureTime,
      arrivalTime,
      transitRouteSummary,
    });
  };

  const handleCalculate = async () => {
    if (
      !formData.departureLocation ||
      !formData.location ||
      !formData.departurePlace ||
      !formData.locationPlace ||
      !isValidEventDate(formData.eventDate) ||
      !formData.eventTime
    ) {
      return;
    }

    if (formData.transportMethod === "transit") {
      try {
        const routes = await fetchTransitRoutes(
          formData.departurePlace,
          formData.locationPlace,
        );

        setTransitRoutes(routes);
        setIsTransitModalVisible(true);
      } catch (error) {
        console.error("Failed to calculate transit routes:", error);
      }
      return;
    }

    try {
      const route = await calculateTravelTime(
        formData.departurePlace,
        formData.locationPlace,
        formData.transportMethod,
      );

      console.log("Kakao driving route result", {
        distanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
        durationMinutes: route.durationMinutes,
      });

      calculateSchedule(route.durationMinutes);
    } catch (error) {
      console.error("Failed to calculate driving route:", error);
    }
  };

  const handleSelectTransitRoute = (route: TransitRouteResult) => {
    setIsTransitModalVisible(false);
    calculateSchedule(route.durationMinutes, route.summary);
  };

  const scheduleDepartureNotification = async (
    eventId: string,
    eventName: string,
    eventDate: string,
    eventTime: string,
    departureTime: string,
  ) => {
    const notificationDate = TEST_NOTIFICATION
      ? getTestNotificationDate()
      : getNotificationDate(eventDate, eventTime, departureTime);

    if (notificationDate <= new Date()) {
      console.log("Skip past departure notification", {
        eventId,
        notificationDate,
      });
      return;
    }

    return Notifications.scheduleNotificationAsync({
      content: {
        title: "출발 시간입니다.",
        body: `${eventTime} ${eventName}에 출발하세요.`,
        data: { eventId, notificationType: "departure" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationDate,
      },
    });
  };

  const schedulePreparationNotification = async (
    eventId: string,
    eventName: string,
    eventDate: string,
    eventTime: string,
    preparationStartTime: string,
  ) => {
    if (!TEST_NOTIFICATION && settings.preparationTime <= 0) {
      return;
    }

    const notificationDate = TEST_NOTIFICATION
      ? getTestNotificationDate()
      : getNotificationDate(eventDate, eventTime, preparationStartTime);

    if (notificationDate <= new Date()) {
      //알림 시간은 현재 시간이 지난 기점으로만 가ㅇ
      console.log("Skip past preparation notification", {
        eventId,
        notificationDate,
      });
      return;
    }

    return Notifications.scheduleNotificationAsync({
      content: {
        title: "준비를 시작할 시간입니다.",
        body: `${eventTime} ${eventName}을 위해 준비를 시작하세요.`,
        data: { eventId, notificationType: "preparation" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationDate,
      },
    });
  };

  const handleSelectPlace = (place: SelectedPlace) => {
    if (!locationModalTarget) {
      return;
    }

    setCalculated(null);
    setFormData((current) => {
      if (locationModalTarget === "destination") {
        return {
          ...current,
          location: place.name,
          locationPlace: place,
        };
      }

      return {
        ...current,
        departureLocation: place.name,
        departurePlace: place,
      };
    });
    setLocationModalTarget(null);
  };

  const handleSave = async () => {
    if (
      !calculated ||
      !formData.eventName ||
      !isValidEventDate(formData.eventDate) ||
      !formData.eventTime
    ) {
      return;
    }

    const hasNotificationPermission = await checkNotificationPermission(() => {
      shouldRecheckNotificationPermissionRef.current = true;
    });

    if (!hasNotificationPermission) {
      return;
    }

    const eventId = Date.now().toString();
    let departureNotificationId: string | undefined;
    let preparationNotificationId: string | undefined;

    try {
      departureNotificationId = await scheduleDepartureNotification(
        eventId,
        formData.eventName,
        formData.eventDate,
        formData.eventTime,
        calculated.departureTime,
      );
      preparationNotificationId = await schedulePreparationNotification(
        eventId,
        formData.eventName,
        formData.eventDate,
        formData.eventTime,
        calculated.preparationStartTime,
      );
    } catch (error) {
      console.error("Failed to schedule event notifications:", error);
    }

    const newEvent = {
      id: eventId,
      eventName: formData.eventName,
      eventDate: formData.eventDate,
      eventTime: formData.eventTime,
      location: formData.location,
      departureLocation: formData.departureLocation,
      locationPlace: formData.locationPlace ?? undefined,
      departurePlace: formData.departurePlace ?? undefined,
      transportMethod: formData.transportMethod,
      travelTimeMinutes: calculated.travelTime,
      // TODO: Add selectedRouteSummary when the Event model is updated.
      departureTime: calculated.departureTime,
      arrivalTime: calculated.arrivalTime,
      departureNotificationId,
      preparationNotificationId,
    };

    addEvent(newEvent);

    router.back();
  };

  const isFormValid = Boolean(
    formData.eventName &&
    isValidEventDate(formData.eventDate) &&
    formData.eventTime &&
    formData.location &&
    formData.departureLocation &&
    formData.locationPlace &&
    formData.departurePlace,
  );
  const canSave = isFormValid && calculated !== null;

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
            placeholderTextColor="#8a8f98"
            placeholder="예: 길동과 점심만찬"
            value={formData.eventName}
            onChangeText={(text) =>
              setFormData({ ...formData, eventName: text })
            }
          />
        </View>

        <View style={styles.row}>
          {renderPickerField(
            "date",
            "날짜",
            formData.eventDate,
            "날짜 선택",
            "calendar-outline",
          )}
          {renderPickerField(
            "time",
            "시간",
            formData.eventTime,
            "시간 선택",
            "time-outline",
          )}
        </View>

        {visiblePicker && Platform.OS !== "web" && (
          <DateTimePicker
            value={getPickerDate(formData.eventDate, formData.eventTime)}
            mode={visiblePicker}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) =>
              handleNativePickerChange(visiblePicker, event, selectedDate)
            }
          />
        )}

        <View style={styles.field}>
          <Text style={styles.label}>출발지</Text>
          <TouchableOpacity
            style={styles.searchField}
            activeOpacity={0.8}
            onPress={() => setLocationModalTarget("departure")}
          >
            <Text
              style={[
                styles.searchFieldText,
                !formData.departureLocation && styles.searchFieldPlaceholder,
              ]}
            >
              {formData.departureLocation || "출발 위치 입력"}
            </Text>
            <Ionicons name="search" size={20} color="#4a9d6f" />
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>목적지</Text>
          <TouchableOpacity
            style={styles.searchField}
            activeOpacity={0.8}
            onPress={() => setLocationModalTarget("destination")}
          >
            <Text
              style={[
                styles.searchFieldText,
                !formData.location && styles.searchFieldPlaceholder,
              ]}
            >
              {formData.location || "행사 장소 입력"}
            </Text>
            <Ionicons name="search" size={20} color="#4a9d6f" />
          </TouchableOpacity>
        </View>

        {/* Transport Methods */}
        <View style={styles.field}>
          <Text style={styles.label}>이동 수단</Text>
          <View style={styles.transportGrid}>
            {TRANSPORT_OPTIONS.map(({ value, icon, label }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.transportButton,
                  formData.transportMethod === value &&
                    styles.transportButtonActive,
                ]}
                onPress={() => {
                  setCalculated(null);
                  setIsTransitModalVisible(false);
                  setFormData((current) => ({
                    ...current,
                    transportMethod: value,
                  }));
                }}
              >
                <Ionicons
                  name={icon}
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
          <Text style={styles.calculateButtonText}>
            {formData.transportMethod === "transit"
              ? "경로 선택하기"
              : "시간 계산하기"}
          </Text>
        </TouchableOpacity>

        {calculated && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>계산 결과</Text>
            {calculated.transitRouteSummary && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>선택 경로</Text>
                <Text style={styles.resultValue}>
                  {calculated.transitRouteSummary}
                </Text>
              </View>
            )}
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>예상 소요 시간</Text>
              <Text style={styles.resultValue}>{calculated.travelTime}분</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>준비 시작</Text>
              <Text style={[styles.resultValue, { color: "#4a9d6f" }]}>
                {calculated.preparationStartTime}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>출발 시간</Text>
              <Text style={styles.resultValue}>{calculated.departureTime}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>도착 예정 시간</Text>
              <Text style={styles.resultValue}>{calculated.arrivalTime}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* {calculated && ( */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Ionicons
            name="checkmark"
            size={20}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.saveButtonText}>저장하기</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>저장하면 알림이 자동으로 등록돼요</Text>
      </View>
      {/* )} */}

      <Modal
        animationType="slide"
        transparent
        visible={isTransitModalVisible}
        onRequestClose={() => setIsTransitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>대중교통 경로 선택</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsTransitModalVisible(false)}
              >
                <Ionicons name="close" size={22} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.routeListContent}
            >
              {transitRoutes.slice(0, 8).map((route) => (
                <TouchableOpacity
                  key={route.id}
                  style={styles.routeOption}
                  activeOpacity={0.8}
                  onPress={() => handleSelectTransitRoute(route)}
                >
                  <Text style={styles.routeDuration}>
                    {route.durationMinutes}분
                  </Text>
                  <Text style={styles.routeSummary}>{route.summary}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SearchLocationModal
        visible={locationModalTarget !== null}
        target={locationModalTarget ?? "destination"}
        onClose={() => setLocationModalTarget(null)}
        onSelectPlace={handleSelectPlace}
      />
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
  pickerButton: {
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
  pickerButtonText: {
    fontSize: 16,
    color: "#1a1a1a",
  },
  pickerButtonPlaceholder: {
    color: "#8a8f98",
  },
  webPickerInput: {
    height: 48,
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingLeft: 16,
    paddingRight: 16,
    fontSize: 16,
    lineHeight: 20,
    backgroundColor: "#FFFFFF",
    color: "#1a1a1a",
  },
  webPickerInputPlaceholder: {
    color: "#8a8f98",
  },
  searchField: {
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
  searchFieldText: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
  },
  searchFieldPlaceholder: {
    color: "#8a8f98",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  routeListContent: {
    gap: 12,
  },
  routeOption: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    gap: 6,
  },
  routeDuration: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4a9d6f",
  },
  routeSummary: {
    fontSize: 15,
    color: "#1a1a1a",
  },
});
