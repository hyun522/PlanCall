import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Event, EventContextType, Settings } from "../types";

const EventContext = createContext<EventContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = {
  hasCompletedOnboarding: false,
  defaultDepartureLocation: "",
  arrivalBuffer: 60,
  extraTime: 15,
  departureNotification: true,
  arrivalNotification: false,
};

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [pendingLocationSelection, setPendingLocationSelectionState] =
    useState<EventContextType["pendingLocationSelection"]>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [eventsData, settingsData] = await Promise.all([
        AsyncStorage.getItem("events"),
        AsyncStorage.getItem("settings"),
      ]);

      if (eventsData) {
        setEvents(JSON.parse(eventsData));
      }
      if (settingsData) {
        setSettings(JSON.parse(settingsData));
      }
      setIsLoaded(true);
    } catch (error) {
      console.error("Failed to load data:", error);
      setIsLoaded(true);
    }
  }, []);

  const saveData = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem("events", JSON.stringify(events)),
        AsyncStorage.setItem("settings", JSON.stringify(settings)),
      ]);
    } catch (error) {
      console.error("Failed to save data:", error);
    }
  }, [events, settings]);

  // Load data from AsyncStorage
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      saveData();
    }
  }, [isLoaded, saveData]);

  const addEvent = useCallback((event: Event) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const updateEvent = useCallback((id: string, updatedEvent: Event) => {
    setEvents((prev) =>
      prev.map((event) => (event.id === id ? updatedEvent : event)),
    );
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const setPendingLocationSelection: EventContextType["setPendingLocationSelection"] =
    useCallback((selection) => {
      setPendingLocationSelectionState(selection);
    }, []);

  const clearPendingLocationSelection = useCallback(() => {
    setPendingLocationSelectionState(null);
  }, []);

  const value = useMemo<EventContextType>(
    () => ({
      events,
      settings,
      isLoaded,
      addEvent,
      updateEvent,
      deleteEvent,
      updateSettings,
      pendingLocationSelection,
      setPendingLocationSelection,
      clearPendingLocationSelection,
    }),
    [
      events,
      settings,
      isLoaded,
      addEvent,
      updateEvent,
      deleteEvent,
      updateSettings,
      pendingLocationSelection,
      setPendingLocationSelection,
      clearPendingLocationSelection,
    ],
  );

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvents must be used within EventProvider");
  }
  return context;
}
