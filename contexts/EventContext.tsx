import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, Settings, EventContextType } from '../types';

const EventContext = createContext<EventContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = {
  hasCompletedOnboarding: false,
  defaultDepartureLocation: '',
  arrivalBuffer: 60,
  extraTime: 15,
  departureNotification: true,
  arrivalNotification: false,
};

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from AsyncStorage
  useEffect(() => {
    loadData();
  }, []);

  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      saveData();
    }
  }, [events, settings, isLoaded]);

  const loadData = async () => {
    try {
      const [eventsData, settingsData] = await Promise.all([
        AsyncStorage.getItem('events'),
        AsyncStorage.getItem('settings'),
      ]);

      if (eventsData) {
        setEvents(JSON.parse(eventsData));
      }
      if (settingsData) {
        setSettings(JSON.parse(settingsData));
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load data:', error);
      setIsLoaded(true);
    }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem('events', JSON.stringify(events)),
        AsyncStorage.setItem('settings', JSON.stringify(settings)),
      ]);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const addEvent = (event: Event) => {
    setEvents((prev) => [...prev, event]);
  };

  const updateEvent = (id: string, updatedEvent: Event) => {
    setEvents((prev) =>
      prev.map((event) => (event.id === id ? updatedEvent : event))
    );
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <EventContext.Provider
      value={{
        events,
        settings,
        addEvent,
        updateEvent,
        deleteEvent,
        updateSettings,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within EventProvider');
  }
  return context;
}
